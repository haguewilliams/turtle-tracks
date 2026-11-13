import {createCipheriv,createDecipheriv,createHash,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
import Journal from './journal-core.js';

const SITE='https://www.inaturalist.org',API='https://api.inaturalist.org/v1';
const COOKIE='__Host-tt-inat';
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const digest=value=>createHash('sha256').update(value).digest('hex');
const fail=(status,message)=>Object.assign(Error(message),{status});
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const validId=value=>Number.isSafeInteger(value)&&value>0;

// Stateless encrypted HttpOnly cookie: OAuth credentials never reach frontend JS.
export function sealSession(value,key){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const body=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url')}
export function openSession(value,key,now=Date.now()){
  try{if(typeof value!=='string'||value.length>6000)return null;const bytes=Buffer.from(value,'base64url');const decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));decipher.setAuthTag(bytes.subarray(12,28));const data=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]).toString());return data.exp>now?data:null}catch{return null}
}
export function validateContribution(body,validatePhoto){
  if(body?.consent!==true)throw fail(400,'Review and agree to share this sighting first.');
  if(!uuidPattern.test(body.submissionId||''))throw fail(400,'The contribution needs a saved submission ID.');
  const r=body.observation;
  if(!r||!Journal.validDate(r.date)||r.date>new Date().toISOString().slice(0,10))throw fail(400,'Use the actual observation date, not a future date.');
  try{validatePhoto(r.photo)}catch(e){throw fail(400,e.message)}
  if(!r.gps||!Number.isFinite(r.gps.lat)||!Number.isFinite(r.gps.lon)||Math.abs(r.gps.lat)>90||Math.abs(r.gps.lon)>180)throw fail(400,'A valid sighting location is required.');
  if(r.gps.accuracy!=null&&(!Number.isFinite(r.gps.accuracy)||r.gps.accuracy<0||r.gps.accuracy>1000000))throw fail(400,'Check the location accuracy.');
  if(!['obscured','private'].includes(body.geoprivacy))throw fail(400,'Choose obscured or private location visibility.');
  const notes=body.publicNotes??'';if(typeof notes!=='string'||notes.length>3000)throw fail(400,'Keep public notes under 3,000 characters.');
  // Date only until the journal captures the observation's actual time zone.
  // Never silently infer a time zone from the current device or submit AI guesses.
  return {submissionId:body.submissionId,photo:r.photo,observation:{observed_on_string:r.date,latitude:r.gps.lat,longitude:r.gps.lon,positional_accuracy:r.gps.accuracy==null?null:Math.round(r.gps.accuracy),geoprivacy:body.geoprivacy,description:notes.trim(),species_guess:'Turtle (identification requested)'}};
}

export function createINaturalist({clientId=process.env.INAT_CLIENT_ID,clientSecret=process.env.INAT_CLIENT_SECRET,sessionKey=process.env.INAT_SESSION_KEY,enabled=process.env.INAT_ENABLED==='true',origin=process.env.APP_ORIGIN,store,fetchImpl=fetch,validatePhoto,requestInterval=1100}={}){
  let key;try{if(/^[0-9a-fA-F]{64}$/.test(sessionKey||''))key=Buffer.from(sessionKey,'hex')}catch{}
  const configured=Boolean(enabled&&clientId&&clientSecret&&key&&store&&/^https:\/\/[^/]+$/.test(origin||''));
  const callback=origin+'/api/inaturalist/callback';let nextRequest=0,pending=0,queue=Promise.resolve();
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json',...headers});res.end(JSON.stringify(data))}
  function session(req){const value=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return key?openSession(value,key):null}
  function setCookie(res,s){res.setHeader('Set-Cookie',COOKIE+'='+sealSession(s,key)+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+Math.max(0,Math.floor((s.exp-Date.now())/1000)))}
  function clearCookie(res){res.setHeader('Set-Cookie',COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')}
  function redirect(res,success){res.writeHead(303,{Location:origin+'/?inat='+(success?'connected':'connection_failed')+'#citizen-science',...headers});res.end()}
  async function provider(url,options={}){
    if(pending>=20)throw Object.assign(fail(429,'iNaturalist is busy. Please try again shortly.'),{definitelyRejected:true});pending++;
    let release;const previous=queue;queue=new Promise(r=>{release=r});await previous;
    try{
      const wait=Math.max(0,nextRequest-Date.now());if(wait)await new Promise(r=>setTimeout(r,wait));nextRequest=Date.now()+requestInterval;
      try{if(!(await store.reserveDaily('inat-budget',9000)))throw fail(429,'Today’s iNaturalist request limit has been reached. Try tomorrow.')}catch(e){e.definitelyRejected=true;throw e}
      let response;try{response=await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(30000),headers:{'User-Agent':'TurtleTracks/1.0 (+https://turtletracks.haguewilliams.com/)',Accept:'application/json',...options.headers}})}catch{throw fail(502,'The iNaturalist response was interrupted. We will check its status before retrying.')}
      if(!response.ok){const e=fail(response.status===401?401:response.status===429?429:502,response.status===401?'Reconnect your iNaturalist account.':response.status===429?'iNaturalist is busy. Try again later.':'iNaturalist could not complete this step. Your local sighting is safe.');e.definitelyRejected=response.status>=400&&response.status<500&&response.status!==408;throw e}
      if(response.status===204)return {};
      try{return await response.json()}catch{throw fail(502,'iNaturalist returned an unreadable confirmation. We will check before retrying.')}
    }finally{pending--;release()}
  }
  async function jwtFor(s){const data=await provider(SITE+'/users/api_token',{headers:{Authorization:'Bearer '+s.token}});if(typeof data.api_token!=='string')throw fail(502,'iNaturalist did not return an authorization token.');return data.api_token}
  const apiHeaders=jwt=>({Authorization:jwt});
  const receipt=(job,state)=>({state,submissionId:job.submissionId,observationId:job.observationId||null,url:job.observationId?SITE+'/observations/'+job.observationId:null,submittedAt:job.submittedAt||null});
  function ownedObservation(o,s){return validId(o?.id)&&o.user?.id===s.user.id}
  async function lookup(job,s,jwt){
    const data=await provider(API+'/observations/'+job.submissionId,{headers:apiHeaders(jwt)});
    return data.results?.find(o=>o.uuid===job.submissionId&&ownedObservation(o,s))||null;
  }
  async function submit(s,body){
    const data=validateContribution(body,validatePhoto);
    const hash=digest(JSON.stringify(data)),jobKey='inat-'+s.user.id+'-'+data.submissionId;
    return store.locked(jobKey,async()=>{
      let job=await store.get(jobKey);
      if(job?.stage==='complete')return receipt(job,'submitted');
      if(job&&job.hash!==hash)throw fail(409,'This sighting already has a submission in progress. Restore its original details or finish it on iNaturalist.');
      if(!job){job={submissionId:data.submissionId,hash,stage:'ready',photoUuid:randomUUID()};await store.put(jobKey,job)}
      const jwt=await jwtFor(s);
      if(['creating','uploading'].includes(job.stage)){
        const existing=await lookup(job,s,jwt);
        if(!existing)return receipt(job,'pending');
        if(existing.geoprivacy!==data.observation.geoprivacy)throw fail(409,'The location privacy on iNaturalist does not match your review. Check it there before continuing.');
        job.observationId=existing.id;
        if(job.stage==='uploading'){
          const attached=existing.observation_photos?.find(p=>p.uuid===job.photoUuid&&validId(p.photo?.id));
          if(!attached)return receipt(job,'pending');
          job.stage='complete';job.submittedAt=new Date().toISOString();await store.put(jobKey,job);return receipt(job,'submitted');
        }
        // A lost create response is recovered by UUID, never a second create.
        job.stage='photo_ready';await store.put(jobKey,job);
      }
      if(job.stage==='ready'){
        job.stage='creating';await store.put(jobKey,job);
        let result;
        try{result=await provider(API+'/observations',{method:'POST',headers:{...apiHeaders(jwt),'Content-Type':'application/json'},body:JSON.stringify({observation:{...data.observation,uuid:job.submissionId}})})}
        catch(e){if(e.definitelyRejected){job.stage='ready';await store.put(jobKey,job)}throw e}
        const o=Array.isArray(result)?result[0]:result;
        if(!ownedObservation(o,s)||o.uuid!==job.submissionId||o.geoprivacy!==data.observation.geoprivacy)throw fail(502,'The observation confirmation could not be verified. Check its status before retrying.');
        job.observationId=o.id;job.stage='photo_ready';await store.put(jobKey,job);
      }
      const image=/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(data.photo),form=new FormData();
      form.set('observation_photo[observation_id]',String(job.observationId));form.set('observation_photo[uuid]',job.photoUuid);
      form.set('file',new Blob([Buffer.from(image[2],'base64')],{type:image[1]}),'turtle.'+image[1].split('/')[1]);
      job.stage='uploading';await store.put(jobKey,job);
      let photo;
      try{photo=await provider(API+'/observation_photos',{method:'POST',headers:apiHeaders(jwt),body:form})}
      catch(e){if(e.definitelyRejected){job.stage='photo_ready';await store.put(jobKey,job)}return {...receipt(job,'partial'),error:e.message}}
      if(!validId(photo.id)||!validId(photo.photo?.id)||photo.observation_id!==job.observationId||photo.uuid!==job.photoUuid)return receipt(job,'pending');
      job.stage='complete';job.submittedAt=new Date().toISOString();await store.put(jobKey,job);return receipt(job,'submitted');
    });
  }
  async function handle(req,res,url,readBody){
    if(!url.pathname.startsWith('/api/inaturalist/'))return false;
    try{
      if(!configured){json(res,url.pathname.endsWith('/status')?200:503,{configured:false,connected:false,error:'Direct iNaturalist submission is not activated yet.'});return true}
      await store.ready;
      if(req.headers.origin&&req.headers.origin!==origin)throw fail(403,'This request origin is not allowed.');
      let s=session(req);
      if(url.pathname==='/api/inaturalist/status'&&req.method==='GET'){
        if(!s){s={csrf:randomBytes(32).toString('hex'),exp:Date.now()+86400000};setCookie(res,s)}
        json(res,200,{configured:true,connected:Boolean(s.token&&s.user),user:s.user||null,csrf:s.csrf});return true;
      }
      if(url.pathname==='/api/inaturalist/callback'&&req.method==='GET'){
        try{
          if(!s?.pending||s.pending.expires<Date.now()||!equal(url.searchParams.get('state'),s.pending.state)||!url.searchParams.get('code')||url.searchParams.has('error'))throw Error();
          const token=await provider(SITE+'/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:clientId,client_secret:clientSecret,redirect_uri:callback,code:url.searchParams.get('code'),code_verifier:s.pending.verifier})});
          if(typeof token.access_token!=='string'||token.access_token.length>2000)throw Error();
          const jwt=await jwtFor({token:token.access_token});const result=await provider(API+'/users/me',{headers:apiHeaders(jwt)});const user=result.results?.[0]||result;
          if(!validId(user.id)||typeof user.login!=='string')throw Error();
          setCookie(res,{token:token.access_token,user:{id:user.id,login:user.login.slice(0,100)},csrf:randomBytes(32).toString('hex'),exp:Date.now()+86400000});redirect(res,true);
        }catch{clearCookie(res);redirect(res,false)}return true;
      }
      if(req.method!=='POST')throw fail(405,'Method not allowed.');
      if(req.headers.origin!==origin||!s||!equal(req.headers['x-tt-csrf'],s.csrf))throw fail(403,'Refresh this page before continuing.');
      if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'Use a JSON request.');
      if(url.pathname==='/api/inaturalist/connect'){
        if(s.token)throw fail(409,'Disconnect before switching accounts.');
        const verifier=randomBytes(32).toString('base64url'),state=randomBytes(32).toString('hex');
        s.pending={verifier,state,expires:Date.now()+600000};setCookie(res,s);
        const query=new URLSearchParams({client_id:clientId,redirect_uri:callback,response_type:'code',scope:'write login',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});
        json(res,200,{url:SITE+'/oauth/authorize?'+query});return true;
      }
      if(url.pathname==='/api/inaturalist/disconnect'){
        if(s.token)await provider(SITE+'/oauth/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,token:s.token})});
        clearCookie(res);json(res,200,{disconnected:true});return true;
      }
      if(url.pathname==='/api/inaturalist/submit'){
        if(!s.token||!s.user)throw fail(401,'Connect your iNaturalist account first.');
        let body;try{body=await readBody(req)}catch(e){throw fail(e.status||400,'Invalid contribution request.')}
        const result=await submit(s,body);json(res,result.state==='submitted'?200:202,result);return true;
      }
      throw fail(404,'Unknown iNaturalist endpoint.');
    }catch(e){json(res,e.status||503,{error:e.status?e.message:'Direct submission is temporarily unavailable. Your local sighting is safe.'});return true}
  }
  return {configured,handle};
}
