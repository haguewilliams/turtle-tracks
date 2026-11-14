// Local research benchmark. No photographs or prompts are sent to a model API.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cache=path.join(root,'.model-cache/vision-evaluation');
const variant=process.argv[2]||'smol';
if(!['smol','qwen'].includes(variant))throw Error('Select smol or qwen.');
const lib=await import(variant==='smol'?'@huggingface/transformers':'transformers4');
const {AutoProcessor,RawImage,env}=lib;env.cacheDir=path.join(cache,'models');
const modelId=variant==='smol'?'HuggingFaceTB/SmolVLM-500M-Instruct':'onnx-community/Qwen3.5-0.8B-ONNX-OPT';
const revision=variant==='smol'?'753c1752602b5e739af7a7fa6947a635051897a3':'9a4c21d8f724176b0a7edaaed36303044451886e';
const Model=variant==='smol'?lib.AutoModelForVision2Seq:lib.Qwen3_5ForConditionalGeneration;
const questions={
 species:'What animal is in this photograph? Give the most specific common name you can justify and briefly describe what you see. If unclear, say unknown.',
 stage:'For the animal in this photo, is it a hatchling, juvenile, adult, or unknown? Briefly explain the visible basis. Give unknown if it is not a turtle or the image does not support an estimate. Do not give an exact age.',
 sex:'For the animal in this photograph, can you determine male or female? Say unknown if it is not a turtle or diagnostic anatomy is not visible. Eye colour alone is insufficient. Briefly describe only the relevant features actually visible.'
};
const fixtures=JSON.parse(await fs.readFile(path.join(cache,'internet-fixtures.json'),'utf8'));
const result={modelId,revision,runtime:variant==='smol'?'Transformers.js 3.8.1, q8, Node CPU':'Transformers.js 4.3.2, q4 language/fp32 vision, Node CPU',questions,scope:'Ten source-labeled internet photos; feasibility comparison only. Captions are not evidence that sex is visible. No physical-phone verification.',cases:[]};
const opts={revision,cache_dir:env.cacheDir,progress_callback:p=>{if(p.status==='done')console.log('Loaded',p.file);}};
console.log('Loading',modelId);
const processor=await AutoProcessor.from_pretrained(modelId,opts);
const model=await Model.from_pretrained(modelId,{...opts,device:'cpu',dtype:variant==='smol'?'q8':{embed_tokens:'q4',vision_encoder:'fp32',decoder_model_merged:'q4'},session_options:{intraOpNumThreads:4,interOpNumThreads:1}});
console.log('Model ready');
try{
 for(const f of fixtures){
  const {data,info}=await sharp(f.path).rotate().resize({width:448,height:448,fit:'inside',withoutEnlargement:true}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  const image=new RawImage(new Uint8Array(data),info.width,info.height,3);
  const item={id:f.id,source:f.source,reference:{species:f.species,stage:f.stage,sex:f.sex},answers:{}};
  for(const [field,prompt] of Object.entries(questions)){
   const text=processor.apply_chat_template([{role:'user',content:[{type:'image'},{type:'text',text:prompt}]}],{add_generation_prompt:true,enable_thinking:false});
   const inputs=variant==='smol'?await processor(text,[image],{do_image_splitting:false}):await processor(text,image);
   const started=performance.now();
   const output=await model.generate({...inputs,max_new_tokens:120,do_sample:false,repetition_penalty:1.1});
   const answer=processor.batch_decode(output.slice(null,[inputs.input_ids.dims.at(-1),null]),{skip_special_tokens:true})[0];
   item.answers[field]={text:answer,seconds:(performance.now()-started)/1000};
  }
  result.cases.push(item);console.log(JSON.stringify(item));
  await fs.writeFile(path.join(cache,variant+'-internet-results.json'),JSON.stringify(result,null,2)+'\n');
 }
}finally{await model.dispose();}
