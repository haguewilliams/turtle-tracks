/* A photo is processed only in this worker. No photo/GPS/notes are transmitted. */
'use strict';
let loaded;
async function loadModel(id){
 if(!loaded)loaded=(async()=>{
  postMessage({id,type:'progress',message:'Loading the photo model onto this device…'});
  importScripts('assets/ml-runtime/tf.min.js','assets/ml-runtime/tf-backend-wasm.min.js','assets/ml-runtime/mobilenet.min.js','on-device-core.js?v=20261114-detection-2');
  tf.wasm.setWasmPaths(new URL('assets/ml-runtime/',self.location.href).href);
  tf.env().set('WASM_HAS_MULTITHREAD_SUPPORT',false);
  await tf.setBackend('wasm');await tf.ready();
  const response=await fetch('models/eastern-box-v1/classifier.json',{cache:'no-cache'});
  if(!response.ok)throw Error('The photo model could not be downloaded.');
  const classifier=await response.json();
  if(!classifier.heads?.species?.enabled)throw Error('The photo model is still being evaluated.');
  const backbone=await mobilenet.load({version:2,alpha:.5,inputRange:[0,1],modelUrl:'models/eastern-box-v1/backbone/model.json'});
  return {classifier,backbone};
 })().catch(error=>{loaded=null;throw error;});
 return loaded;
}
self.onmessage=async(event)=>{
 const {id,width,height,pixels}=event.data||{};
 let input,embedding;
 try{
  if(!Number.isInteger(id)||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>4000000||!(pixels instanceof Uint8Array)||pixels.length!==width*height*3)throw Error('Choose a supported photograph.');
  const {classifier,backbone}=await loadModel(id);
  postMessage({id,type:'progress',message:'Checking the photo on this device…'});
  input=tf.tensor3d(pixels,[height,width,3],'int32');embedding=backbone.infer(input,true);
  const analysis=TurtleDeviceCore.decide(await embedding.data(),classifier);
  postMessage({id,type:'result',analysis,model:classifier.id,analyzedAt:new Date().toISOString()});
 }catch(error){postMessage({id,type:'error',message:error.message||'Photo analysis could not finish. You can still save your sighting.'});}
 finally{input?.dispose();embedding?.dispose();}
};
