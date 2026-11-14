// Same feature extraction in Node and the browser: MobileNet V2 alpha 0.5,
// RGB pixels [0,255], bilinear resize to 224, input range [0,1].
const fs=require('node:fs'),path=require('node:path');
const tf=require('@tensorflow/tfjs');
const wasm=require('@tensorflow/tfjs-backend-wasm');
const mobilenet=require('@tensorflow-models/mobilenet');
const sharp=require('sharp');
const ROOT=path.resolve(__dirname,'../..'),CACHE=path.join(ROOT,'.model-cache');
const alphaArg=process.argv.find(x=>x.startsWith('--alpha='));
const alpha=alphaArg?Number(alphaArg.split('=')[1]):.5;
if(![.5,.75,1].includes(alpha))throw Error('Unsupported MobileNet width.');
const suffix=alpha===.5?'':`-${Math.round(alpha*100)}`;
(async()=>{
 wasm.setWasmPaths(path.dirname(require.resolve('@tensorflow/tfjs-backend-wasm'))+'/');
 await tf.setBackend('wasm');await tf.ready();
 const modelDir=path.join(CACHE,'backbone'+suffix);fs.mkdirSync(modelDir,{recursive:true});
 const cachedPath=path.join(modelDir,'model.json');
 let model;
 if(fs.existsSync(cachedPath)){
  const cached=JSON.parse(fs.readFileSync(cachedPath)),group=cached.weightsManifest[0],bytes=Buffer.concat(group.paths.map(p=>fs.readFileSync(path.join(modelDir,p))));
  model=await mobilenet.load({version:2,alpha,inputRange:[0,1],modelUrl:{load:async()=>({modelTopology:cached.modelTopology,weightSpecs:group.weights,weightData:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)})}});
 }else model=await mobilenet.load({version:2,alpha});
 await model.model.save(tf.io.withSaveHandler(async a=>{
  const bin=Array.isArray(a.weightData)?Buffer.concat(a.weightData.map(x=>Buffer.from(x))):Buffer.from(a.weightData),paths=[];
  for(let offset=0;offset<bin.length;offset+=1024*1024){const name=`weights-${paths.length+1}.bin`;paths.push(name);fs.writeFileSync(path.join(modelDir,name),bin.subarray(offset,offset+1024*1024));}
  fs.writeFileSync(path.join(modelDir,'model.json'),JSON.stringify({format:'graph-model',generatedBy:a.generatedBy,convertedBy:a.convertedBy,modelTopology:a.modelTopology,weightsManifest:[{paths,weights:a.weightSpecs}]}));
  return{modelArtifactsInfo:{dateSaved:new Date(),modelTopologyType:'JSON',weightDataBytes:bin.length}};
 }));
 if(process.argv.includes('--export-only')){model.model.dispose();console.log('Backbone exported');return;}
 const follow=process.argv.includes('--follow');
 const fresh=process.argv.includes('--fresh');
 const rows=JSON.parse(fs.readFileSync(path.join(CACHE,fresh?'fresh-manifest.json':follow?'pending-manifest.json':'manifest.json')));
 const featureFile=path.join(CACHE,(fresh?'fresh-features':'features')+suffix+'.jsonl');
 const existing=new Set(fs.existsSync(featureFile)?fs.readFileSync(featureFile,'utf8').split('\n').filter(Boolean).map(s=>JSON.parse(s).photo_id):[]);
 const out=fs.createWriteStream(featureFile,{flags:'a'});
 let count=0;
 for(const row of rows){
  if(existing.has(row.photo_id)){count++;continue;}
  try{
   const file=path.join(CACHE,'images',row.photo_id+'.jpg');
   if(follow){const until=Date.now()+180000;while(!fs.existsSync(file)&&Date.now()<until)await new Promise(r=>setTimeout(r,1000));}
   const {data,info}=await sharp(file).rotate().removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
   const input=tf.tensor3d(new Uint8Array(data),[info.height,info.width,3],'int32');
   const f=model.infer(input,true);const values=Array.from(await f.data());
   input.dispose();f.dispose();
   out.write(JSON.stringify({...row,features:values})+'\n');
   if(++count%50===0)console.log('Extracted',count,'of',rows.length,'images');
  }catch(e){console.log('Skipped',row.photo_id,e.message.slice(0,100));}
 }
 await new Promise(resolve=>out.end(resolve));model.model.dispose();
 console.log('Feature extraction complete',count);
})();
