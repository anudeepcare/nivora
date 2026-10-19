"use client";
import {useState} from 'react';
import type {Company,Position,Quote,Research} from '@/lib/types';
import {portfolioExposure} from '@/lib/connected-product';
import {amount,percent} from '@/lib/format';
import {useProduct} from './Session';
export default function PortfolioExposure({positions,quotes}:{positions:Position[];quotes:Record<string,{company?:Company;quote?:Quote}>}){
 const {cache,demo}=useProduct(),[move,setMove]=useState('-20');
 const sectors:Record<string,string>={};
 for(const p of positions){const cached=cache.get(`research/${encodeURIComponent(p.symbol.replace('/','-'))}`)?.value as Research|undefined;
 const r=cached??demo?.research[p.symbol];const sector=r?.evidence?.profile?.sector||r?.company.sector||quotes[p.symbol]?.company?.sector;if(sector)sectors[p.symbol]=sector;}
 const q=Object.fromEntries(Object.entries(quotes).flatMap(([s,v])=>v.quote?[[s,v.quote]]:[]));
 const x=portfolioExposure(positions,q,sectors,move.trim()?Number(move):NaN);
 const [open,setOpen]=useState(false);
 if(!positions.some(p=>p.assetType!=='cash'))return null;
 return <section className="portfolio-exposure"><header className="section-head"><div><span className="eyebrow">Shared exposure</span><h3>Different tickers. Similar risks.</h3><p>Sector and crypto groups across your priced USD assets.</p></div><button className="text-button" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'Close stress check':'Check a market move'}</button></header>
 <div className="exposure-groups">{x.groups.map(g=><div key={g.name}><span>{g.name}</span><i><b style={{width:`${g.weight}%`}}/></i><strong>{percent(g.weight)}</strong></div>)}</div>
 <p className="small muted">Classified {amount(x.classifiedValue)} of {amount(x.invested)} priced investments. Unclassified companies stay visible; opening their research may supply sector evidence. Sector labels are not measured factor sensitivities. Cash is included in weights.</p>
 {!!x.excluded.length&&<p className="context-note">Excluded from this view: {x.excluded.join(', ')}. Missing, older or non-USD prices are not converted.</p>}
 {open&&<div className="exposure-stress"><label>Assumed move in every priced investment · %<input type="number" min="-100" max="100" step="1" value={move} onChange={e=>setMove(e.target.value)}/></label><div><span>Hypothetical change</span><strong className={x.hypotheticalChange!=null&&x.hypotheticalChange<0?'negative':'positive'}>{x.hypotheticalChange==null?'Enter −100 to 100%':amount(x.hypotheticalChange)}</strong></div><p className="small muted">A uniform shock, not a prediction or correlation model. Recorded cash stays unchanged; no FX, leverage, taxes or liquidity effects.</p></div>}
 </section>;
}
