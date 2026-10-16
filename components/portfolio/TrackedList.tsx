"use client";
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,Bell,ChevronDown,Star,Trash2,RefreshCw,Plus,Search} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';
import AssetLogo from '@/components/AssetLogo';
import MetricHelp from '@/components/MetricHelp';
import {MarketLabel,money,quoteStatus} from './MarketLabel';
import {usePortfolioQuotes} from './usePortfolioQuotes';
import {saveWatchlistSymbol} from '@/lib/watchlist.mjs';
import {normalizeQuoteSymbol} from '@/lib/auryn/quote-symbol';
import {positivePrice,currentResearch} from './valuation';

export function trackedLenses(raw:any){
 const research=currentResearch(raw),lenses:{label:string;value:string;term:string}[]=[];
 if(research.thesisScore!=null&&Number.isFinite(Number(research.thesisScore))&&Number(research.thesisScore)>=0&&Number(research.thesisScore)<=100)lenses.push({label:'Business thesis',value:`${Math.round(Number(research.thesisScore))}/100`,term:'business'});
 if(research.longTermAction)lenses.push({label:'Long term',value:String(research.longTermAction).replaceAll('_',' '),term:'longTerm'});
 if(research.setupState)lenses.push({label:'Timing',value:String(research.setupState).replaceAll('_',' '),term:'timing'});
 return lenses;
}

export function TrackedItem({item,quote,now,alerts=false,busy,onRemove,onToggle}:{item:any;quote?:any;now?:number;alerts?:boolean;busy:boolean;onRemove:(item:any)=>void;onToggle:(item:any)=>void}){
 const status=quoteStatus(quote?.market,now),p=status.missing?null:positivePrice(quote?.market?.displayPrice),research=currentResearch(quote?.research),lenses=trackedLenses(quote?.research);
 const href=`/stock/${encodeURIComponent(item.symbol)}`,name=quote?.security?.name;
 const stamp=quote?.research?.observedAt,date=typeof stamp==='string'&&Number.isFinite(Date.parse(stamp))?new Date(stamp).toLocaleString():null;
 const priceLabel=p==null?'Price unavailable':status.current?quote?.market?.priceState==='OFFICIAL_CLOSE'?'Official close':quote?.market?.session==='CRYPTO_24X7'?'Live · 24/7':'Live price':status.stale?'Stale quote':'Unverified price';
 const targetPrice=positivePrice(item.target_price);
 const targetStatus=!item.is_active?'Paused':targetPrice==null?'Target unavailable':p==null?'Awaiting quote':!status.current?'Quote needs refresh':p>=targetPrice?'At or above target':'Below target';
 return <article className="pmWatchRow" data-symbol={item.symbol}>
  <Link className="pmWatchIdentity" href={href} aria-label={`Open ${item.symbol} investment research`}><AssetLogo symbol={item.symbol} name={name} logoUrl={quote?.security?.logoUrl||quote?.security?.logo} size={38}/><span><strong>{item.symbol}</strong><small>{name||(item.symbol.includes('/')?'Crypto':'Saved investment')}</small></span><ArrowUpRight size={14}/></Link>
  <div className="pmWatchPrice"><span className="pmWatchMobileLabel">Price · USD <MetricHelp term="price"/></span><strong>{money(p)}</strong><small title={status.label} data-current={status.current}>{priceLabel}</small></div>
  <div className="pmWatchLenses">{lenses.length?lenses.map(lens=><span className="pmWatchLens" key={lens.label}><small>{lens.label} <MetricHelp term={lens.term} title={lens.term==='longTerm'?'Long-term call':undefined} body={lens.term==='longTerm'?'The current canonical long-term research call. It is independent of the timing setup and requires current underlying evidence.':undefined}/></small><strong>{lens.value}</strong></span>):<span className="pmWatchPending">{quote?.research?.state==='STALE_VERIFIED'?'Research needs refresh':'Research pending'}</span>}</div>
  <button className="pmIcon pmWatchRemove" type="button" disabled={busy} aria-label={`Remove ${item.symbol}${alerts?' alert':''}`} onClick={()=>onRemove(item)}><Trash2 size={16}/></button>
  {alerts&&<div className="pmWatchTarget"><div><small>Saved target</small><strong>{money(targetPrice)}</strong></div><span>{targetStatus}</span><button className="pmSecondary" type="button" disabled={busy} onClick={()=>onToggle(item)}>{item.is_active?'Pause':'Resume'}</button></div>}
  <details className="pmWatchDetails"><summary>Source & research <ChevronDown size={14}/></summary><div><section><span className="pmWatchDetailLabel">Price source & timing</span><MarketLabel market={quote?.market} now={now}/>{(quote?.quoteError||quote?.quoteRefreshError)&&<p>{quote.quoteError||quote.quoteRefreshError}</p>}</section><section><span className="pmWatchDetailLabel">Canonical call</span><strong>{research.action?String(research.action).replaceAll('_',' '):'Research pending'}</strong><small>{date?`Research updated ${date}`:'Research timestamp unavailable'}</small></section>{research.warning&&<p>{research.warning}</p>}<Link href={href}>Open full research <ArrowUpRight size={14}/></Link></div></details>
 </article>;
}

export default function TrackedList({alerts=false}:{alerts?:boolean}){
 const [items,setItems]=useState<any[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[symbol,setSymbol]=useState(''),[target,setTarget]=useState(''),[search,setSearch]=useState(''),[showAdd,setShowAdd]=useState(false);
 const table=alerts?'alerts':'watchlist_items';
 const load=useCallback(async()=>{setLoading(true);setError('');try{const s=supabaseBrowser();const{data:{user},error}=await s.auth.getUser();if(error)throw error;if(!user){setItems([]);throw Error('Please sign in to view your saved items.')}const result=await s.from(table).select('*').eq('user_id',user.id).order('created_at',{ascending:false});if(result.error)throw result.error;setItems(result.data||[])}catch(e:any){setError(e.message||'Unable to load saved items.')}finally{setLoading(false)}},[table]);
 useEffect(()=>{load()},[load]);
 const quoteRequests=useMemo(()=>items.map(x=>x.symbol).sort(),[items]);
 const {quotes,refreshing,error:quoteError,now,refresh}=usePortfolioQuotes(quoteRequests,items.length>0);
 async function add(e:React.FormEvent){e.preventDefault();if(busy)return;const sym=normalizeQuoteSymbol(symbol);if(!/^[A-Z0-9][A-Z0-9./-]{0,19}$/.test(sym)||(alerts&&positivePrice(target)==null)){setError('Enter a valid symbol'+(alerts?' and a positive target price.':'.'));return}if(!alerts&&items.some(x=>normalizeQuoteSymbol(x.symbol)===sym)){setError(`${sym} is already on your watchlist.`);return}setBusy(true);setError('');try{const s=supabaseBrowser();const{data:{user},error}=await s.auth.getUser();if(error)throw error;if(!user)throw Error('Please sign in again.');if(alerts){const result=await s.from('alerts').insert({user_id:user.id,symbol:sym,alert_type:'price',target_price:Number(target),is_active:true});if(result.error)throw result.error;}else{await saveWatchlistSymbol(s,user.id,sym);}setSymbol('');setTarget('');setShowAdd(false);await load();setNotice(`${sym} ${alerts?'alert':'watchlist item'} saved.`)}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 async function remove(x:any){if(!window.confirm(`Remove ${x.symbol} ${alerts?'alert':'from your watchlist'}?`))return;setBusy(true);setError('');try{const{error}=await supabaseBrowser().from(table).delete().eq('id',x.id);if(error)throw error;setItems(v=>v.filter(row=>row.id!==x.id));setNotice(`${x.symbol} removed.`)}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 async function toggle(x:any){setBusy(true);setError('');try{const{error}=await supabaseBrowser().from('alerts').update({is_active:!x.is_active}).eq('id',x.id);if(error)throw error;setItems(v=>v.map(row=>row.id===x.id?{...row,is_active:!x.is_active}:row))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 const visible=items.filter(x=>`${x.symbol} ${quotes[x.symbol]?.security?.name||''}`.toLowerCase().includes(search.trim().toLowerCase()));
 return <section className="pmPage pmTrackedPage"><header className="pmHead"><div><span className="pmEyebrow">{alerts?'STAY INFORMED':'YOUR RESEARCH SHORTLIST'}</span><h1>{alerts?'Monitor':'Watchlist'}</h1><p>{alerts?'Your saved price targets, in context.':'The investments you want to understand better.'}</p></div><div className="pmActions"><button className="pmSecondary" onClick={()=>Promise.all([load(),refresh()])} disabled={loading||busy||refreshing} aria-label={`Refresh ${alerts?'alerts':'watchlist'}`}><RefreshCw size={16}/></button><button className="pmPrimary" onClick={()=>setShowAdd(value=>!value)} aria-expanded={showAdd}><Plus size={17}/>{alerts?'Create alert':'Add investment'}</button></div></header>
 {error&&<div className="pmMessage" role="alert">{error}</div>}{notice&&<div className="pmNotice" role="status">{notice}</div>}{quoteError&&<div className="pmNotice" role="status">{quoteError}</div>}
 {(showAdd||(!loading&&!items.length))&&<section className="pmCard pmWatchAdd"><h2>{alerts?'Create a price alert':'Add to your watchlist'}</h2><form className="pmTrackForm" onSubmit={add}><label>Symbol<input required maxLength={20} placeholder="Symbol or crypto pair" value={symbol} onChange={e=>setSymbol(e.target.value)}/></label>{alerts&&<label>Target price ($)<input required type="number" min="0.000001" step="any" placeholder="0.00" value={target} onChange={e=>setTarget(e.target.value)}/></label>}<button disabled={busy} className="pmPrimary"><Plus size={16}/>{busy?'Saving…':alerts?'Create alert':'Add symbol'}</button></form>{alerts&&<p className="pmFootnote">Targets are for monitoring. A comparison does not confirm a price crossing or notification delivery.</p>}</section>}
 <section className="pmCard pmWatchlistCard" aria-label={alerts?'Saved price alerts':'Saved investments'}><div className="pmWatchToolbar"><div><h2>{alerts?'Your alerts':'Your watchlist'} <span>{items.length}</span></h2><small>{alerts?`${items.filter(x=>x.is_active).length} active targets`:'Your saved research · USD prices'}</small></div><label className="pmHoldingSearch pmWatchSearch"><span className="pmSrOnly">Filter saved investments</span><Search size={16}/><input type="search" placeholder="Find an investment…" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
 <div className="pmWatchColumnHead"><span>Investment</span><span>Price <MetricHelp term="price"/></span><span>Research lenses</span><span/></div>
 {loading?<div className="pmEmpty" role="status">Loading {alerts?'alerts':'watchlist'}…</div>:!visible.length?<div className="pmEmpty">{alerts?<Bell size={28}/>:<Star size={28}/>}<h2>{items.length?'No matching investments':alerts?'Set your first target':'Make room for your next idea'}</h2><p>{items.length?'Try another symbol or company name.':alerts?'Add a target to keep a price level in view.':'Save an investment to follow its price and research.'}</p><Link href="/analyze" className="pmTextLink">Explore research <ArrowUpRight size={14}/></Link></div>:<div className="pmWatchRows">{visible.map(item=><TrackedItem key={item.id} item={item} quote={quotes[item.symbol]} now={now} alerts={alerts} busy={busy} onRemove={remove} onToggle={toggle}/>)}</div>}
 <p className="pmWatchFootnote">Business thesis, long-term call and timing reflect available canonical research. Open source details for dates and limitations.</p></section>
 </section>;
}
