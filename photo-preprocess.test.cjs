const test=require('node:test'),assert=require('node:assert/strict');
const {prepare}=require('./photo-preprocess.js');
test('uniform pixels preserve channel order and CLIP normalization',()=>{
 const p=new Uint8Array(8*12*3);for(let i=0;i<p.length;i+=3){p[i]=255;p[i+1]=128;p[i+2]=0;}
 const result=prepare(p,8,12),size=224*224;
 const expected=[(1-.48145466)/.26862954,(128/255-.4578275)/.26130258,(0-.40821073)/.27577711];
 for(let c=0;c<3;c++)for(let i=0;i<size;i+=137)assert.ok(Math.abs(result[c*size+i]-expected[c])<1e-5);
});
test('wide and tall center crops agree after rotating identical content',()=>{
 const wide=new Uint8Array(448*224*3),tall=new Uint8Array(224*448*3);
 for(let y=0;y<224;y++)for(let x=0;x<448;x++)for(let c=0;c<3;c++){
  const v=x>=112&&x<336?127:255;
  wide[(y*448+x)*3+c]=v;tall[(x*224+y)*3+c]=v;
 }
 const a=prepare(wide,448,224),b=prepare(tall,224,448);
 for(let i=0;i<a.length;i+=131)assert.ok(Math.abs(a[i]-b[i])<1e-5);
});
test('invalid buffers cannot enter model preprocessing',()=>{
 assert.throws(()=>prepare(new Uint8Array(3),2,1));
 assert.throws(()=>prepare(new Uint8Array(0),0,0));
 assert.throws(()=>prepare(new Uint8Array(3),1,1,448));
});
