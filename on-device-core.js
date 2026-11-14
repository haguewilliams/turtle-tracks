/* Deterministic classifier math shared by the browser worker and tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TurtleDeviceCore=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function unit(vector){
  if(!Array.isArray(vector)&&!ArrayBuffer.isView(vector))throw Error('Invalid image features.');
  if(!vector.length||Array.from(vector).some(x=>!Number.isFinite(x)))throw Error('Invalid image features.');
  const norm=Math.sqrt(Array.from(vector).reduce((s,x)=>s+x*x,0));
  if(norm<1e-8)throw Error('No useful image features.');
  return Array.from(vector,x=>x/norm);
 }
 function probabilities(features,head){
  const x=unit(features),c=head.classes;
  if(!Array.isArray(c)||c.length<2||c.length>10||!Array.isArray(head.coefficients)||!Array.isArray(head.intercepts))throw Error('Invalid classifier.');
  const binary=c.length===2&&head.coefficients.length===1;
  if(head.coefficients.length!==(binary?1:c.length)||head.intercepts.length!==head.coefficients.length)throw Error('Invalid classifier shape.');
  const logits=head.coefficients.map((w,i)=>{
   if(w.length!==x.length||!w.every(Number.isFinite)||!Number.isFinite(head.intercepts[i]))throw Error('Invalid classifier weights.');
   return w.reduce((s,v,j)=>s+v*x[j],head.intercepts[i]);
  });
  if(binary){const p=1/(1+Math.exp(-logits[0]));return [1-p,p];}
  const maximum=Math.max(...logits),exp=logits.map(x=>Math.exp(x-maximum)),sum=exp.reduce((s,x)=>s+x,0);
  return exp.map(x=>x/sum);
 }
 function decide(features,model){
  if(model.schemaVersion!==1||features.length!==model.backbone?.dimensions)throw Error('Unsupported classifier.');
  const head=model.heads?.species;
  if(!head?.enabled)throw Error('This photo model is not enabled.');
  if(!Number.isFinite(head.threshold)||head.threshold<0.5||head.threshold>1)throw Error('Invalid decision threshold.');
  const scores=probabilities(features,head),idx=head.classes.indexOf('eastern');
  if(idx<0)throw Error('Missing Eastern box turtle classifier.');
  const possible=scores[idx]>=head.threshold;
  // Recognizing a turtle and resolving its species are separate decisions.
  // Keep a cautious broad result when the trained turtle classes jointly pass
  // the separately evaluated detection threshold; never force an Eastern ID.
  const turtleClasses=['eastern','other_box_turtle','other_turtle'];
  const turtleScore=turtleClasses.every(c=>head.classes.includes(c))?turtleClasses.reduce((sum,c)=>sum+scores[head.classes.indexOf(c)],0):0;
  const turtleDetected=possible||turtleScore>=.95;
  // A species classifier cannot certify anatomy or exact age. Never invent
  // visible evidence from a class score, or treat unvalidated heads as active.
  return {turtlePresent:turtleDetected,imageQuality:'limited',
   species:{commonName:possible?'Possible Eastern box turtle':turtleDetected?'Turtle detected — species uncertain':'Unable to identify confidently',scientificName:possible?'Terrapene carolina carolina':'',confidence:possible?'moderate':'unknown'},
   sex:{value:'unknown',confidence:'unknown'},lifeStage:{value:'unknown',confidence:'unknown'},evidence:[],
   limitations:[possible?'Experimental species suggestion; similar turtles can be mistaken for Eastern box turtles. Please compare with the field guide.':turtleDetected?'This model recognizes a likely turtle but cannot reliably identify its species. Compare the photo with the field guide.':'This model cannot confidently identify this photo. This does not mean no turtle is present.',
     'Male/female and life-stage photo models are not validated yet. Exact age cannot be determined from this result.'],
   photoAdvice:'Photograph only what is naturally visible; leave the turtle where it is.'};
 }
 return {unit,probabilities,decide};
});
