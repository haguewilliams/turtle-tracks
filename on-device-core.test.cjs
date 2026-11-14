const test=require('node:test'),assert=require('node:assert/strict');
const core=require('./on-device-core.js');
const model=()=>({schemaVersion:1,backbone:{dimensions:2},heads:{species:{enabled:true,classes:['eastern','other'],coefficients:[[-10,10]],intercepts:[0],threshold:.95}}});
test('binary sklearn class ordering and normalized features are preserved',()=>{
 assert.ok(core.probabilities([50,0],model().heads.species)[0]>.999);
 assert.ok(core.probabilities([0,50],model().heads.species)[1]>.999);
});
test('possible Eastern result does not invent age, sex, or anatomical evidence',()=>{
 const r=core.decide([1,0],model());assert.equal(r.species.commonName,'Possible Eastern box turtle');
 assert.equal(r.sex.value,'unknown');assert.equal(r.lifeStage.value,'unknown');assert.deepEqual(r.evidence,[]);
});
test('other and weak results remain unidentified, not definitive negatives',()=>{
 for(const x of [[0,1],[1,1]]){const r=core.decide(x,model());assert.equal(r.species.confidence,'unknown');assert.ok(r.limitations[0].includes('does not mean no turtle'));}
});
test('unapproved models, corrupt weights and blank feature vectors fail closed',()=>{
 const m=model();m.heads.species.enabled=false;assert.throws(()=>core.decide([1,0],m));
 assert.throws(()=>core.unit([0,0]));assert.throws(()=>core.unit([NaN,1]));
 const n=model();n.heads.species.coefficients=[[1]];assert.throws(()=>core.decide([1,0],n));
});
test('multiclass softmax remains finite for large logits',()=>{
 const p=core.probabilities([1,0],{classes:['eastern','other_box','other'],coefficients:[[10000,0],[9999,0],[-10000,0]],intercepts:[0,0,0]});
 assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(p.reduce((a,b)=>a+b)-1)<1e-12);
});
