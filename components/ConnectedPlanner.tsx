"use client";
import {useEffect,useMemo,useState} from 'react';
import PlanningWorkbench from './PlanningWorkbench';
import {supabaseBrowser} from '@/lib/supabase';
import {usePortfolioQuotes} from './portfolio/usePortfolioQuotes';
import {positionValue,valuationSummary} from './portfolio/valuation';
import {planningEvidenceFromSnapshot} from '@/lib/auryn/planning/evidence';
import {authenticatedPlanningJournalStore} from '@/lib/auryn/workspace/planning-store';
export default function ConnectedPlanner({symbol,price,snapshot}:{symbol:string;price:number|null;snapshot:any}){
 const [rows,setRows]=useState<any[]|null>(null),[error,setError]=useState(''),[scope,setScope]=useState<string>();
 useEffect(()=>{let active=true;const s=supabaseBrowser();void s.auth.getUser().then(async({data,error})=>{if(error||!data.user)throw Error('Sign in to load your portfolio context.');const result=await s.from('portfolio_positions').select('*').eq('user_id',data.user.id);if(result.error)throw result.error;if(active){setScope(data.user.id);setRows(result.data??[]);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false};},[]);
 const requests=useMemo(()=>(rows??[]).filter(x=>x.asset_type!=='CASH').map(x=>({symbol:x.symbol,assetType:x.asset_type})),[rows]);
 const {quotes}=usePortfolioQuotes(requests,rows!==null&&requests.length>0);
 const summary=valuationSummary(rows??[],quotes),cash=rows===null?null:rows.filter(x=>x.asset_type==='CASH').reduce((sum,x)=>sum+(positionValue(x,null)??0),0);
 const values=rows?.filter(x=>x.symbol===symbol&&x.asset_type!=='CASH').map(x=>positionValue(x,quotes[x.symbol]?.market));
 const position=values&&!values.some(x=>x===null)?values.reduce<number>((sum,x)=>sum+(x??0),0):null;
 return <>{error&&<p role="status">{error} You can enter a personal cash and exposure scenario below.</p>}<PlanningWorkbench symbol={symbol} price={price} cash={cash} totalValue={rows===null?null:summary.totalValue} positionValue={position} evidence={planningEvidenceFromSnapshot(snapshot)} storageScope={scope} journalStore={authenticatedPlanningJournalStore}/></>;
}
