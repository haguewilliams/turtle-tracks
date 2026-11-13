import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {createServer} from './server.mjs';
import {sealSession,openSession} from './inaturalist-service.mjs';
import {PrivateState} from './private-state.mjs';
import journal from './journal-core.js';

const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB1kAAAAASUVORK5CYII=';
const origin='https://turtle.test',key=Buffer.alloc(32,19),csrf='test-csrf';
const body=()=>({submissionId:randomUUID(),consent:true,geoprivacy:'obscured',publicNotes:'Walking through leaves',observation:{date:'2026-01-02',photo,gps:{lat:35,lon:-82,accuracy:10},notes:'PRIVATE JOURNAL NOTES',photoAnalysis:{sex:'male'}}});
const session=()=>({csrf,exp:Date.now()+600000,token:'test-oauth-token',user:{id:7,login:'test-naturalist'}});
const cookie=()=> '__Host-tt-inat='+sealSession(session(),key);
const reply=x=>new Response(JSON.stringify(x),{status:200});
async function fixture(run){const dir=await mkdtemp(join(tmpdir(),'turtle-inat-'));try{await run(dir)}finally{await rm(dir,{recursive:true,force:true})}}
async function serving(dir,fetchImpl,run,extra={}){
  const server=createServer({apiKey:'',allowedOrigin:origin,dataDirectory:dir,durable:true,inatOptions:{clientId:'test-client',clientSecret:'test-client-secret',sessionKey:key.toString('hex'),enabled:true,requestInterval:0},fetchImpl,...extra}).listen(0,'127.0.0.1');await once(server,'listening');
  try{await run('http://127.0.0.1:'+server.address().port)}finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
}
const post=(url,path,data,headers={})=>fetch(url+'/api/inaturalist/'+path,{method:'POST',headers:{Origin:origin,Cookie:cookie(),'X-TT-CSRF':csrf,'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
function provider(){
  const p={creates:0,uploads:0,observation:null,photo:null,loseCreate:false,losePhoto:false,visible:true,createReject:false};
  p.fetch=async(url,options)=>{
    if(url.endsWith('/users/api_token'))return reply({api_token:'test-jwt'});
    if(url.endsWith('/observations')&&options.method==='POST'){
      p.creates++;if(p.createReject)return new Response('sensitive provider error',{status:422});
      const o=JSON.parse(options.body).observation;
      assert.equal(options.headers.Authorization,'test-jwt');assert.doesNotMatch(options.body,/PRIVATE JOURNAL|photoAnalysis|male/);
      p.observation={...o,id:901,user:{id:7},observation_photos:[]};if(p.loseCreate)throw Error('lost');return reply(p.observation);
    }
    if(url.endsWith('/observation_photos')){
      p.uploads++;assert.equal(options.body.get('observation_photo[observation_id]'),'901');assert.equal(options.body.get('file').type,'image/png');
      p.photo={id:50,observation_id:901,uuid:options.body.get('observation_photo[uuid]'),photo:{id:60}};p.observation.observation_photos=[p.photo];if(p.losePhoto)throw Error('lost');return reply(p.photo);
    }
    if(/\/observations\/[0-9a-f-]+$/.test(url))return reply({results:p.visible&&p.observation?[p.observation]:[]});
    throw Error('Unexpected provider request '+url);
  };return p;
}
test('unconfigured integration is visibly unavailable and performs no provider requests',()=>fixture(dir=>serving(dir,()=>{throw Error('must not call')},async url=>{
  const status=await(await fetch(url+'/api/inaturalist/status')).json();assert.equal(status.configured,false);assert.equal((await post(url,'submit',body())).status,503);
},{inatOptions:{enabled:false}})));
test('session cookies are encrypted, expire, and reject tampering',()=>{
  const encrypted=sealSession(session(),key);assert.doesNotMatch(encrypted,/test-oauth-token|test-naturalist/);assert.equal(openSession(encrypted,key).user.id,7);assert.equal(openSession(encrypted+'x',key),null);assert.equal(openSession(encrypted,key,Date.now()+86400000),null);
});
test('writes require the same origin, a valid session, and its CSRF token',()=>fixture(dir=>serving(dir,()=>{throw Error('must not call')},async url=>{
  for(const headers of [{Origin:'https://other.test'},{Cookie:''},{'X-TT-CSRF':'wrong'},{Origin:''}])assert.equal((await post(url,'submit',body(),headers)).status,403);
})));
test('OAuth uses state and S256 PKCE and never returns provider credentials to frontend JS',()=>fixture(async dir=>{
  let verifier='',challenge='',calls=0;
  await serving(dir,async(url,options)=>{calls++;if(url.endsWith('/oauth/token')){assert.equal(options.body.get('redirect_uri'),origin+'/api/inaturalist/callback');verifier=options.body.get('code_verifier');return reply({access_token:'test-access-token'})}if(url.endsWith('/users/api_token'))return reply({api_token:'test-jwt'});if(url.endsWith('/users/me'))return reply({results:[{id:7,login:'test-naturalist'}]});throw Error('unexpected')},async url=>{
    const status=await fetch(url+'/api/inaturalist/status');const c0=status.headers.get('set-cookie').split(';')[0],s0=await status.json();assert.equal(s0.connected,false);
    const start=await post(url,'connect',{}, {Cookie:c0,'X-TT-CSRF':s0.csrf});const c1=start.headers.get('set-cookie').split(';')[0],data=await start.json();const auth=new URL(data.url);challenge=auth.searchParams.get('code_challenge');assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert.doesNotMatch(data.url,/test-client-secret/);
    const invalid=await fetch(url+'/api/inaturalist/callback?code=test-code&state=wrong',{headers:{Cookie:c1},redirect:'manual'});assert.equal(invalid.status,303);assert.equal(calls,0);
    const callback=await fetch(url+'/api/inaturalist/callback?code=test-code&state='+auth.searchParams.get('state'),{headers:{Cookie:c1},redirect:'manual'});assert.equal(callback.status,303);assert.match(callback.headers.get('location'),/inat=connected/);assert.equal(createHash('sha256').update(verifier).digest('base64url'),challenge);
    const c2=callback.headers.get('set-cookie');assert.match(c2,/HttpOnly; Secure; SameSite=Lax/);
    const connected=await(await fetch(url+'/api/inaturalist/status',{headers:{Cookie:c2.split(';')[0]}})).text();assert.match(connected,/test-naturalist/);assert.doesNotMatch(connected,/access-token|test-jwt|test-client-secret/);
  });
}));
test('invalid or unconsented contributions never reach iNaturalist',()=>fixture(dir=>serving(dir,()=>{throw Error('must not call')},async url=>{
  const invalid=[{consent:false},{geoprivacy:'open'},{publicNotes:'x'.repeat(3001)},{submissionId:'../escape'},{observation:{...body().observation,gps:{lat:91,lon:0}}},{observation:{...body().observation,photo:'https://example.com/photo.jpg'}},{observation:{...body().observation,date:'2099-01-01'}}];
  for(const patch of invalid)assert.equal((await post(url,'submit',{...body(),...patch})).status,400);
})));
test('confirmed submission sends reviewed fields and retains its receipt across restarts',()=>fixture(async dir=>{
  const p=provider(),b=body();await serving(dir,p.fetch,async url=>{
    const r=await post(url,'submit',b);assert.equal(r.status,200);const receipt=await r.json();assert.equal(receipt.state,'submitted');assert.equal(receipt.url,'https://www.inaturalist.org/observations/901');assert.equal(p.observation.geoprivacy,'obscured');assert.equal(p.observation.observed_on_string,b.observation.date);assert.equal(p.observation.taxon_id,undefined);
  });await serving(dir,p.fetch,async url=>assert.equal((await(await post(url,'submit',b)).json()).state,'submitted'));
  assert.equal(p.creates,1);assert.equal(p.uploads,1);
  const saved=await readFile(join(dir,'inat-7-'+b.submissionId+'.json'),'utf8');assert.doesNotMatch(saved,/test-oauth|test-jwt|Walking through|latitude|image\/png/);
}));
test('concurrent retries create only one observation and one attached photo',()=>fixture(dir=>{const p=provider(),b=body();return serving(dir,p.fetch,async url=>{const responses=await Promise.all([post(url,'submit',b),post(url,'submit',b)]);assert.deepEqual(responses.map(r=>r.status),[200,200]);assert.equal(p.creates,1);assert.equal(p.uploads,1)})}));
test('lost create responses are reconciled by UUID without a second create',()=>fixture(dir=>{const p=provider(),b=body();p.loseCreate=true;p.visible=false;return serving(dir,p.fetch,async url=>{
  assert.equal((await post(url,'submit',b)).status,502);let r=await(await post(url,'submit',b)).json();assert.equal(r.state,'pending');assert.equal(p.creates,1);assert.equal(p.uploads,0);
  p.visible=true;r=await(await post(url,'submit',b)).json();assert.equal(r.state,'submitted');assert.equal(p.creates,1);assert.equal(p.uploads,1);
})}));
test('lost photo responses never trigger a duplicate photo upload',()=>fixture(dir=>{const p=provider(),b=body();p.losePhoto=true;return serving(dir,p.fetch,async url=>{
  let r=await(await post(url,'submit',b)).json();assert.equal(r.state,'partial');assert.equal(r.observationId,901);p.visible=false;r=await(await post(url,'submit',b)).json();assert.equal(r.state,'pending');assert.equal(p.uploads,1);
  p.visible=true;r=await(await post(url,'submit',b)).json();assert.equal(r.state,'submitted');assert.equal(p.uploads,1);
})}));
test('changed pending payloads and another account cannot overwrite a submission',()=>fixture(dir=>{const p=provider(),b=body();p.loseCreate=true;return serving(dir,p.fetch,async url=>{
  await post(url,'submit',b);assert.equal((await post(url,'submit',{...b,publicNotes:'changed'})).status,409);
  // An authenticated lookup result for a different owner must not be accepted.
  p.observation.user.id=8;const r=await(await post(url,'submit',b)).json();assert.equal(r.state,'pending');assert.equal(p.uploads,0);
})}));
test('provider diagnostics and all private backend files remain private',()=>fixture(dir=>{const p=provider();p.createReject=true;return serving(dir,p.fetch,async url=>{const text=await(await post(url,'submit',body())).text();assert.doesNotMatch(text,/sensitive provider|test-oauth|test-client-secret/);for(const file of ['/inaturalist-service.mjs','/private-state.mjs','/inat-7-test.json'])assert.equal((await fetch(url+file)).status,404)})}));
test('durable analysis budgets survive restarts and concurrent reservations',()=>fixture(async dir=>{const a=new PrivateState(dir);assert.equal(await a.reserveAnalysis(2),true);const b=new PrivateState(dir);assert.deepEqual(await Promise.all([b.reserveAnalysis(2),b.reserveAnalysis(2)]),[true,false])}));
test('production photo analysis stays off without durable storage and an HTTPS origin',()=>fixture(dir=>serving(dir,()=>{throw Error('must not call')},async url=>{assert.equal((await(await fetch(url+'/api/status')).json()).photoAnalysis,false)},{apiKey:'test-only',production:true,durable:false})));
test('citizen-science retry IDs and confirmed receipts survive journal backups without accepting arbitrary URLs',()=>{
  const c={submissionId:randomUUID(),userId:7,state:'submitted',geoprivacy:'obscured',publicNotes:'',observationId:901,submittedAt:new Date().toISOString(),url:'javascript:bad()'};
  const [saved]=journal.parseBackup(JSON.stringify({app:'Turtle Tracks',version:3,records:[{id:'test',date:'2026-01-01',citizenScience:c}]}));assert.equal(saved.citizenScience.submissionId,c.submissionId);assert.equal(saved.citizenScience.url,undefined);assert.throws(()=>journal.validateRecords([{id:'test',date:'2026-01-01',citizenScience:{...c,observationId:null}}]),/receipt/);
});

test('a corrupted usage ledger fails closed instead of resetting the allowance',()=>fixture(async dir=>{
  const store=new PrivateState(dir);await store.put('analysis-budget',{used:'broken'});
  await assert.rejects(()=>store.reserveAnalysis(50),/Invalid usage ledger/);
}));
test('a recovered observation with unexpected location privacy never receives the photo',()=>fixture(dir=>{const p=provider(),b=body();p.loseCreate=true;return serving(dir,p.fetch,async url=>{
  await post(url,'submit',b);p.observation.geoprivacy=null;
  const response=await post(url,'submit',b);assert.equal(response.status,409);assert.equal(p.uploads,0);
})}));
test('quota rejection before an observation write remains safe to retry',()=>fixture(async dir=>{
  const p=provider(),b=body(),store=new PrivateState(dir),day=new Date().toISOString().slice(0,10);
  // The JWT call uses the last request, leaving no allowance for observation creation.
  await store.put('inat-budget',{day,used:8999});
  await serving(dir,p.fetch,async url=>{
    assert.equal((await post(url,'submit',b)).status,429);assert.equal(p.creates,0);
    const job=await store.get('inat-7-'+b.submissionId);assert.equal(job.stage,'ready');
    await store.put('inat-budget',{day,used:0});
    assert.equal((await(await post(url,'submit',b)).json()).state,'submitted');assert.equal(p.creates,1);
  });
}));
test('disconnect revokes provider access and clears the browser session',()=>fixture(dir=>serving(dir,async(url,options)=>{
  assert.equal(url,'https://www.inaturalist.org/oauth/revoke');assert.equal(options.body.get('token'),'test-oauth-token');return new Response(null,{status:204});
},async url=>{const response=await post(url,'disconnect',{});assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/Max-Age=0/)})));
