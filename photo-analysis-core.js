/* Shared, strict output validation for server and journal imports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TurtlePhotoCore=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const confidence=['low','moderate','high','unknown'];
  const object=properties=>({type:'object',additionalProperties:false,properties,required:Object.keys(properties)});
  const str={type:'string'};
  const enumOf=values=>({type:'string',enum:values});
  const schema=object({
    turtlePresent:{type:'boolean'},imageQuality:enumOf(['clear','limited','unusable']),
    species:object({commonName:str,scientificName:str,confidence:enumOf(confidence)}),
    sex:object({value:enumOf(['male','female','unknown']),confidence:enumOf(confidence)}),
    lifeStage:object({value:enumOf(['hatchling','juvenile','adult','unknown']),confidence:enumOf(confidence)}),
    evidence:{type:'array',items:object({feature:enumOf(['shell','head','eye_colour','plastron','tail','body_proportions','other']),description:str,supportsSex:{type:'boolean'}})},
    limitations:{type:'array',items:str},photoAdvice:str
  });
  function text(v,max=500){if(typeof v!=='string'||v.length>max)throw Error('Invalid analysis text.');return v.trim()}
  function choice(v,allowed){if(!allowed.includes(v))throw Error('Invalid analysis value.');return v}
  function normalize(input){
    if(!input||typeof input!=='object'||typeof input.turtlePresent!=='boolean')throw Error('Invalid photo analysis.');
    if(!Array.isArray(input.evidence)||input.evidence.length>8||!Array.isArray(input.limitations)||input.limitations.length>8)throw Error('Invalid photo evidence.');
    const result={turtlePresent:input.turtlePresent,imageQuality:choice(input.imageQuality,['clear','limited','unusable']),
      species:{commonName:text(input.species?.commonName,150),scientificName:text(input.species?.scientificName,150),confidence:choice(input.species?.confidence,confidence)},
      sex:{value:choice(input.sex?.value,['male','female','unknown']),confidence:choice(input.sex?.confidence,confidence)},
      lifeStage:{value:choice(input.lifeStage?.value,['hatchling','juvenile','adult','unknown']),confidence:choice(input.lifeStage?.confidence,confidence)},
      evidence:input.evidence.map(e=>{if(typeof e.supportsSex!=='boolean')throw Error('Invalid photo evidence.');return{feature:choice(e.feature,['shell','head','eye_colour','plastron','tail','body_proportions','other']),description:text(e.description),supportsSex:e.supportsSex}}),
      limitations:input.limitations.map(x=>text(x)),photoAdvice:text(input.photoAdvice)};
    // A sex label requires an adult and at least two distinct visible, diagnostic features.
    const diagnostic=new Set(result.evidence.filter(e=>e.supportsSex&&['eye_colour','plastron','tail'].includes(e.feature)).map(e=>e.feature));
    if(!result.turtlePresent||result.imageQuality==='unusable'){
      result.species={commonName:'Unable to identify',scientificName:'',confidence:'unknown'};
      result.lifeStage={value:'unknown',confidence:'unknown'};
    }
    if(!result.turtlePresent||result.imageQuality!=='clear'||result.lifeStage.value!=='adult'||diagnostic.size<2||['low','unknown'].includes(result.sex.confidence)){
      result.sex={value:'unknown',confidence:'unknown'};
    }else if(result.sex.confidence==='high')result.sex.confidence='moderate';
    if(result.sex.value==='unknown')result.sex.confidence='unknown';
    if(result.lifeStage.value==='unknown')result.lifeStage.confidence='unknown';
    if(result.imageQuality==='unusable')result.evidence=[];
    return result;
  }
  return {schema,normalize};
});
