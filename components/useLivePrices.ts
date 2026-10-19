"use client";
import {useEffect,useState} from 'react';
import {authClient} from '@/lib/client';
import type {PriceTick} from '@/lib/live-price';
export default function useLivePrices(symbols:string[],disabled=false){
 const key=[...new Set(symbols)].slice(0,30).sort().join(',');
 const [state,setState]=useState<{key:string;ticks:Record<string,PriceTick>;connected:boolean}>({key,ticks:{},connected:false});
 useEffect(()=>{
  if(disabled||!key)return;
  let active=true,controller:AbortController|null=null,retry:ReturnType<typeof setTimeout>|undefined,flush:ReturnType<typeof setTimeout>|undefined;
  let pending:Record<string,PriceTick>={},latest:Record<string,PriceTick>={},failures=0,generation=0;
  const publish=()=>{flush=undefined;if(!active)return;latest={...latest,...pending};pending={};setState({key,ticks:latest,connected:true});};
  const connect=async()=>{
   if(!active||document.visibilityState!=='visible')return;
   const run=++generation;controller?.abort();controller=new AbortController();
   try{
    const {data}=await authClient().auth.getSession();if(!data.session)return;
    const response=await fetch(`/api/price-stream?symbols=${encodeURIComponent(key)}`,{headers:{Authorization:`Bearer ${data.session.access_token}`},signal:controller.signal});
    if(!response.ok||!response.body)throw Error('Stream unavailable');
    const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
    while(active&&run===generation){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});if(buffer.length>100000)throw Error('Invalid stream');let split;while((split=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,split);buffer=buffer.slice(split+2);if(!frame.startsWith('data: '))continue;const event=JSON.parse(frame.slice(6));if(event.type==='prices'&&Array.isArray(event.ticks)){for(const tick of event.ticks)if(key.split(',').includes(tick?.symbol))pending[tick.symbol]=tick;failures=0;if(!flush)flush=setTimeout(publish,1000);}else if(event.type==='status'&&event.status!=='connecting'){setState(s=>({...s,connected:false}));}}}
   }catch{/* REST polling continues independently on auth/network/entitlement errors. */}
   if(active&&run===generation&&document.visibilityState==='visible'){setState(s=>({...s,connected:false}));retry=setTimeout(connect,Math.min(60000,1000*2**Math.min(failures++,6)));}
  };
  const visibility=()=>{generation++;clearTimeout(retry);controller?.abort();if(document.visibilityState==='visible')void connect();else setState(s=>({...s,connected:false}));};
  const age=setInterval(()=>{const now=Date.now();const valid=Object.fromEntries(Object.entries(latest).filter(([,v])=>now-Date.parse(v.asOf)<=120000));if(Object.keys(valid).length!==Object.keys(latest).length){latest=valid;setState({key,ticks:valid,connected:false});}},15000);
  document.addEventListener('visibilitychange',visibility);void connect();
  return()=>{active=false;controller?.abort();clearTimeout(retry);clearTimeout(flush);clearInterval(age);document.removeEventListener('visibilitychange',visibility);};
 },[key,disabled]);
 return !disabled&&state.key===key?state:{key,ticks:{},connected:false};
}
