"use client";
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Building2,ChartNoAxesCombined,Clock3,Search,ShieldCheck} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';
import {mergeRecentResearch,recentResearchKey,validResearchSymbol,type RecentResearch} from '@/lib/research-discovery';
import {usePortfolioQuotes} from '@/components/portfolio/usePortfolioQuotes';
import {money,quoteStatus} from '@/components/portfolio/MarketLabel';
import SearchBox from './SearchBox';
import AssetLogo from './AssetLogo';
import {Panel,PageHeading} from './glass/GlassUi';
import MetricHelp from './MetricHelp';
type Saved={symbol:string;name:string;kind:string};
export default function ResearchHome(){
 const [recent,setRecent]=useState<RecentResearch[]>([]),[saved,setSaved]=useState<Saved[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[userId,setUserId]=useState('');
 useEffect(()=>{let active=true;
   (async()=>{try{const client=supabaseBrowser();const {data:{user},error:authError}=await client.auth.getUser();if(authError)throw authError;if(!user)throw Error('Please sign in to see your research.');if(!active)return;setUserId(user.id);
     try{setRecent(mergeRecentResearch(JSON.parse(localStorage.getItem(recentResearchKey(user.id))||'[]')));}catch{setRecent([]);}
     const results=await Promise.allSettled([client.from('watchlist_items').select('symbol').eq('user_id',user.id).order('created_at',{ascending:false}).limit(6),client.from('portfolio_positions').select('symbol,asset_type').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(6)]);
     if(!active)return;const seen=new Set<string>(),next:Saved[]=[];let failed=false;
     results.forEach((result,index)=>{if(result.status!=='fulfilled'||result.value.error){failed=true;return;}for(const row of result.value.data||[]){if(('asset_type' in row&&row.asset_type==='CASH')||!validResearchSymbol(row.symbol)||seen.has(row.symbol))continue;seen.add(row.symbol);next.push({symbol:row.symbol,name:row.symbol,kind:index===0?'Watchlist':'Portfolio'});}});
     setSaved(next.slice(0,6));if(failed)setError('Some saved investments could not be loaded. Search and recent research remain available.');
   }catch(e:any){if(active)setError(e.message||'Unable to load saved research.');}finally{if(active)setLoading(false);}})();return()=>{active=false;};
 },[]);
 const displayed=useMemo(()=>recent.length?recent.slice(0,6).map(item=>({...item,kind:'Recently viewed'})):saved,[recent,saved]);
 const requests=useMemo(()=>displayed.map(item=>({symbol:item.symbol,assetType:item.symbol.includes('/')?'CRYPTO':'EQUITY'})),[displayed]);
 const {quotes,now}=usePortfolioQuotes(requests,!loading&&requests.length>0);
 function clearRecent(){try{if(userId)localStorage.removeItem(recentResearchKey(userId));setRecent([]);}catch{setError('Your browser could not clear recent research.');}}
 return <section className="glassResearchHome"><PageHeading title="Your research, in focus." subtitle="Understand the business. Know the price. Plan your next move."/><Panel><SearchBox large/><p className="au-policy">Search a company name, stock symbol or crypto pair.</p></Panel><Panel className="au-support" title={recent.length?'Pick up where you left off':'Your saved investments'} action={recent.length>0?<button className="au-link" onClick={clearRecent}>Clear recent</button>:null}>{error&&<p className="au-note" role="status">{error}</p>}{loading?<p role="status">Loading your workspace…</p>:<div className="au-list">{displayed.map(item=>{const quote=quotes[item.symbol],status=quoteStatus(quote?.market,now);return <Link key={item.symbol} href={`/stock/${encodeURIComponent(item.symbol)}`} className="au-listrow glassStockLink"><div className="au-security"><AssetLogo symbol={item.symbol} name={quote?.security?.name||item.name} logoUrl={quote?.security?.logoUrl} size={40}/><div><strong>{quote?.security?.name||item.name}</strong><span className="au-meta">{item.symbol} · {item.kind}</span></div></div><div className="au-end"><strong>{money(status.missing?null:quote?.market?.displayPrice)}</strong><span className="au-meta">{status.label}</span></div></Link>})}{!displayed.length&&<div className="au-empty"><Search size={24}/><h3>Start with a company you care about.</h3><p>Your recent research will appear here.</p></div>}</div>}</Panel><div className="au-three au-support">{[{term:'business',title:'Understand the business',text:'Growth, cash flow & competitive advantage.'},{term:'valuation',title:'Know what you’re paying',text:'Scenarios with visible assumptions.'},{term:'timing',title:'Put timing in context',text:'Trend, support & execution risk.'}].map(item=><Panel key={item.term} title={<>{item.title} <MetricHelp term={item.term}/></>}><p className="au-small au-muted">{item.text}</p></Panel>)}</div></section>;
}
