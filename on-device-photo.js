/* Main-thread image decoding and cancellable worker. No external photo upload. */
(function(root){
 'use strict';let worker,serial=0,active;
 function stop(error){worker?.terminate();worker=null;if(active){const job=active;active=null;job.cleanup();job.reject(error);}}
 function abortError(){return new DOMException('Photo analysis cancelled.','AbortError');}
 function ensureWorker(){
  if(worker)return;
  worker=new Worker('on-device-worker.js?v=20261114-detection-2');
  worker.onmessage=event=>{
   const msg=event.data,job=active;if(!job||msg.id!==job.id)return;
   if(msg.type==='progress'){job.onProgress?.(msg.message);return;}
   if(msg.type==='result'||msg.type==='error'){
    active=null;job.cleanup();
    if(msg.type==='result')job.resolve(msg);else job.reject(Error(msg.message));
   }
  };
  worker.onerror=()=>stop(Error('This browser could not run the photo model. You can still save your sighting.'));
 }
 async function analyze(dataUrl,{signal,onProgress}={}){
  if(active)throw Error('A photo is already being checked.');
  if(signal?.aborted)throw abortError();
  if(!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)||dataUrl.length>6000000)throw Error('Choose a JPEG, PNG or WebP photo.');
  const image=new Image();image.src=dataUrl;await image.decode();
  if(signal?.aborted)throw abortError();
  const width=image.naturalWidth,height=image.naturalHeight;
  if(!width||!height||width*height>4000000)throw Error('This photo is too large to analyze on this device.');
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const rgba=ctx.getImageData(0,0,width,height).data,pixels=new Uint8Array(width*height*3);
  for(let p=0,q=0;p<rgba.length;p+=4){pixels[q++]=rgba[p];pixels[q++]=rgba[p+1];pixels[q++]=rgba[p+2];}
  canvas.width=canvas.height=0;
  ensureWorker();
  return new Promise((resolve,reject)=>{
   const id=++serial,abort=()=>stop(abortError()),timer=setTimeout(()=>stop(Error('The photo check took too long on this device. You can still save your sighting.')),90000);
   active={id,resolve,reject,onProgress,cleanup:()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);}};
   signal?.addEventListener('abort',abort,{once:true});
   if(signal?.aborted){abort();return;}
   worker.postMessage({id,width,height,pixels},[pixels.buffer]);
  });
 }
 root.TurtleDevicePhoto={analyze,cancel:()=>stop(abortError())};
})(window);
