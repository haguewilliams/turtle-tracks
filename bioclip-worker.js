/* Local-only inference: photographs, notes and coordinates never leave the device. */
'use strict';
let loaded;
async function loadModel(id){
 if(!loaded)loaded=(async()=>{
  postMessage({id,type:'progress',message:'Loading the photo model. The first use downloads about 103 MB; Wi-Fi is best.'});
  importScripts('assets/onnx-runtime/ort.min.js','on-device-core.js?v=20261114-bioclip-1','photo-preprocess.js?v=20261114-bioclip-1');
  ort.env.wasm.wasmPaths=new URL('assets/onnx-runtime/',self.location.href).href;
  ort.env.wasm.numThreads=1;
  ort.env.wasm.proxy=false;
  const response=await fetch('models/eastern-box-v2/classifier.json',{cache:'no-cache'});
  if(!response.ok)throw Error('The photo model could not be downloaded.');
  const classifier=await response.json();
  if(!classifier.heads?.species?.enabled)throw Error('This photo model is still being tested.');
  const modelURL=new URL('models/eastern-box-v2/image-encoder-q8.onnx',self.location.href).href;
  let cache,cached;
  try{cache=await caches.open('turtle-photo-bioclip-q8-1');cached=await cache.match(modelURL);}catch{}
  const modelResponse=cached||await fetch(modelURL);
  if(!modelResponse.ok)throw Error('The photo model download failed. Please try again when connected.');
  const data=await modelResponse.arrayBuffer();
  if(data.byteLength!==89646093)throw Error('The photo model download was incomplete. Please try again.');
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
  if(digest!=='9f0d0230172ad7f1d5696f7445bf7cd247ce0e35ad517645192c2b380ce2d112'){
   if(cache)await cache.delete(modelURL).catch(()=>{});
   throw Error('The photo model did not pass its download check. Please try again.');
  }
  if(!cached&&cache)try{await cache.put(modelURL,new Response(data,{headers:{'Content-Type':'application/octet-stream'}}));}catch{}
  postMessage({id,type:'progress',message:'Preparing the photo model on this device…'});
  const session=await ort.InferenceSession.create(data,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
  return {session,classifier};
 })().catch(error=>{loaded=null;throw error;});
 return loaded;
}
self.onmessage=async(event)=>{
 const {id,width,height,pixels}=event.data||{};
 let input,outputs;
 try{
  if(!Number.isInteger(id)||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>4000000||!(pixels instanceof Uint8Array)||pixels.length!==width*height*3)throw Error('Choose a supported photograph.');
  const {session,classifier}=await loadModel(id);
  postMessage({id,type:'progress',message:'Checking the turtle photo on this device…'});
  input=new ort.Tensor('float32',TurtlePhotoPixels.prepare(pixels,width,height),[1,3,224,224]);
  outputs=await session.run({pixel_values:input});
  const analysis=TurtleDeviceCore.decide(outputs.embeddings.data,classifier);
  analysis.capabilities={species:'experimental',sex:'unavailable',lifeStage:classifier.heads.life_stage.enabled?'adult-only':'unavailable'};
  postMessage({id,type:'result',analysis,model:classifier.id,analyzedAt:new Date().toISOString()});
 }catch(error){
  const message=/^(The photo model|This photo model|Choose a supported photograph)/.test(error.message||'')?error.message:'This device could not run the larger photo model. You can still save your sighting.';
  postMessage({id,type:'error',message});
 }
 finally{input?.dispose();if(outputs)for(const value of Object.values(outputs))value.dispose();}
};
