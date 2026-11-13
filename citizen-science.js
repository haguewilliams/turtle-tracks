/* Contribution preparation. External submission remains on the provider's website. */
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
}
function openCitizenScience(id) {go('citizen-science');renderCitizenScience(id)}
function editScienceObservation() {if(scienceRecordId)editRecord(scienceRecordId)}
function prepareScienceContribution() {
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
