// Screen the disabled, locally trained BioCLIP heads on original internet photos.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
const require=createRequire(import.meta.url),core=require('../../on-device-core.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cache=path.join(root,'.model-cache'),dir=path.join(cache,'vision-evaluation/bioclip');
const manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
const classifier=JSON.parse(await fs.readFile(path.join(cache,'classifier-bioclip.json'),'utf8'));
const model=await ort.InferenceSession.create(path.join(dir,manifest.files.fp16.image),{executionProviders:['cpu'],intraOpNumThreads:4,interOpNumThreads:1});
const fixtures=JSON.parse(await fs.readFile(path.join(cache,'vision-evaluation/internet-fixtures.json'),'utf8'));
const results={model:classifier.id,scope:'Disabled research heads; source labels do not validate sex/stage visibility; no phone verification',cases:[]};
try{
 for(const f of fixtures){
  const {data}=await sharp(f.path).rotate().resize(224,224,{fit:'cover',position:'centre',kernel:'cubic'}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  const values=new Float32Array(3*224*224);
  for(let c=0;c<3;c++)for(let i=0;i<224*224;i++)values[c*224*224+i]=(data[i*3+c]/255-manifest.preprocess.mean[c])/manifest.preprocess.std[c];
  const {embeddings}=await model.run({pixel_values:new ort.Tensor('float32',values,[1,3,224,224])});
  const heads={};
  for(const [field,head] of Object.entries(classifier.heads)){
   const scores=core.probabilities(embeddings.data,head);
   heads[field]={scores:Object.fromEntries(head.classes.map((c,i)=>[c,scores[i]])),topLabel:head.classes[scores.indexOf(Math.max(...scores))]};
  }
  const item={id:f.id,source:f.source,reference:{species:f.species,stage:f.stage,sex:f.sex},heads,easternSuggested:heads.species.scores.eastern>=classifier.heads.species.threshold,threshold:classifier.heads.species.threshold};
  results.cases.push(item);console.log(JSON.stringify(item));
 }
 await fs.writeFile(path.join(cache,'vision-evaluation/trained-bioclip-internet-results.json'),JSON.stringify(results,null,2)+'\n');
}finally{await model.release();}
