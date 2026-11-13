/* Shared validation and journal operations; no browser or network dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TurtleJournalCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const maxRecords = 5000;
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T12:00:00Z');
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }
  function field(value, limit, name) {
    if (value == null) return '';
    if (typeof value !== 'string' || value.length > limit) throw Error('Invalid ' + name + '.');
    return value;
  }
  function validateRecords(input) {
    if (!Array.isArray(input) || input.length > maxRecords) throw Error('Choose a Turtle Tracks backup with up to 5,000 observations.');
    const ids = new Set();
    return input.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw Error('Invalid observation ' + (index + 1) + '.');
      const id = field(item.id, 120, 'observation ID');
      if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id)) throw Error('The backup has an invalid or duplicate observation ID.');
      ids.add(id);
      if (!validDate(item.date)) throw Error('The backup has an invalid observation date.');
      const time = field(item.time, 8, 'time');
      if (time && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time)) throw Error('The backup has an invalid time.');
      const photo = field(item.photo, 12000000, 'photo');
      if (photo && !/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)) throw Error('The backup includes an unsupported photo.');
      let gps = null;
      if (item.gps != null) {
        const p = item.gps;
        if (typeof p !== 'object' || !Number.isFinite(p.lat) || !Number.isFinite(p.lon) || Math.abs(p.lat) > 90 || Math.abs(p.lon) > 180) throw Error('The backup has an invalid GPS position.');
        if (p.accuracy != null && (!Number.isFinite(p.accuracy) || p.accuracy < 0)) throw Error('The backup has invalid GPS accuracy.');
        gps = {lat:p.lat, lon:p.lon, accuracy:p.accuracy ?? null, timestamp:field(p.timestamp, 50, 'GPS timestamp')};
      }
      let assessment = null;
      if (item.assessment != null) {
        if (typeof item.assessment !== 'object') throw Error('Invalid field estimate.');
        assessment = {};
        for (const key of ['sex','confidence','stage','eye','pl']) assessment[key] = field(item.assessment[key], 100, 'field estimate');
      }
      let photoAnalysis=null;
      if(item.photoAnalysis!=null){
        if(!photo||item.photoAnalysis.accepted!==true)throw Error('Photo suggestions must be reviewed and attached to a photo.');
        const photoCore=typeof module==='object'&&module.exports?require('./photo-analysis-core.js'):TurtlePhotoCore;
        photoAnalysis={...photoCore.normalize(item.photoAnalysis),source:'AI photo suggestion',model:field(item.photoAnalysis.model,100,'analysis model'),analyzedAt:field(item.photoAnalysis.analyzedAt,50,'analysis date'),accepted:true};
      }
      return {id, date:item.date, time, location:field(item.location, 2000, 'location'), behavior:field(item.behavior, 200, 'behavior'), habitat:field(item.habitat, 200, 'habitat'), notes:field(item.notes, 30000, 'notes'), photo, gps, turtleId:field(item.turtleId, 200, 'turtle ID'), assessment, photoAnalysis};
    });
  }
  function parseBackup(text) {
    const data = JSON.parse(text);
    if (!Array.isArray(data) && (!data || data.app !== 'Turtle Tracks' || ![2,3].includes(data.version))) throw Error('Choose a Turtle Tracks JSON backup.');
    return validateRecords(Array.isArray(data) ? data : data.records);
  }
  function sorted(records) {
    return records.slice().sort((a,b) => (b.date+'T'+(b.time||'00:00')).localeCompare(a.date+'T'+(a.time||'00:00')));
  }
  function mergeRecords(existing, incoming) {
    const ids = new Set(existing.map(r => r.id));
    const added = incoming.filter(r => !ids.has(r.id));
    if (existing.length + added.length > maxRecords) throw Error('This import would exceed 5,000 observations.');
    return {records:sorted(existing.concat(added)), added:added.length, skipped:incoming.length-added.length};
  }
  function nextTurtleId(records) {
    const numbers = records.map(r => /^Turtle (\d+)$/.exec(r.turtleId || '')).filter(Boolean).map(m => Number(m[1]));
    return 'Turtle ' + String(Math.max(0,...numbers)+1).padStart(3,'0');
  }
  function summary(record, includeLocation) {
    return 'Turtle Tracks observation\nSpecies: not independently verified (Eastern Box Turtle field guide)\nDate: '+record.date+' '+record.time+'\nLocation: '+(includeLocation ? record.location || 'Not recorded' : 'Withheld to protect wild turtles')+'\nBehavior: '+record.behavior+'\nHabitat: '+record.habitat+'\nTurtle ID: '+record.turtleId+'\nNotes: '+record.notes;
  }
  return {validDate, validateRecords, parseBackup, sorted, mergeRecords, nextTurtleId, summary};
});
