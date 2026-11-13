/* Only an explicit Analyze action transmits a photo. Secrets belong on the server. */
let currentPhotoAnalysis=null,legacyAssessment=null,pendingPhotoAnalysis=null;
let analysisAvailable=false,analysisBusy=false,analysisJob=0,analysisController=null;
function invalidatePhotoAnalysis(){
  analysisJob++;analysisController?.abort();analysisController=null;analysisBusy=false;
  currentPhotoAnalysis=null;pendingPhotoAnalysis=null;legacyAssessment=null;
  if(document.getElementById('analysisConsent'))document.getElementById('analysisConsent').checked=false;
  if(document.getElementById('photoEstimate'))document.getElementById('photoEstimate').replaceChildren();
  refreshAnalysisControls();
}
function refreshAnalysisControls(){
  const button=document.getElementById('analyzePhotoButton');if(!button)return;
  button.disabled=!analysisAvailable||!photoData||analysisBusy||!document.getElementById('analysisConsent').checked||photoJobs>0;
  button.textContent=analysisBusy?'Looking at your photo…':'Analyze photo';
  document.getElementById('analysisConsentRow').hidden=!analysisAvailable;
  document.getElementById('analysisStatus').textContent=analysisBusy?'Checking visible features. You can still save without waiting.':analysisAvailable?'Review the suggestion before adding it to your sighting.':'Photo analysis is not available yet. You can save now or use the field guide below.';
}
async function checkAnalysisAvailability(){
  try{const r=await fetch((window.TurtleTracksConfig?.apiBase||'')+'/api/status',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();analysisAvailable=data.photoAnalysis===true}catch{analysisAvailable=false}
  refreshAnalysisControls();
}
async function analyzePhoto(){
  if(!photoData||!analysisAvailable||analysisBusy||!document.getElementById('analysisConsent').checked||photoJobs)return;
  const job=++analysisJob,epoch=photoEpoch,image=photoData;analysisBusy=true;pendingPhotoAnalysis=null;refreshAnalysisControls();
  const controller=new AbortController();analysisController=controller;const timeout=setTimeout(()=>controller.abort(),50000);
  try{
    const r=await fetch((window.TurtleTracksConfig?.apiBase||'')+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,consent:true}),signal:controller.signal});
    let data;try{data=await r.json()}catch{throw Error('Photo analysis is unavailable. You can still save this sighting.')}
    if(!r.ok)throw Error(data.error||'Photo analysis could not be completed.');
    if(job!==analysisJob||epoch!==photoEpoch||photoData!==image)return;
    pendingPhotoAnalysis={...TurtlePhotoCore.normalize(data.analysis),source:'AI photo suggestion',model:String(data.model||'').slice(0,100),analyzedAt:String(data.analyzedAt||'').slice(0,50),accepted:false};
    renderPhotoAnalysis(pendingPhotoAnalysis,false);
  }catch(e){if(job!==analysisJob||epoch!==photoEpoch)return;document.getElementById('photoEstimate').textContent=e.name==='AbortError'?'Analysis timed out. Your photo is still here; please try again.':e.message}
  finally{clearTimeout(timeout);if(job===analysisJob){analysisBusy=false;analysisController=null;refreshAnalysisControls()}}
}
function analysisHTML(result){
  const a=TurtlePhotoCore.normalize(result),value=v=>v==='unknown'?'Unable to tell':v[0].toUpperCase()+v.slice(1);
  return '<p class="analysis-label">AI suggestion · not independently verified</p><h3>'+esc(a.species.commonName||'Unable to identify')+'</h3>'+(a.species.scientificName?'<p><em>'+esc(a.species.scientificName)+'</em></p>':'')+
    '<dl class="analysis-facts"><div><dt>Species confidence</dt><dd>'+value(a.species.confidence)+'</dd></div><div><dt>Sex</dt><dd>'+value(a.sex.value)+(a.sex.value!=='unknown'?' · '+value(a.sex.confidence)+' confidence':'')+'</dd></div><div><dt>Life stage</dt><dd>'+value(a.lifeStage.value)+'</dd></div></dl>'+
    (a.evidence.length?'<p><b>Visible clues</b></p><ul>'+a.evidence.map(e=>'<li>'+esc(e.description)+'</li>').join('')+'</ul>':'')+
    (a.limitations.length?'<p>'+a.limitations.map(esc).join(' ')+'</p>':'')+'<p class="tt-small">Exact age cannot be determined from a photo. Confidence is a model judgment, not a measured accuracy score.</p>'+(a.photoAdvice?'<p>'+esc(a.photoAdvice)+'</p>':'');
}
function renderPhotoAnalysis(a,accepted){
  document.getElementById('photoEstimate').innerHTML='<div class="analysis-result">'+analysisHTML(a)+(accepted?'<p class="analysis-label">Included with this sighting as an AI suggestion.</p><button class="btn alt small" type="button" onclick="dismissPhotoAnalysis()">Remove suggestion</button>':'<div class="actions"><button class="btn small" type="button" onclick="acceptPhotoAnalysis()">Use this suggestion</button><button class="btn alt small" type="button" onclick="dismissPhotoAnalysis()">Leave unidentified</button></div>')+'</div>';
}
function acceptPhotoAnalysis(){if(!pendingPhotoAnalysis)return;currentPhotoAnalysis={...pendingPhotoAnalysis,accepted:true};pendingPhotoAnalysis=null;renderPhotoAnalysis(currentPhotoAnalysis,true)}
function dismissPhotoAnalysis(){currentPhotoAnalysis=null;pendingPhotoAnalysis=null;document.getElementById('photoEstimate').textContent='Saved as unidentified unless you add another suggestion.'}
document.addEventListener('DOMContentLoaded',checkAnalysisAvailability);
