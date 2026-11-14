// Local diagnosis only. The optional rectangle isolates the photographed animal
// from a supplied app screenshot; no user photo or pixel data is transmitted.
const fs=require('node:fs'),path=require('node:path');
const tf=require('@tensorflow/tfjs'),wasm=require('@tensorflow/tfjs-backend-wasm'),mobilenet=require('@tensorflow-models/mobilenet'),sharp=require('sharp');
(async()=>{
 const alphaArg=process.argv.find(x=>x.startsWith('--alpha=')),alpha=alphaArg?Number(alphaArg.split('=')[1]):.5;
 if(![.5,.75,1].includes(alpha))throw Error('Unsupported MobileNet width.');
 const suffix=alpha===.5?'':`-${Math.round(alpha*100)}`;
 const root=path.resolve(__dirname,'../..'),dir=path.join(root,'.model-cache/backbone'+suffix);
 const m=JSON.parse(fs.readFileSync(path.join(dir,'model.json'))),group=m.weightsManifest[0],bytes=Buffer.concat(group.paths.map(p=>fs.readFileSync(path.join(dir,p))));
 wasm.setWasmPaths(path.dirname(require.resolve('@tensorflow/tfjs-backend-wasm'))+'/');await tf.setBackend('wasm');await tf.ready();
 const model=await mobilenet.load({version:2,alpha,inputRange:[0,1],modelUrl:{load:async()=>({modelTopology:m.modelTopology,weightSpecs:group.weights,weightData:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)})}});
 let image=sharp(process.argv[2]).rotate();
 if(process.argv[3]&&!process.argv[3].startsWith('--')){const [left,top,width,height]=process.argv[3].split(',').map(Number);image=image.extract({left,top,width,height});}
 const {data,info}=await image.removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
 const x=tf.tensor3d(new Uint8Array(data),[info.height,info.width,3],'int32'),f=model.infer(x,true);
 const classifier=JSON.parse(fs.readFileSync(path.join(root,alpha===.5?'models/eastern-box-v1/classifier.json':`.model-cache/classifier${suffix}.json`))),core=require('../../on-device-core.js');
 classifier.heads.species.enabled=true; // Only permits local diagnosis of a candidate; never writes its release flag.
 const p=core.probabilities(await f.data(),classifier.heads.species);
 console.log(JSON.stringify({dimensions:[info.width,info.height],scores:Object.fromEntries(classifier.heads.species.classes.map((c,i)=>[c,p[i]])),threshold:classifier.heads.species.threshold,imagenet:await model.classify(x,3),decision:core.decide(await f.data(),classifier)},null,2));
 f.dispose();x.dispose();model.model.dispose();
})();
