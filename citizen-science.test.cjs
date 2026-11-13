const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('./journal-core.js');
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB1kAAAAASUVORK5CYII=';
const sample=patch=>({id:'obs_1',date:'2026-10-08',time:'09:00',photo,gps:null,location:'Private garden',notes:'PRIVATE JOURNAL NOTE',habitat:'Woods',behavior:'Resting',...patch});
function setup(records){
 const elements={};const el=id=>elements[id]={value:'',innerHTML:'',textContent:'',hidden:false,disabled:false,listeners:{},addEventListener(k,f){this.listeners[k]=f}};
 for(const id of ['scienceObservation','scienceChecklist','sciencePrepare','scienceEdit','scienceEmpty','scienceStatus','scienceConnection','scienceManualNotice'])el(id);
 const seen={modals:[],copies:[],requests:0,toasts:[]};
 const context={records,TurtleJournalCore:core,$:id=>elements[id]||null,esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),document:{addEventListener(){}},window:{},navigator:{clipboard:{writeText:async s=>{seen.copies.push(s)}}},toast:s=>seen.toasts.push(s),openModal(title,html){seen.modals.push({title,html});for(const match of html.matchAll(/id="([^"]+)"/g))el(match[1]);},fetch(){seen.requests++;throw Error('Preparation must not send requests')},go(){}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/citizen-science.js','utf8'),context);
 return {context,elements,seen};
}
test('a photo/date sighting without GPS can be prepared without sending or altering a record',()=>{
 const record=sample(),before=JSON.stringify(record),{context:c,elements:e,seen}=setup([record]);
 c.renderCitizenScience();assert.equal(e.sciencePrepare.disabled,false);assert.match(e.scienceStatus.textContent,/prepare this sighting now/);
 c.prepareScienceContribution();assert.equal(seen.modals.length,1);assert.match(seen.modals[0].html,/Add the location on iNaturalist/);assert.match(seen.modals[0].html,/not transferred automatically/);assert.equal(seen.requests,0);assert.equal(JSON.stringify(record),before);
});
test('manual preparation excludes private notes and locations from the public notes box',()=>{
 const {context:c,elements:e}=setup([sample({gps:{lat:35.12345,lon:-82.98765,accuracy:10}})]);c.renderCitizenScience();c.prepareManualScienceContribution();
 assert.match(e.scienceNotes.value,/Behavior: Resting/);assert.doesNotMatch(e.scienceNotes.value,/PRIVATE|Private garden|35\.123|-82\.987/);
 e.scienceNotes.value+='\nReviewed public detail';assert.match(e.scienceNotes.value,/Reviewed public detail/);
});
test('date, GPS, and reviewed public notes copy independently',()=>{
 const {context:c,elements:e,seen}=setup([sample({gps:{lat:35,lon:-82,accuracy:10}})]);c.renderCitizenScience();c.prepareManualScienceContribution();
 const html=seen.modals[0].html;assert.match(html,/35\.000000, -82\.000000/);
 e.scienceDate.value='2026-10-08 09:00';e.scienceGPS.value='35.000000, -82.000000';e.scienceNotes.value='Reviewed text';
 e.scienceCopyDate.listeners.click();e.scienceCopyGPS.listeners.click();e.scienceCopyNotes.listeners.click();
 assert.deepEqual(seen.copies,['2026-10-08 09:00','35.000000, -82.000000','Reviewed text']);assert.equal(seen.requests,0);
});
test('missing photos and an empty journal explain the next action without claiming readiness',()=>{
 const {context:c,elements:e,seen}=setup([sample({photo:''})]);c.renderCitizenScience();assert.equal(e.sciencePrepare.disabled,true);c.prepareManualScienceContribution();assert.equal(seen.modals.length,0);
 c.records=[];c.renderCitizenScience();assert.equal(e.scienceEmpty.hidden,false);assert.equal(e.scienceChecklist.hidden,true);assert.equal(e.sciencePrepare.disabled,true);assert.match(e.scienceStatus.textContent,/iNaturalist link below/);
});
test('an uncertain direct contribution cannot fall through to a second manual submission',()=>{
 const {context:c,seen}=setup([sample({citizenScience:{state:'pending',userId:7,submissionId:'pending'}})]);c.renderCitizenScience();c.prepareScienceContribution();assert.match(seen.modals[0].title,/pending/);assert.doesNotMatch(seen.modals[0].html,/observations\/upload/);assert.equal(seen.requests,0);
});
test('a completed contribution shows its receipt even if the local photo was removed',()=>{
 const {context:c,elements:e,seen}=setup([sample({photo:'',citizenScience:{state:'submitted',observationId:901}})]);c.renderCitizenScience();assert.equal(e.sciencePrepare.disabled,false);c.prepareScienceContribution();assert.match(seen.modals[0].html,/observations\/901/);assert.equal(seen.requests,0);
});
