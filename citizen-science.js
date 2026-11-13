/* Manual sharing remains available; direct submission is enabled only by a configured backend. */
let scienceRecordId = '';
function renderCitizenScience(selectedId) {
  const choices = TurtleJournalCore.sorted(records);
  const select = $('scienceObservation');
  const keep = selectedId || scienceRecordId || choices[0]?.id;
  select.innerHTML = '<option value="">Choose a saved observation</option>' + choices.map(r => '<option value="'+esc(r.id)+'">'+esc(r.turtleId||'Unassigned sighting')+' · '+esc(r.date)+' · '+esc(r.location || (r.gps?'GPS saved':'Location to add'))+'</option>').join('');
  select.value = choices.some(r => r.id === keep) ? keep : '';
  scienceRecordId = select.value;
  const r = choices.find(r => r.id === scienceRecordId);
  const checks = [{label:'Photo',ok:Boolean(r?.photo),detail:r?.photo?'ready':'add to your sighting'}, {label:'Date',ok:Boolean(r?.date),detail:r?.date?'ready':'add to your sighting'}, {label:'Location',ok:Boolean(r?.gps),detail:r?.gps?'GPS saved':r?.location?'place saved · confirm on iNaturalist’s map':'add on iNaturalist’s map'}];
  $('scienceChecklist').hidden = !r;
  $('scienceChecklist').innerHTML = checks.map(c => '<div class="check"><span aria-hidden="true">'+(c.ok?'✓':'○')+'</span><span>'+c.label+' · '+c.detail+'</span></div>').join('');
  $('sciencePrepare').disabled = !r?.photo || !r?.date;
  $('scienceEdit').disabled = !r;
  $('scienceEdit').hidden = !r;
  $('scienceEmpty').hidden = choices.length > 0;
  $('scienceStatus').textContent = !r ? 'Choose a sighting, or use the iNaturalist link below.' : !r.photo || !r.date ? 'Add a photo and observation date to prepare this sighting.' : !r.gps ? 'You can prepare this sighting now. Add the place you actually saw the turtle on iNaturalist’s map.' : 'Your photo and details are ready to prepare. You’ll review and submit them on iNaturalist.';
  renderScienceConnection();
}
function openCitizenScience(id) {go('citizen-science');renderCitizenScience(id)}
function editScienceObservation() {if(scienceRecordId)editRecord(scienceRecordId)}
function prepareManualScienceContribution() {
  const r = records.find(r => r.id === scienceRecordId);
  if (!r?.photo || !r.date) {toast('Choose a saved sighting with a photo and date.');return}
  const locationFields = r.gps ?
    '<div class="field"><label for="scienceGPS">Coordinates for the location field</label><input id="scienceGPS" readonly value="'+r.gps.lat.toFixed(6)+', '+r.gps.lon.toFixed(6)+'"><button class="btn alt small" id="scienceCopyGPS">Copy coordinates</button></div><p>Location accuracy: '+(r.gps.accuracy==null?'not recorded':Math.round(r.gps.accuracy)+' meters')+'. Keep coordinates out of public notes.</p>' :
    '<div class="notice"><b>Add the location on iNaturalist.</b> Search for the actual sighting place and position the pin on its map. Do not use today’s location for an older sighting.</div>'+(r.location?'<div class="field"><label for="sciencePlace">Saved place — confirm on the map</label><input id="sciencePlace" readonly value="'+esc(r.location)+'"><button class="btn alt small" id="scienceCopyPlace">Copy place</button></div>':'');
  openModal('Prepare for iNaturalist',
    '<div class="science-prep"><p>'+esc(r.turtleId||'Unassigned sighting')+' · '+esc(r.date)+'</p>'+
    '<h3>1. Save your photo</h3><img class="science-photo" alt="Photo from your selected sighting" src="'+esc(r.photo)+'"><button class="btn" id="scienceDownload">Save photo to this device</button><p class="notice">The saved photo does not include date or GPS metadata. Use the details below when uploading it.</p>'+
    '<h3>2. Review your field details</h3><div class="field"><label for="scienceDate">Date and time you saw the turtle</label><input id="scienceDate" readonly value="'+esc(r.date+(r.time?' '+r.time:''))+'"><button class="btn alt small" id="scienceCopyDate">Copy date and time</button></div>'+locationFields+
    '<div class="field"><label for="scienceNotes">Public notes — review before copying</label><textarea id="scienceNotes"></textarea><button class="btn alt small" id="scienceCopyNotes">Copy public notes</button></div><p class="notice">Your private journal notes are left out. Add only details you want to make public.</p>'+
    '<div class="science-finish"><h3>3. Finish on iNaturalist</h3><p>Sign in or create your own account. Upload the saved photo, enter the date and location, and review the identification. If unsure, choose a broader turtle identification.</p><p>Choose <b>Obscured</b> or <b>Private</b> location visibility and check your photo and notes for landmarks before submitting.</p><a class="btn" href="https://www.inaturalist.org/observations/upload" target="_blank" rel="noopener noreferrer">Continue on iNaturalist ↗</a><p class="notice">This opens iNaturalist in a new tab. Your photo and details are not transferred automatically. Nothing has been submitted by Turtle Tracks.</p></div></div>');
  $('scienceNotes').value = ['Observed using Turtle Tracks.',r.behavior?'Behavior: '+r.behavior:'',r.habitat?'Habitat: '+r.habitat:''].filter(Boolean).join('\n');
  $('scienceDownload').addEventListener('click',()=>downloadSciencePhoto(r));
  $('scienceCopyDate').addEventListener('click',()=>copyScienceField('scienceDate'));
  $('scienceCopyGPS')?.addEventListener('click',()=>copyScienceField('scienceGPS'));
  $('scienceCopyPlace')?.addEventListener('click',()=>copyScienceField('sciencePlace'));
  $('scienceCopyNotes').addEventListener('click',()=>copyScienceField('scienceNotes'));
}
function copyScienceField(id) {
  const field=$(id);if(!field)return;
  if(!navigator.clipboard){field.focus();field.select();toast('Select and copy the text.');return}
  navigator.clipboard.writeText(field.value).then(()=>toast('Copied')).catch(()=>{field.focus();field.select();toast('Select and copy the text.')});
}
function downloadSciencePhoto(r) {
  const match=/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/.exec(r.photo);
  if(!match){toast('This photo could not be prepared.');return}
  const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
  const url=URL.createObjectURL(new Blob([bytes],{type:'image/'+match[1]}));
  const a=document.createElement('a');a.href=url;a.download='turtle-tracks-'+r.date+'-'+r.id+'.'+(match[1]==='jpeg'?'jpg':match[1]);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Photo downloaded. Upload it on iNaturalist to contribute.');
}

let scienceConnection={configured:false,connected:false},scienceSending=false;
async function scienceRequest(path,body){
  const response=await fetch((window.TurtleTracksConfig?.apiBase||'')+'/api/inaturalist/'+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json','X-TT-CSRF':scienceConnection.csrf||''}:{},body:body?JSON.stringify(body):undefined});
  let data;try{data=await response.json()}catch{throw Error('Direct sharing is unavailable. You can still use the iNaturalist uploader.')}
  if(!response.ok)throw Error(data.error||'The request could not be completed.');return data;
}
async function checkScienceConnection(){
  try{scienceConnection=await scienceRequest('status')}catch{scienceConnection={configured:false,connected:false}}
  renderScienceConnection();
}
function scienceReceiptLink(c){return c?.observationId?'https://www.inaturalist.org/observations/'+c.observationId:''}
function renderScienceConnection(){
  const status=$('scienceStatus');if(!status)return;
  let card=$('scienceConnection');
  if(!card){card=document.createElement('div');card.id='scienceConnection';card.className='info-card';status.insertAdjacentElement('afterend',card)}
  card.hidden=!scienceConnection.configured;
  if(scienceConnection.configured){
    card.innerHTML=scienceConnection.connected?'<h3>Connected to iNaturalist</h3><p>Sharing as <b>'+esc(scienceConnection.user.login)+'</b>. Each sighting is reviewed before sending.</p><button class="btn alt small" id="scienceDisconnect">Disconnect</button>':'<h3>Connect your iNaturalist account</h3><p>Your contributions will appear under your own name. Connecting alone does not send any sightings.</p><button class="btn" id="scienceConnect">Connect iNaturalist</button>';
    $('scienceConnect')?.addEventListener('click',async()=>{try{const d=await scienceRequest('connect',{});const u=new URL(d.url);if(u.origin!=='https://www.inaturalist.org'||u.pathname!=='/oauth/authorize')throw Error('Invalid authorization address.');location.assign(u.href)}catch(e){status.textContent=e.message}});
    $('scienceDisconnect')?.addEventListener('click',async()=>{try{await scienceRequest('disconnect',{});await checkScienceConnection()}catch(e){status.textContent=e.message}});
  }
  if($('scienceManualNotice'))$('scienceManualNotice').hidden=scienceConnection.connected===true;
  const r=records.find(r=>r.id===scienceRecordId),c=r?.citizenScience;
  $('sciencePrepare').textContent=c?.state==='submitted'?'View contribution':scienceConnection.connected&&r?.gps?'Review and submit':'Prepare for iNaturalist';
  if(c?.state==='submitted'){$('sciencePrepare').disabled=false;status.textContent='Shared on iNaturalist. Changes to your local journal do not change that contribution.'}
  else if(c)status.textContent=c.state==='partial'?'Your observation was created, but its photo still needs confirmation. Review to check its status.':'A submission is awaiting confirmation. Review to check its status before sending anything again.';
}
function prepareScienceContribution(){
  const r=records.find(r=>r.id===scienceRecordId),c=r?.citizenScience;
  if(c?.state==='submitted'){openModal('Your science contribution','<p>This sighting was shared on iNaturalist. Its identification and quality grade are determined there.</p><a class="btn" href="'+scienceReceiptLink(c)+'" target="_blank" rel="noopener noreferrer">View on iNaturalist ↗</a><p class="notice">Local journal edits do not update this contribution.</p>');return}
  if(!scienceConnection.connected){if(c){openModal('Check your pending contribution','<p>Reconnect the same iNaturalist account to check this submission before creating another.</p>'+(scienceReceiptLink(c)?'<a class="btn" href="'+scienceReceiptLink(c)+'" target="_blank" rel="noopener noreferrer">Check on iNaturalist ↗</a>':''));return}prepareManualScienceContribution();return}
  if(c&&c.userId!==scienceConnection.user.id){statusScience('Reconnect the account originally used for this sighting.');return}
  if(!r?.gps&&!c){prepareManualScienceContribution();return}
  if(!r?.photo||!r.gps||!r.date){statusScience('Choose a sighting with a photo, date, and GPS.');return}
  openModal('Review your science contribution','<img alt="Your turtle observation" src="'+esc(r.photo)+'" style="width:100%;max-height:260px;object-fit:contain"><p><b>Observed:</b> '+esc(r.date)+'</p><p><b>Location:</b> '+r.gps.lat.toFixed(6)+', '+r.gps.lon.toFixed(6)+'</p><p>Date only will be shared. You can add an exact time on iNaturalist. The species will remain unconfirmed for community identification.</p><div class="field"><label for="sciencePrivacy">Location visibility</label><select id="sciencePrivacy"><option value="obscured">Obscured — approximate public location</option><option value="private">Private — no public location</option></select></div><p class="notice">iNaturalist receives the exact coordinates. Review your photo and public notes for landmarks or other location clues. Your journal’s private notes are not included.</p><div class="field"><label for="sciencePublicNotes">Public field notes (optional)</label><textarea id="sciencePublicNotes" maxlength="3000"></textarea></div><label class="check"><input id="scienceConsent" type="checkbox"> I observed this turtle, have permission to share this photo, and agree to send the photo, date, location, and public notes to iNaturalist as '+esc(scienceConnection.user.login)+'.</label><p id="scienceSubmitStatus" role="status" aria-live="polite"></p><div class="actions"><button class="btn" id="scienceSubmit" disabled>'+ (c?'Check submission / resume':'Submit to iNaturalist')+'</button><button class="btn alt" id="scienceManual">Use the website uploader</button></div>');
  $('sciencePrivacy').value=c?.geoprivacy||'obscured';$('sciencePublicNotes').value=c?.publicNotes||'';
  if(c){$('sciencePrivacy').disabled=true;$('sciencePublicNotes').readOnly=true;$('scienceManual').hidden=true}
  $('scienceConsent').addEventListener('change',()=>{$('scienceSubmit').disabled=!$('scienceConsent').checked||scienceSending});
  $('scienceManual').addEventListener('click',prepareManualScienceContribution);
  $('scienceSubmit').addEventListener('click',()=>submitScienceContribution(r.id));
}
function statusScience(message){$('scienceStatus').textContent=message}
async function submitScienceContribution(id){
  if(scienceSending||!$('scienceConsent')?.checked)return;
  const r=records.find(x=>x.id===id);if(!r)return;
  const connection=scienceConnection;
  const c=r.citizenScience||{submissionId:crypto.randomUUID(),userId:connection.user.id,state:'pending',geoprivacy:$('sciencePrivacy').value,publicNotes:$('sciencePublicNotes').value,observationId:null,submittedAt:''};
  // Persist the retry identity before the first network write.
  if(!saveRecords(records.map(x=>x.id===id?{...x,citizenScience:c}:x))){$('scienceSubmitStatus').textContent='The submission ID could not be saved. Nothing has been sent.';return}
  scienceSending=true;$('scienceSubmit').disabled=true;$('scienceSubmitStatus').textContent='Sending your contribution. Keep this page open.';
  try{
    const response=await scienceRequest('submit',{submissionId:c.submissionId,consent:true,geoprivacy:c.geoprivacy,publicNotes:c.publicNotes,observation:{date:r.date,photo:r.photo,gps:r.gps}});
    if(!['submitted','partial','pending'].includes(response.state)||response.submissionId!==c.submissionId)throw Error('The confirmation could not be verified. Check this submission before trying again.');
    const updated={...c,state:response.state,observationId:response.observationId||null,submittedAt:response.submittedAt||''};
    const next=TurtleJournalCore.validateRecords(records.map(x=>x.id===id?{...x,citizenScience:updated}:x));
    const saved=records.some(x=>x.id===id)&&saveRecords(next),url=scienceReceiptLink(updated);
    openModal(response.state==='submitted'?'Your sighting is part of the record':'Contribution needs confirmation','<p>'+(response.state==='submitted'?'Your photo and sighting were confirmed by iNaturalist. The community can now help with identification.':response.state==='partial'?'The observation exists, but the photo upload has not been confirmed. Review again to check or resume it.':'We are checking whether iNaturalist received the submission. Do not create another copy in its website uploader.')+'</p>'+(url?'<a class="btn" href="'+url+'" target="_blank" rel="noopener noreferrer">View on iNaturalist ↗</a>':'')+(!saved?'<p class="notice">The receipt could not be saved in this browser. Keep the link above. The original submission ID lets you check again safely.</p>':'')+'<p>No Research Grade status is implied by submitting.</p>');
    renderCitizenScience(id);
  }catch(e){if($('scienceSubmitStatus'))$('scienceSubmitStatus').textContent=e.message;else statusScience(e.message)}
  finally{scienceSending=false;if($('scienceSubmit'))$('scienceSubmit').disabled=!$('scienceConsent')?.checked}
}
document.addEventListener('DOMContentLoaded',()=>{
  checkScienceConnection();
  if(location.hash==='#citizen-science'){go('citizen-science');const result=new URL(location.href).searchParams.get('inat');if(result==='connection_failed')statusScience('The account connection was not completed. Please try again.');if(result)history.replaceState(null,'',location.pathname+'#citizen-science')}
});
