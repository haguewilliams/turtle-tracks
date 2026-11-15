// Keep thresholds frozen on test data. This script never enables app features.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
const require=createRequire(import.meta.url),core=require('../../on-device-core.js'),pixels=require('../../photo-preprocess.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cache=path.join(root,'.model-cache/vision-evaluation');
const classifier=JSON.parse(await fs.readFile(path.join(root,'tools/vision-evaluation/results/trained-bioclip-disabled-classifier.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(cache,'bioclip/manifest.json'),'utf8'));
const fixtures=JSON.parse(await fs.readFile(path.join(cache,'internet-fixtures.json'),'utf8')).map(r=>({...r,cohort:'internet',species:r.species.includes('carolina')||r.species==='Eastern box turtle'?'eastern':'other',life_stage:r.stage}));
const cohorts=process.argv.includes('--internet-only')?[]:JSON.parse(await fs.readFile(path.join(cache,process.argv.includes('--fresh-stage')?'fresh-stage-cohort.json':'restored-cohorts.json'),'utf8'));
const output=path.join(cache,'browser-candidate-scores.jsonl');
const previous=await fs.readFile(output,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});
const done=new Set(previous.split('\n').filter(Boolean).map(s=>JSON.parse(s).id));
const options={executionProviders:['cpu'],intraOpNumThreads:4,interOpNumThreads:1};
const models={};
for(const kind of ['fp16','q8'])models[kind]=await ort.InferenceSession.create(path.join(cache,`bioclip/image_encoder_${kind}.onnx`),options);
try{
 let count=0;
 for(const f of [...fixtures,...cohorts]){
  const id=f.id||String(f.photo_id);
  if(!done.has(id)){
   const {data}=await sharp(f.path).rotate().resize(224,224,{fit:'cover',position:'centre',kernel:'cubic'}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
   const values=new Float32Array(3*224*224);
   for(let c=0;c<3;c++)for(let i=0;i<224*224;i++)values[c*224*224+i]=(data[i*3+c]/255-manifest.preprocess.mean[c])/manifest.preprocess.std[c];
   const raw=await sharp(f.path).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
   const browserValues=pixels.prepare(new Uint8Array(raw.data),raw.info.width,raw.info.height);
   const item={id,cohort:f.cohort,split:f.split,source:f.source||f.source_url,reference:{species:f.species,life_stage:f.life_stage,sex:f.sex},models:{}};
   for(const [kind,model] of Object.entries(models)){
    const start=performance.now();
    const {embeddings}=await model.run({pixel_values:new ort.Tensor('float32',kind==='q8'?browserValues:values,[1,3,224,224])});
    const heads={};
    for(const [field,head] of Object.entries(classifier.heads))heads[field]=Object.fromEntries(head.classes.map((c,i)=>[c,core.probabilities(embeddings.data,head)[i]]));
    item.models[kind]={seconds:(performance.now()-start)/1000,heads};
   }
   await fs.appendFile(output,JSON.stringify(item)+'\n');
  }
  if(++count%50===0)console.log('Evaluated',count,'of',fixtures.length+cohorts.length);
 }
 console.log('Finished',fixtures.length+cohorts.length,'photos');
}finally{for(const model of Object.values(models))await model.release();}
