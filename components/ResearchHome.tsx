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
 return <section className="researchHome">
   <header className="researchHomeWelcome"><span className="uxEyebrow">YOUR INVESTMENT WORKSPACE</span><h1>Your research,<br/><span>in focus.</span></h1><p>Understand the business. Know the price.<br className="homeMobileBreak"/> Plan your next move.</p><SearchBox large/><span className="researchHomeHint"><Search size={13}/> Company name, ticker or crypto pair</span></header>
   <section className="researchHomeContinue" aria-labelledby="continue-research"><header><div><span className="uxEyebrow">PERSONAL TO YOU</span><h2 id="continue-research">{recent.length?'Pick up where you left off':'Your saved investments'}</h2></div>{recent.length>0&&<button className="homeQuietButton" onClick={clearRecent}>Clear recent</button>}</header>
     {error&&<p className="homeNotice" role="status">{error}</p>}
     {loading?<div className="homeResearchEmpty" role="status">Loading your workspace…</div>:displayed.length?<div className="homeResearchGrid">{displayed.map(item=>{const quote=quotes[item.symbol],status=quoteStatus(quote?.market,now);return <Link key={item.symbol} href={`/stock/${encodeURIComponent(item.symbol)}`} className="homeResearchCard"><div className="homeAssetIdentity"><AssetLogo symbol={item.symbol} name={quote?.security?.name||item.name} logoUrl={quote?.security?.logoUrl} size={40}/><span><b>{item.symbol}</b><small>{quote?.security?.name||item.name}</small></span><ArrowUpRight size={17}/></div><div className="homeAssetValue"><strong>{money(status.missing?null:quote?.market?.displayPrice)}</strong><span>{quote?.market?status.label:'Awaiting quote'}</span></div><footer><Clock3 size={12}/><span>{item.kind}</span><small title={status.label}>{status.timestamp?new Date(status.timestamp).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'Open research'}</small></footer></Link>;})}</div>:<div className="homeResearchEmpty"><span className="homeEmptyIcon"><Search size={24}/></span><h3>Start with a company you care about.</h3><p>Search above to explore its business, valuation and market structure. Your recent research will appear here.</p><Link href="/watchlist">Manage your watchlist <ArrowUpRight size={14}/></Link></div>}
   </section>
   <section className="homeLenses" aria-labelledby="home-lenses"><header><h2 id="home-lenses">A clearer investment decision</h2><Link href="/methodology">How AURYN works <ArrowUpRight size={15}/></Link></header><div>{[{icon:Building2,term:'business',title:'Understand the business',text:'Growth, cash flow & competitive advantage.'},{icon:ChartNoAxesCombined,term:'valuation',title:'Know what you’re paying',text:'Scenarios with visible assumptions.'},{icon:ShieldCheck,term:'timing',title:'Put timing in context',text:'Trend, support & execution risk.'}].map(({icon:Icon,...item})=><article key={item.term}><span className="homeLensIcon"><Icon size={22}/></span><div><h3>{item.title} <MetricHelp term={item.term}/></h3><p>{item.text}</p></div></article>)}</div></section>
 </section>;
}
