"use client";
import {useEffect,useRef,useState} from 'react';
import {Bitcoin} from 'lucide-react';
import {assetIdentity,assetLogoCandidates} from '@/lib/asset-identity';
const profileLogos=new Map<string,Promise<string|null>>();
let pendingProfiles=0;
const profileQueue:Array<()=>void>=[];
function profileLogo(symbol:string){
 if(!profileLogos.has(symbol)){
  const request=new Promise<string|null>(resolve=>{
   const run=()=>{pendingProfiles++;fetch('/api/security-profile/'+encodeURIComponent(symbol)).then(r=>r.ok?r.json():null).then(value=>resolve(value?.logoUrl||null)).catch(()=>resolve(null)).finally(()=>{pendingProfiles--;profileQueue.shift()?.()})};
   if(pendingProfiles<3)run();else profileQueue.push(run);
  });
  profileLogos.set(symbol,request);if(profileLogos.size>300)profileLogos.delete(profileLogos.keys().next().value!);
 }
 return profileLogos.get(symbol)!;
}
function LogoImage({candidates,symbol}:{candidates:string[];symbol:string}){
 const [index,setIndex]=useState(0),[loaded,setLoaded]=useState(false);
 const fail=()=>{setLoaded(false);setIndex(value=>value+1)};
 return <><b className="assetLogoFallback" style={{visibility:loaded?'hidden':'visible'}}>{symbol.slice(0,2)}</b>{candidates[index]&&<img key={candidates[index]} src={candidates[index]} alt="" decoding="async" referrerPolicy="no-referrer" style={{opacity:loaded?1:0}} onLoad={event=>{if(event.currentTarget.naturalWidth<4||event.currentTarget.naturalHeight<4)fail();else setLoaded(true)}} onError={fail}/>}</>;
}
export default function AssetLogo({symbol,name,logoUrl,size=40}:{symbol:string;name?:string;logoUrl?:string|null;size?:number}){
 const identity=assetIdentity(symbol,name),[profile,setProfile]=useState<{symbol:string;url:string|null}|null>(null),element=useRef<HTMLSpanElement>(null);
 const candidates=assetLogoCandidates(symbol,name,logoUrl||(profile?.symbol===symbol?profile.url:null));
 const needsProfile=!identity.ambiguous&&!identity.local&&!identity.crypto&&!identity.microsoft&&!logoUrl&&/^[A-Z][A-Z0-9.-]{0,14}$/.test(symbol);
 useEffect(()=>{
  if(!needsProfile||!element.current)return;let active=true,requested=false;
  const load=()=>{if(requested)return;requested=true;void profileLogo(symbol).then(url=>{if(active)setProfile({symbol,url})})};
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){load();observer.disconnect()}},{rootMargin:'100px'});observer.observe(element.current);
  return()=>{active=false;observer.disconnect()};
 },[symbol,needsProfile]);
 return <span ref={element} className={`assetLogo ${identity.crypto?`assetLogo${identity.crypto}`:''}`} style={{width:size,height:size,minWidth:size}} aria-hidden="true" title={name||identity.key}>
  {identity.crypto==='BTC'?<Bitcoin size={26} strokeWidth={2.2}/>:identity.microsoft?<svg viewBox="0 0 24 24" width="26" height="26"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#7fba00" d="M13 1h10v10H13z"/><path fill="#00a4ef" d="M1 13h10v10H1z"/><path fill="#ffb900" d="M13 13h10v10H13z"/></svg>:identity.crypto==='ETH'?<svg viewBox="0 0 32 32" width="26" height="26"><path fill="#627eea" d="m16 2-9 15 9 5 9-5L16 2Zm0 22-9-5 9 12 9-12-9 5Z"/></svg>:<LogoImage key={identity.key+'|'+candidates.join('|')} candidates={candidates} symbol={identity.key}/>}
 </span>;
}
