// Single-instance private storage. Mount a persistent volume in production.
import {mkdir,readFile,open,rename,chmod,unlink} from 'node:fs/promises';
import {join,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';

export class PrivateState {
  constructor(directory){
    if(!directory||!isAbsolute(directory))throw Error('An absolute private data directory is required.');
    this.directory=directory;this.locks=new Map();
    this.ready=mkdir(directory,{recursive:true,mode:0o700}).then(()=>chmod(directory,0o700));
  }
  path(key){if(!/^[a-z0-9_-]{1,150}$/.test(key))throw Error('Invalid storage key.');return join(this.directory,key+'.json')}
  async get(key){await this.ready;try{return JSON.parse(await readFile(this.path(key),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
  async put(key,value){
    await this.ready;const target=this.path(key),temp=target+'.'+randomUUID()+'.tmp';
    try{
      const file=await open(temp,'wx',0o600);
      try{await file.writeFile(JSON.stringify(value));await file.sync()}finally{await file.close()}
      await rename(temp,target);
      const directory=await open(this.directory,'r');try{await directory.sync()}finally{await directory.close()}
    }finally{await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e})}
  }
  async locked(key,fn){
    const previous=this.locks.get(key)||Promise.resolve();let release;
    const tail=new Promise(resolve=>{release=resolve});this.locks.set(key,tail);
    await previous;try{return await fn()}finally{release();if(this.locks.get(key)===tail)this.locks.delete(key)}
  }
  async reserveAnalysis(limit,now=Date.now()){
    return this.reserveDaily('analysis-budget',limit,now);
  }
  async reserveDaily(key,limit,now=Date.now()){
    return this.locked(key,async()=>{
      const day=new Date(now).toISOString().slice(0,10);let q=await this.get(key);
      if(q&&(!/^\d{4}-\d{2}-\d{2}$/.test(q.day)||!Number.isSafeInteger(q.used)||q.used<0))throw Error('Invalid usage ledger.');
      if(!q||q.day!==day)q={day,used:0};
      if(q.used>=limit)return false;q.used++;await this.put(key,q);return true;
    });
  }
}
