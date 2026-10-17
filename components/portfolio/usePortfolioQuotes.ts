'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {cachedPortfolioQuotes,fetchCachedPortfolioQuotes} from './quote-cache';
import type {QuoteRequest} from './quote-client';
import {createQuoteRefreshController,mergeQuoteResults} from './quote-refresh';

export function usePortfolioQuotes(requests:QuoteRequest[],enabled=true){
 const [quotes,setQuotes]=useState<Record<string,any>>(()=>cachedPortfolioQuotes(requests)),[now,setNow]=useState(()=>Date.now());
 const [state,setState]=useState({loading:false,refreshing:false,error:'',lastCheckedAt:null as number|null});
 const current=useRef(quotes),controller=useRef<ReturnType<typeof createQuoteRefreshController>|null>(null);
 const key=JSON.stringify(requests);
 useEffect(()=>{
  if(!enabled)return;
  const active:QuoteRequest[]=JSON.parse(key);
  const cached=cachedPortfolioQuotes(active);current.current=mergeQuoteResults(current.current,cached);setQuotes(current.current);
  const next=createQuoteRefreshController({requests:active,fetcher:fetchCachedPortfolioQuotes,getQuotes:()=>current.current,isVisible:()=>document.visibilityState!=='hidden',
   onQuotes:result=>{current.current=mergeQuoteResults(current.current,result);setQuotes(current.current);setNow(Date.now());},onState:setState});
  controller.current=next;const wake=()=>{if(document.visibilityState!=='hidden'){setNow(Date.now());void next.wake();}};
  void next.wake();document.addEventListener('visibilitychange',wake);window.addEventListener('focus',wake);
  // Aging labels do not fetch data. Network refresh uses the bounded controller.
  const clock=window.setInterval(()=>{if(document.visibilityState!=='hidden')setNow(Date.now())},15_000);
  return()=>{next.dispose();controller.current=null;document.removeEventListener('visibilitychange',wake);window.removeEventListener('focus',wake);window.clearInterval(clock);};
 },[key,enabled]);
 const refresh=useCallback(()=>controller.current?.refresh()??Promise.resolve(false),[]);
 const awaitingFirst=enabled&&requests.some(request=>!quotes[typeof request==='string'?request:request.symbol]);
 return{quotes,...state,loading:awaitingFirst||(state.loading&&Object.keys(quotes).length===0),now,refresh};
}
