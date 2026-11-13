const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('./journal-core.js');
const sample = (changes={}) => ({id:'obs_test_1',date:'2026-11-13',time:'09:00',location:'Private garden',behavior:'Moving',habitat:'Woods',notes:'Looked healthy',photo:'',gps:null,turtleId:'Turtle 001',assessment:null,...changes});
test('calendar validation rejects impossible dates but accepts leap days',()=>{
  assert.equal(core.validDate('2026-02-29'),false); assert.equal(core.validDate('2024-02-29'),true); assert.equal(core.validDate('2026-13-01'),false);
});
test('version 2 backups and legacy arrays remain importable',()=>{
  assert.deepEqual(core.parseBackup(JSON.stringify({app:'Turtle Tracks',version:2,records:[sample()]})),[sample()]);
  assert.deepEqual(core.parseBackup(JSON.stringify([sample()])),[sample()]);
});
test('unrelated JSON files are rejected without being treated as a backup',()=>{
  assert.throws(()=>core.parseBackup(JSON.stringify({records:[sample()]})),/Turtle Tracks/);
});
test('invalid and duplicate IDs cannot enter rendered journal actions',()=>{
  assert.throws(()=>core.validateRecords([sample({id:"');alert(1)//"})]),/ID/);
  assert.throws(()=>core.validateRecords([sample(),sample()]),/duplicate/);
});
test('photos cannot load remote URLs or executable SVG',()=>{
  assert.throws(()=>core.validateRecords([sample({photo:'https://example.test/tracker.png'})]),/photo/);
  assert.throws(()=>core.validateRecords([sample({photo:'data:image/svg+xml;base64,PHN2Zz4='})]),/photo/);
});
test('coordinates must be numeric and within latitude and longitude bounds',()=>{
  for(const gps of [{lat:91,lon:20},{lat:30,lon:181},{lat:'30',lon:20},{lat:30,lon:20,accuracy:-1}])assert.throws(()=>core.validateRecords([sample({gps})]));
});
test('merging never overwrites an existing edited observation',()=>{
  const current=sample({notes:'My corrected notes'}),incoming=[sample(),sample({id:'obs_2',date:'2026-11-12'})];
  const result=core.mergeRecords([current],incoming);
  assert.equal(result.added,1);assert.equal(result.skipped,1);assert.equal(result.records[0].notes,'My corrected notes');assert.equal(current.notes,'My corrected notes');
});
test('last-seen sorting uses observation date and time instead of insertion order',()=>{
  const input=[sample({id:'obs_old',date:'2026-01-01'}),sample({id:'obs_late',time:'17:30'}),sample()];
  assert.equal(core.sorted(input)[0].id,'obs_late');assert.equal(input[0].id,'obs_old');
});
test('next turtle number ignores digits in custom names',()=>{
  assert.equal(core.nextTurtleId([sample(),sample({turtleId:'Garden 2026'})]),'Turtle 002');
});
test('summary omits location by default and labels identification uncertainty',()=>{
  assert.doesNotMatch(core.summary(sample()),/Private garden/);assert.match(core.summary(sample(),true),/Private garden/);assert.match(core.summary(sample()),/not independently verified/);
});
// Exercise the actual save function under a quota failure, with no browser storage mutation.
test('a failed save preserves records and does not report success',()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8');
  const code=html.slice(html.indexOf('function saveRecords('),html.indexOf('function go('));
  const notices=[];const old=[sample()];
  const context={KEY:"test",records:old,storageLoadError:'',window:{localStorage:{setItem(){throw Error('quota')}}},document:{querySelectorAll(){return [{set textContent(v){notices.push(v)},hidden:true}]}}};
  vm.createContext(context);vm.runInContext(code,context);
  assert.equal(context.saveRecords([sample({id:'obs_new'})]),false);assert.equal(context.records,old);assert.match(notices.at(-1),/not been saved/);
});
test('a successful save commits data before updating in-memory records',()=>{
  const html=fs.readFileSync(__dirname+'/index.html','utf8');const code=html.slice(html.indexOf('function saveRecords('),html.indexOf('function go('));
  let saved;const next=[sample()];const context={KEY:'test',records:[],storageLoadError:'',window:{localStorage:{setItem(k,v){saved=JSON.parse(v)}}},document:{querySelectorAll(){return []}}};
  vm.createContext(context);vm.runInContext(code,context);assert.equal(context.saveRecords(next),true);assert.deepEqual(saved,next);assert.equal(context.records,next);
});
