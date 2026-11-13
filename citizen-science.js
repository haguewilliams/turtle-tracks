/* Manual sharing remains available; direct submission is enabled only by a configured backend. */
let scienceRecordId = '';
function renderCitizenScience(selectedId) {
  const choices = TurtleJournalCore.sorted(records);
  const select = $('scienceObservation');
  const keep = selectedId || scienceRecordId;
  select.innerHTML = '<option value="">Choose a saved observation</option>' + choices.map(r => '<option value="'+esc(r.id)+'">'+esc(r.turtleId||'Unassigned sighting')+' · '+esc(r.date)+' · '+esc(r.location || 'No location')+'</option>').join('');
  select.value = choices.some(r => r.id === keep) ? keep : '';
  scienceRecordId = select.value;
  const r = choices.find(r => r.id === scienceRecordId);
  const checks = [{label:'Photo attached',ok:Boolean(r?.photo)},{label:'Observation date',ok:Boolean(r?.date)},{label:'GPS coordinates',ok:Boolean(r?.gps)}];
  $('scienceChecklist').innerHTML = checks.map(c => '<div class="check"><span aria-hidden="true">'+(c.ok?'✓':'○')+'</span><span>'+c.label+' · '+(c.ok?'ready':'needed')+'</span></div>').join('');
  $('sciencePrepare').disabled = !r || !checks.every(c => c.ok);
  $('scienceEdit').disabled = !r;
  $('scienceEmpty').hidden = choices.length > 0;
  $('scienceStatus').textContent = !r ? 'Select a saved sighting to prepare your contribution.' : checks.every(c=>c.ok) ? 'Ready to prepare. This observation has not been submitted.' : 'Add the missing items to this observation before preparing it.';
  renderScienceConnection();
}
function openCitizenScience(id) {go('citizen-science');renderCitizenScience(id)}
function editScienceObservation() {if(scienceRecordId)editRecord(scienceRecordId)}
function prepareManualScienceContribution() {
  const r = records.find(r => r.id === scienceRecordId);
  if (!r?.photo || !r.gps || !r.date) {toast('Choose a sighting with a photo, date, and GPS.');return}
  openModal('Your science contribution',
    '<p><b>'+esc(r.turtleId||'Unassigned sighting')+' · '+esc(r.date)+'</b></p><p>Finish sharing on iNaturalist. You will review and submit the observation there.</p>'+
    '<ol><li>Save the photo below, then open the iNaturalist uploader and sign in.</li><li>Add the photo, date, and the location shown below. Use the actual place and time you saw the turtle.</li><li>Check the identification. If unsure, choose a broader turtle identification and let the community help.</li><li>Set <b>Geoprivacy → Obscured</b> before submitting. Review notes and photos for location clues.</li></ol>'+
    '<div class="notice">Photo downloads from this journal do not contain GPS or date metadata. Enter those fields on iNaturalist before submitting.</div>'+
    '<div class="field"><label for="scienceDate">Observed date and time</label><input id="scienceDate" readonly value="'+esc(r.date+' '+r.time)+'"></div>'+
    '<div class="field"><label for="scienceGPS">GPS for the location field only</label><input id="scienceGPS" readonly value="'+r.gps.lat.toFixed(6)+', '+r.gps.lon.toFixed(6)+'"></div>'+
    '<p>Location accuracy: '+(r.gps.accuracy==null?'not recorded':Math.round(r.gps.accuracy)+' meters')+'. Do not paste precise coordinates into public notes.</p>'+
    '<div class="field"><label for="scienceNotes">Notes to review and copy</label><textarea id="scienceNotes" readonly></textarea></div>'+
    '<div class="actions"><button class="btn" id="scienceDownload">Save observation photo</button><a class="btn alt" href="https://www.inaturalist.org/observations/upload" target="_blank" rel="noopener noreferrer">Open iNaturalist uploader ↗</a><button class="btn alt" id="scienceCopyGPS">Copy GPS</button><button class="btn alt" id="scienceCopyNotes">Copy notes</button></div>'+
    '<p class="notice">Nothing has been sent by Turtle Tracks. Opening the uploader or downloading a photo does not submit an observation. Your photo and observation remain yours to review and share.</p>'+
    '<p><a class="maplink" href="https://help.inaturalist.org/en/support/solutions/articles/151000169938" target="_blank" rel="noopener noreferrer">About location privacy ↗</a></p>');
  $('scienceNotes').value = 'Observed using Turtle Tracks.\nBehavior: '+r.behavior+'\nHabitat: '+r.habitat+'\nField notes: '+r.notes;
  $('scienceDownload').addEventListener('click',()=>downloadSciencePhoto(r));
  $('scienceCopyGPS').addEventListener('click',()=>copyScienceField('scienceGPS'));
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
  $('sciencePrepare').textContent=c?.state==='submitted'?'View contribution':scienceConnection.connected?'Review and submit':'Prepare contribution';
  if(c?.state==='submitted'){$('sciencePrepare').disabled=false;status.textContent='Shared on iNaturalist. Changes to your local journal do not change that contribution.'}
  else if(c)status.textContent=c.state==='partial'?'Your observation was created, but its photo still needs confirmation. Review to check its status.':'A submission is awaiting confirmation. Review to check its status before sending anything again.';
}
function prepareScienceContribution(){
  const r=records.find(r=>r.id===scienceRecordId),c=r?.citizenScience;
  if(c?.state==='submitted'){openModal('Your science contribution','<p>This sighting was shared on iNaturalist. Its identification and quality grade are determined there.</p><a class="btn" href="'+scienceReceiptLink(c)+'" target="_blank" rel="noopener noreferrer">View on iNaturalist ↗</a><p class="notice">Local journal edits do not update this contribution.</p>');return}
  if(!scienceConnection.connected){if(c){openModal('Check your pending contribution','<p>Reconnect the same iNaturalist account to check this submission before creating another.</p>'+(scienceReceiptLink(c)?'<a class="btn" href="'+scienceReceiptLink(c)+'" target="_blank" rel="noopener noreferrer">Check on iNaturalist ↗</a>':''));return}prepareManualScienceContribution();return}
  if(c&&c.userId!==scienceConnection.user.id){statusScience('Reconnect the account originally used for this sighting.');return}
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
