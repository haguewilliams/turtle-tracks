// Released model on original photos; does not exercise the browser upload UI.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'tools/model-development/package.json'));
const tf=require('@tensorflow/tfjs'),wasm=require('@tensorflow/tfjs-backend-wasm'),mobilenet=require('@tensorflow-models/mobilenet');
const core=require('../../on-device-core.js');
const cache=path.join(root,'.model-cache/vision-evaluation');
const fixtures=JSON.parse(await fs.readFile(path.join(cache,'internet-fixtures.json'),'utf8'));
const dir=path.join(root,'models/eastern-box-v1/backbone');
const m=JSON.parse(await fs.readFile(path.join(dir,'model.json'),'utf8')),group=m.weightsManifest[0];
const bytes=Buffer.concat(await Promise.all(group.paths.map(p=>fs.readFile(path.join(dir,p)))));
wasm.setWasmPaths(path.dirname(require.resolve('@tensorflow/tfjs-backend-wasm'))+'/');
await tf.setBackend('wasm');await tf.ready();
const model=await mobilenet.load({version:2,alpha:.5,inputRange:[0,1],modelUrl:{load:async()=>({modelTopology:m.modelTopology,weightSpecs:group.weights,weightData:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)})}});
const classifier=JSON.parse(await fs.readFile(path.join(root,'models/eastern-box-v1/classifier.json'),'utf8'));
const results={model:classifier.id,scope:'Released model on original internet photographs; local inference, not browser upload testing',cases:[]};
try{
 for(const f of fixtures){
  const {data,info}=await sharp(f.path).rotate().removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  const input=tf.tensor3d(new Uint8Array(data),[info.height,info.width,3],'int32'),embedding=model.infer(input,true);
  try{
   const values=await embedding.data(),scores=core.probabilities(values,classifier.heads.species);
   const result={id:f.id,source:f.source,reference:{species:f.species,stage:f.stage,sex:f.sex},scores:Object.fromEntries(classifier.heads.species.classes.map((c,i)=>[c,scores[i]])),decision:core.decide(values,classifier)};
   results.cases.push(result);console.log(f.id,result.decision.species.commonName);
  }finally{input.dispose();embedding.dispose();}
 }
 await fs.writeFile(path.join(cache,'baseline-internet-results.json'),JSON.stringify(results,null,2)+'\n');
}finally{model.model.dispose();}
