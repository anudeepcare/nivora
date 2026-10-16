"use client";
import {useEffect,useMemo,useState} from 'react';
import ContributionEditor from './research/ContributionEditor';
import {supabaseBrowser} from '@/lib/supabase';
import {usePortfolioQuotes} from './portfolio/usePortfolioQuotes';
import {positionValue,valuationSummary} from './portfolio/valuation';
import {planningEvidenceFromSnapshot} from '@/lib/auryn/planning/evidence';
export default function ConnectedPlanner({symbol,price,snapshot,onSaved}:{symbol:string;price:number|null;snapshot:any;onSaved?:()=>void}){
 const [rows,setRows]=useState<any[]|null>(null),[error,setError]=useState(''),[scope,setScope]=useState<string>();
 useEffect(()=>{let active=true,version=0,lastOwner:string|null=null;const s=supabaseBrowser();
  const load=async()=>{const ticket=++version;setRows(null);setError('');try{const {data,error}=await s.auth.getUser();if(error||!data.user)throw Error('Sign in to load your portfolio context.');lastOwner=data.user.id;const result=await s.from('portfolio_positions').select('*').eq('user_id',data.user.id);if(result.error)throw result.error;if(active&&ticket===version){setScope(data.user.id);setRows(result.data??[]);}}catch(e){if(active&&ticket===version)setError(e instanceof Error?e.message:'Portfolio context unavailable.')}};
  void load();const sub=s.auth.onAuthStateChange((_event,session)=>{if(lastOwner!==(session?.user.id??null)){lastOwner=session?.user.id??null;version++;setRows(null);setScope(undefined);setTimeout(()=>{if(active)void load()},0)}});return()=>{active=false;version++;sub.data.subscription.unsubscribe()};},[]);
 const requests=useMemo(()=>(rows??[]).filter(x=>x.asset_type!=='CASH').map(x=>({symbol:x.symbol,assetType:x.asset_type})),[rows]);
 const {quotes}=usePortfolioQuotes(requests,rows!==null&&requests.length>0);
 const summary=valuationSummary(rows??[],quotes),cash=rows===null?null:rows.filter(x=>x.asset_type==='CASH').reduce((sum,x)=>sum+(positionValue(x,null)??0),0);
 const values=rows?.filter(x=>x.symbol===symbol&&x.asset_type!=='CASH').map(x=>positionValue(x,quotes[x.symbol]?.market));
 const position=values&&!values.some(x=>x===null)?values.reduce<number>((sum,x)=>sum+(x??0),0):null;
 return <>{error&&<p role="status">{error} You can enter a personal cash and exposure scenario below.</p>}<ContributionEditor key={`${scope||"guest"}:${symbol}`} onSaved={onSaved} symbol={symbol} price={price} cash={cash} totalValue={rows===null?null:summary.totalValue} positionValue={position} evidence={planningEvidenceFromSnapshot(snapshot)}/></>;
}
