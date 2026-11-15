/* The same antialiased center crop is used by the browser and evaluation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TurtlePhotoPixels=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 const mean=[.48145466,.4578275,.40821073],std=[.26862954,.26130258,.27577711];
 function cubic(x){x=Math.abs(x);return x<=1?(1.5*x-2.5)*x*x+1:x<2?((-.5*x+2.5)*x-4)*x+2:0;}
 function weights(length,side,offset,size){
  const scale=side/size,filter=Math.max(1,scale),out=[];
  for(let i=0;i<size;i++){
   const center=offset+(i+.5)*scale-.5,items=[];let total=0;
   for(let j=Math.ceil(center-2*filter);j<=Math.floor(center+2*filter);j++){
    const weight=cubic((j-center)/filter);if(weight===0)continue;
    items.push([Math.max(0,Math.min(length-1,j)),weight]);total+=weight;
   }
   out.push(items.map(([j,w])=>[j,w/total]));
  }
  return out;
 }
 function prepare(pixels,width,height,size=224){
  if(!(pixels instanceof Uint8Array)||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>4000000||pixels.length!==width*height*3||size!==224)throw Error('Invalid photo pixels.');
  const side=Math.min(width,height),wx=weights(width,side,(width-side)/2,size),wy=weights(height,side,(height-side)/2,size);
  const rows=new Map(),out=new Float32Array(3*size*size);
  for(const entries of wy)for(const [y] of entries)if(!rows.has(y)){
   const row=new Float32Array(size*3);
   for(let x=0;x<size;x++)for(const [sx,w] of wx[x])for(let c=0;c<3;c++)row[x*3+c]+=pixels[(y*width+sx)*3+c]*w;
   rows.set(y,row);
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)for(let c=0;c<3;c++){
   let v=0;for(const [sy,w] of wy[y])v+=rows.get(sy)[x*3+c]*w;
   out[c*size*size+y*size+x]=(Math.max(0,Math.min(255,v))/255-mean[c])/std[c];
  }
  return out;
 }
 return {prepare};
});
