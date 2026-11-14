const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const tf=require('@tensorflow/tfjs'),wasm=require('@tensorflow/tfjs-backend-wasm'),mobilenet=require('@tensorflow-models/mobilenet'),sharp=require('sharp');
(async()=>{
 const cache=path.resolve(__dirname,'../../.model-cache'),dir=path.join(cache,'pruned-backbone');
 const m=JSON.parse(fs.readFileSync(path.join(dir,'model.json'))),weights=Buffer.concat(m.weightsManifest[0].paths.map(p=>fs.readFileSync(path.join(dir,p))));
 wasm.setWasmPaths(path.dirname(require.resolve('@tensorflow/tfjs-backend-wasm'))+'/');await tf.setBackend('wasm');await tf.ready();
 const model=await mobilenet.load({version:2,alpha:.5,inputRange:[0,1],modelUrl:{load:async()=>({modelTopology:m.modelTopology,weightSpecs:m.weightsManifest[0].weights,weightData:weights.buffer.slice(weights.byteOffset,weights.byteOffset+weights.byteLength)})}});
 const row=JSON.parse(fs.readFileSync(path.join(cache,'features.jsonl'),'utf8').split('\n')[0]);
 const {data,info}=await sharp(path.join(cache,'images',row.photo_id+'.jpg')).rotate().removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 const input=tf.tensor3d(new Uint8Array(data),[info.height,info.width,3],'int32'),out=model.infer(input,true),values=await out.data();
 const difference=Math.max(...row.features.map((x,i)=>Math.abs(x-values[i])));
 assert.ok(difference<1e-6,`Exported features differ by ${difference}`);
 console.log(JSON.stringify({photoId:row.photo_id,dimensions:values.length,maxDifference:difference,bytes:weights.length}));
 input.dispose();out.dispose();model.model.dispose();
})();
