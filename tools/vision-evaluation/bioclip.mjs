// Biology-specific species feasibility screen. No sex/age claims or app changes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
import {AutoTokenizer} from '@huggingface/transformers';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cache=path.join(root,'.model-cache/vision-evaluation');
const dir=path.join(cache,'bioclip');
const manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
const labels=[
 ['eastern','Eastern box turtle','Terrapene carolina carolina'],
 ['ornate','Ornate box turtle','Terrapene ornata'],
 ['three-toed','Three-toed box turtle','Terrapene triunguis'],
 ['florida','Florida box turtle','Terrapene carolina bauri'],
 ['gulf','Gulf Coast box turtle','Terrapene carolina major'],
 ['red-eared','Red-eared slider','Trachemys scripta elegans'],
 ['yellow-bellied','Yellow-bellied slider','Trachemys scripta scripta'],
 ['dorbigni','DOrbignys slider','Trachemys dorbigni'],
 ['painted','Painted turtle','Chrysemys picta'],
 ['spotted','Spotted turtle','Clemmys guttata'],
 ['wood','Wood turtle','Glyptemys insculpta'],
 ['bog','Bog turtle','Glyptemys muhlenbergii'],
 ['musk','Common musk turtle','Sternotherus odoratus'],
 ['mud','Eastern mud turtle','Kinosternon subrubrum'],
 ['snapping','Common snapping turtle','Chelydra serpentina'],
 ['map','Northern map turtle','Graptemys geographica'],
 ['softshell','Spiny softshell turtle','Apalone spinifera'],
 ['terrapin','Diamondback terrapin','Malaclemys terrapin'],
 ['tortoise','Gopher tortoise','Gopherus polyphemus'],
 ['frog','Variable poison frog','Ranitomeya variabilis'],
 ['toad','Cane toad','Rhinella marina'],
 ['bullfrog','American bullfrog','Lithobates catesbeianus'],
 ['lizard','Green anole','Anolis carolinensis'],
 ['snake','Eastern garter snake','Thamnophis sirtalis'],
 ['dog','Domestic dog','Canis lupus familiaris'],
 ['cat','Domestic cat','Felis catus'],
 ['leaf','A green leaf','plant leaf'],
 ['rock','A rock','stone'],
];
const tokenizer=await AutoTokenizer.from_pretrained(dir,{local_files_only:true});
const options={executionProviders:['cpu'],intraOpNumThreads:4,interOpNumThreads:1};
const textModel=await ort.InferenceSession.create(path.join(dir,manifest.files.fp16.text),options);
const imageModel=await ort.InferenceSession.create(path.join(dir,manifest.files.fp16.image),options);
const normalize=a=>{let n=Math.hypot(...a);return Float32Array.from(a,v=>v/n);};
const vectors=[];
try{
 for(const [,common,scientific] of labels){
  const prompts=[`a photo of ${common}.`,`a photo of ${scientific}.`];
  const tokens=tokenizer(prompts,{padding:'max_length',max_length:77,truncation:true});
  const {embeddings}=await textModel.run({input_ids:new ort.Tensor('int64',tokens.input_ids.data,tokens.input_ids.dims)});
  vectors.push(normalize(Array.from({length:512},(_,i)=>(embeddings.data[i]+embeddings.data[512+i])/2)));
 }
 console.log('Encoded',labels.length,'candidate labels');
 const fixtures=JSON.parse(await fs.readFile(path.join(cache,'internet-fixtures.json'),'utf8'));
 const results={model:'imageomics/bioclip',export:'jsteinshouer/trail-bingo-bioclip-onnx',revision:'25d50dd481d6a748ce78c8bc513a420bf7d3d279',runtime:'ONNX Runtime 1.21.0 CPU, fp16 stored weights/fp32 computation',scope:'Ten original internet photos, fixed 28 candidate labels, no confidence calibration, no phone verification; pretraining overlap unknown',labels,cases:[]};
 for(const f of fixtures){
  const start=performance.now();
  const {data}=await sharp(f.path).rotate().resize(224,224,{fit:'cover',position:'centre',kernel:'cubic'}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  const values=new Float32Array(3*224*224);
  for(let c=0;c<3;c++)for(let i=0;i<224*224;i++)values[c*224*224+i]=(data[i*3+c]/255-manifest.preprocess.mean[c])/manifest.preprocess.std[c];
  const {embeddings}=await imageModel.run({pixel_values:new ort.Tensor('float32',values,[1,3,224,224])});
  const similarities=vectors.map(v=>v.reduce((sum,x,i)=>sum+x*embeddings.data[i],0));
  const max=Math.max(...similarities);const e=similarities.map(s=>Math.exp((s-max)*manifest.logitScale)),sum=e.reduce((a,b)=>a+b,0);
  const ranked=labels.map(([id,common,scientific],i)=>({id,common,scientific,cosine:similarities[i],relativeScore:e[i]/sum})).sort((a,b)=>b.relativeScore-a.relativeScore);
  const item={id:f.id,source:f.source,reference:{species:f.species,stage:f.stage,sex:f.sex},seconds:(performance.now()-start)/1000,top:ranked.slice(0,5),sex:'not evaluated',lifeStage:'not evaluated'};
  results.cases.push(item);console.log(JSON.stringify(item));
  await fs.writeFile(path.join(cache,'bioclip-internet-results.json'),JSON.stringify(results,null,2)+'\n');
 }
}finally{await textModel.release();await imageModel.release();}
