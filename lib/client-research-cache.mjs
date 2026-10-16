const abortError=()=>new DOMException('Research request aborted','AbortError');
export const COMPANY_EVIDENCE_CONTRACT='sec-company-evidence-v3';
export function isCurrentCompanyEvidence(data){return data?.dataQuality?.contractVersion===COMPANY_EVIDENCE_CONTRACT;}

function boundedStore(maxEntries,now) {
  const entries=new Map();
  const prune=()=>{
    for(const [key,entry] of entries)if(now()>=entry.expiresAt)entries.delete(key);
  };
  return {
    get(key) {
      prune();const entry=entries.get(key);
      if(entry){entries.delete(key);entries.set(key,entry);}
      return entry;
    },
    set(key,entry) {
      prune();entries.delete(key);entries.set(key,entry);
      while(entries.size>maxEntries)entries.delete(entries.keys().next().value);
    },
  };
}

/** Deduplicate browser GETs without sharing a caller's AbortController.
 * Cache age limits transport reuse only; source timestamps/freshness are never changed.
 */
export function createResearchJsonCache({fetcher=(...args)=>fetch(...args),now=Date.now,maxEntries=48}={}) {
  const completed=boundedStore(Math.max(1,maxEntries),now);
  const inFlight=new Map();
  function peek(url,ttlMs=15_000) {
    const entry=completed.get(url);
    return entry&&now()-entry.storedAt<ttlMs?entry.data:undefined;
  }
  function get(url,{signal,ttlMs=15_000}={}) {
    if(signal?.aborted)return Promise.reject(abortError());
    const cached=peek(url,ttlMs);
    if(cached!==undefined)return Promise.resolve(cached);
    let entry=inFlight.get(url);
    if(!entry){
      const controller=new AbortController();
      entry={controller,subscribers:new Set(),ttlMs,settled:false,promise:null};
      inFlight.set(url,entry);
      let response;
      try{response=fetcher(url,{signal:controller.signal,cache:'no-store'});}catch(error){response=Promise.reject(error);}
      const request=entry;
      request.promise=Promise.resolve(response).then(async result=>{
        const data=await result.json();
        if(controller.signal.aborted)throw abortError();
        if(!result.ok||data?.error)throw new Error(data?.error||`Request failed (${result.status})`);
        if(request.subscribers.size&&request.ttlMs>0){
          const storedAt=now();
          completed.set(url,{storedAt,expiresAt:storedAt+request.ttlMs,data});
        }
        return data;
      }).finally(()=>{
        request.settled=true;
        if(inFlight.get(url)===request)inFlight.delete(url);
      });
    }else entry.ttlMs=Math.min(entry.ttlMs,ttlMs);
    const request=entry;
    return new Promise((resolve,reject)=>{
      const subscriber={};let active=true;
      const finish=()=>{active=false;request.subscribers.delete(subscriber);signal?.removeEventListener('abort',onAbort);};
      const onAbort=()=>{
        if(!active)return;
        finish();reject(abortError());
        // A synchronous Strict Mode remount may reacquire this request. If nobody
        // does, release the network operation after the current effect cleanup.
        queueMicrotask(()=>{
          if(!request.settled&&!request.subscribers.size){
            request.controller.abort();
            if(inFlight.get(url)===request)inFlight.delete(url);
          }
        });
      };
      request.subscribers.add(subscriber);
      signal?.addEventListener('abort',onAbort,{once:true});
      request.promise.then(data=>{if(active){finish();resolve(data);}},error=>{if(active){finish();reject(error);}});
    });
  }
  return {get,peek};
}

/** Keep the structural research clock independent from each evidence clock. */
export function createResearchWarmCache({now=Date.now,maxEntries=24,maxAgeMs=7*24*60*60*1_000}={}) {
  const entries=boundedStore(Math.max(1,maxEntries),now);
  const get=key=>entries.get(key)?.data;
  const set=(key,data)=>{entries.set(key,{data,expiresAt:now()+maxAgeMs});return data;};
  const merge=(key,patch)=>{
    const next={...(get(key)||{ts:0}),...patch};
    if(Object.prototype.hasOwnProperty.call(patch,'d'))next.ts=now();
    for(const field of ['company','context','institutional'])if(Object.prototype.hasOwnProperty.call(patch,field))next[`${field}Ts`]=now();
    return set(key,next);
  };
  return {get,set,merge};
}
