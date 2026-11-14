// Extract frozen biology-specific features for the existing observer-split data.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cache=path.join(root,'.model-cache');
const dir=path.join(cache,'vision-evaluation/bioclip');
const manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
const model=await ort.InferenceSession.create(path.join(dir,manifest.files.fp16.image),{executionProviders:['cpu'],intraOpNumThreads:4,interOpNumThreads:1});
try{
 for(const prefix of ['','fresh-']){
  const rows=JSON.parse(await fs.readFile(path.join(cache,prefix+'manifest.json'),'utf8'));
  const output=path.join(cache,prefix+'features-bioclip.jsonl');
  const previous=await fs.readFile(output,'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});
  const done=new Set(previous.split('\n').filter(Boolean).map(s=>JSON.parse(s).photo_id));
  let count=0;
  for(const row of rows){
   if(!done.has(row.photo_id)){
    const {data}=await sharp(path.join(cache,'images',row.photo_id+'.jpg')).rotate().resize(224,224,{fit:'cover',position:'centre',kernel:'cubic'}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
    const values=new Float32Array(3*224*224);
    for(let c=0;c<3;c++)for(let i=0;i<224*224;i++)values[c*224*224+i]=(data[i*3+c]/255-manifest.preprocess.mean[c])/manifest.preprocess.std[c];
    const {embeddings}=await model.run({pixel_values:new ort.Tensor('float32',values,[1,3,224,224])});
    await fs.appendFile(output,JSON.stringify({...row,features:Array.from(embeddings.data)})+'\n');
   }
   if(++count%100===0)console.log(prefix||'development',count,'of',rows.length);
  }
  console.log('Finished',prefix||'development',count);
 }
}finally{await model.release();}
