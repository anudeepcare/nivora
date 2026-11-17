import fs from 'node:fs/promises';
import path from 'node:path';
const validNumber=value=>Number.isFinite(value)&&value>0;

// The in-memory implementation is also the contract used by a persistent store.
// It deliberately stores only provider names, window timestamps and weighted usage.
export class MemoryQuotaLedger {
  constructor({now=Date.now}={}){this.now=now;this.state=new Map()}
  async reserve({provider,weight,budget,windowMs}){
    if(!provider||!validNumber(weight)||!validNumber(budget)||!validNumber(windowMs)||weight>budget)return{status:'invalid-request',waitMs:0};
    const now=this.now(),existing=this.state.get(provider);let windowStart=existing?.windowStart??now,used=existing?.used??0;
    if(now-windowStart>=windowMs){windowStart=now;used=0}
    if(used+weight>budget)return{status:'deferred',waitMs:Math.max(0,windowStart+windowMs-now)};
    this.state.set(provider,{windowStart,used:used+weight});return{status:'reserved',waitMs:0}
  }
  snapshot(){return Object.fromEntries([...this.state.entries()].map(([provider,value])=>[provider,{...value}]))}
}

export class JsonFileQuotaLedger {
  constructor(filePath,{now=Date.now,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),lockRetries=50,staleLockMs=30000,processAlive=pid=>{try{process.kill(pid,0);return true}catch{return false}}}={}){if(!path.isAbsolute(filePath))throw new Error('Quota ledger path must be absolute');this.filePath=filePath;this.lockPath=`${filePath}.lock`;this.now=now;this.wait=wait;this.lockRetries=lockRetries;this.staleLockMs=staleLockMs;this.processAlive=processAlive}
  async reserve(input){if(!input?.provider||!validNumber(input.weight)||!validNumber(input.budget)||!validNumber(input.windowMs)||input.weight>input.budget)return{status:'invalid-request',waitMs:0};await fs.mkdir(path.dirname(this.filePath),{recursive:true,mode:0o700});let lock;for(let attempt=0;attempt<this.lockRetries;attempt++){try{lock=await fs.open(this.lockPath,'wx',0o600);await lock.writeFile(JSON.stringify({pid:process.pid,createdAt:this.now()}));break}catch(error){if(error.code!=='EEXIST')throw error;try{const stat=await fs.stat(this.lockPath),text=await fs.readFile(this.lockPath,'utf8'),stale=this.now()-stat.mtimeMs>this.staleLockMs;let abandoned=stale&&text.trim()==='';if(stale&&text.trim()!==''){try{const owner=JSON.parse(text);abandoned=Number.isSafeInteger(owner?.pid)&&owner.pid>0&&!this.processAlive(owner.pid)}catch{abandoned=false}}if(abandoned){await fs.unlink(this.lockPath);continue}}catch(checkError){if(checkError.code==='ENOENT')continue;throw checkError}await this.wait(10)}}if(!lock)return{status:'busy',waitMs:0};try{let state={};try{state=JSON.parse(await fs.readFile(this.filePath,'utf8'));const validState=state&&typeof state==='object'&&!Array.isArray(state)&&Object.values(state).every(entry=>entry&&typeof entry==='object'&&Number.isFinite(entry.windowStart)&&entry.windowStart>=0&&entry.windowStart<=this.now()&&Number.isFinite(entry.used)&&entry.used>=0);if(!validState)return{status:'corrupt-state',waitMs:0}}catch(error){if(error.code==='ENOENT')state={};else if(error.name==='SyntaxError')return{status:'corrupt-state',waitMs:0};else throw error}const now=this.now(),existing=state[input.provider];let windowStart=existing?.windowStart??now,used=existing?.used??0;if(now-windowStart>=input.windowMs){windowStart=now;used=0}if(used+input.weight>input.budget)return{status:'deferred',waitMs:Math.max(0,windowStart+input.windowMs-now)};state[input.provider]={windowStart,used:used+input.weight};const temporary=`${this.filePath}.${process.pid}.tmp`;await fs.writeFile(temporary,JSON.stringify(state),{mode:0o600});await fs.rename(temporary,this.filePath);return{status:'reserved',waitMs:0}}finally{await lock.close();await fs.unlink(this.lockPath).catch(()=>{})}}
  async snapshot(){try{return JSON.parse(await fs.readFile(this.filePath,'utf8'))}catch{return{}}}
}
