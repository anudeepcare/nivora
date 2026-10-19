"use client";
import {useEffect,useRef,useState} from 'react';
import {useProduct} from './Session';
import type {Research} from '@/lib/types';
import {evidenceObservation,evidenceChanges,parseSavedEvidence,type SavedEvidence} from '@/lib/research-integrity';
export default function ResearchChanges({research:r}:{research:Research}){
 const {cache,owner,demo}=useProduct(),seen=useRef('');const [changes,setChanges]=useState<string[]>([]),[baseline,setBaseline]=useState(false),[saved,setSaved]=useState(true);
 useEffect(()=>{
  const token=`${owner}:${r.company.symbol}:${r.retrievedAt}`;if(seen.current===token)return;seen.current=token;
  const current=evidenceObservation(r),key=`auryn-observed-v1:${owner}:${r.company.symbol}`;
  let prior:SavedEvidence|null=null;
  try{const x=JSON.parse(localStorage.getItem(key)||'null');prior=parseSavedEvidence(x);}catch{}
  const list=evidenceChanges(prior,current);setChanges(list);setBaseline(!prior);setSaved(true);
  if(!demo)try{localStorage.setItem(key,JSON.stringify(current));}catch{setSaved(false);}
  if(list.length){const feed=(cache.get('brief:changes')?.value??[]) as {symbol:string;changes:string[];at:string}[];cache.set('brief:changes',{at:Date.now(),value:[{symbol:r.company.symbol,changes:list,at:r.retrievedAt},...feed.filter(x=>x.symbol!==r.company.symbol)].slice(0,12)});}
 },[r,owner,cache,demo]);
 return <section className="observed-changes"><span className="eyebrow">{baseline?'Your first observation':'Since your previous saved view'}</span>{changes.map(x=><p key={x}>{x}</p>)}{!changes.length&&<p>{baseline?'This view establishes a baseline. Future visits can show changes to available evidence.':'No tracked evidence changes detected since your saved view.'}</p>}<small>{!saved?'Device storage is unavailable; this observation will not persist.':demo?'Preview does not save observation history.':'Saved on this device for this account; not a continuous market monitor or complete revision history.'}</small></section>;
}
