"use client";
import {useState} from 'react';
import type {Research} from '@/lib/types';
import type {SegmentRow} from '@/lib/market-context';
import {modelCoverage} from '@/lib/research-depth';
import {amount,dateLabel} from '@/lib/format';
import {useProduct,useResource} from './Session';
export default function BusinessMap({research:r}:{research:Research}){
 const {demo}=useProduct(),[segmentsEnabled,setSegmentsEnabled]=useState(false),[axis,setAxis]=useState('ProductOrService');
 const path=encodeURIComponent(r.company.symbol.replace('/','-'));
 const segments=useResource<{rows:SegmentRow[];conflicts:number;observedAt:string}>(!demo&&segmentsEnabled?`research-context/${path}?kind=segments`:null,undefined,86400000);
 const available=segments.data?.rows.filter(x=>x.axis===axis)??[],period=available.map(x=>x.period).sort().at(-1),current=available.filter(x=>x.period===period),concepts=[...new Set(current.map(x=>x.concept))],unitSet=[...new Set(current.map(x=>x.unit))];
 const profile=r.evidence?.profile,coverage=modelCoverage(r.company.symbol,r.company.assetType,{sector:profile?.sector||r.company.sector,industry:profile?.industry});
 if(r.company.assetType==='crypto')return null;
 return <section className="business-map"><header className="section-head"><div><span className="eyebrow">Business map</span><h3>Understand the engine</h3><p>{profile?.sector||r.company.sector||'Sector not supplied'} · {profile?.industry||'Industry not supplied'}</p></div></header>
 <p>{r.company.description||profile?.description||'A company description is not supplied. Read the latest company filing before inferring how it makes money.'}</p>
 <div className="business-driver-grid">{coverage.drivers.map(driver=><div key={driver}><span>Driver to investigate</span><strong>{driver}</strong></div>)}</div>
 <p className="small muted">{coverage.method} Classification: {coverage.classificationSource}. These are research questions, not verified competitive advantages or customer exposures.</p>
 <section className="segment-breakdown"><h4>How revenue is disclosed</h4><p>Product and geographic breakdowns are separate dimensions. Rows may overlap; they are not automatically summed into a company total.</p><div className="market-context-actions"><button className="button" disabled={segments.loading||!!demo} onClick={()=>segmentsEnabled?segments.refresh():setSegmentsEnabled(true)}>{segments.loading?'Loading disclosures…':'Load revenue segments'}</button><label>Dimension<select value={axis} onChange={e=>setAxis(e.target.value)}><option value="ProductOrService">Product / service</option><option value="Geographic">Geographic</option></select></label></div>{segments.error&&<p role="status">{segments.error} Other company financials remain available.</p>}{segments.data&&<><p className="small muted">Retrieved {dateLabel(segments.data.observedAt)} · latest supplied period {dateLabel(period)} · {segments.data.conflicts} conflicting duplicate groups withheld.</p>{current.length?<div className="table-scroll"><table><caption>As-disclosed segment amounts · {unitSet.join(', ')} · {concepts.length} revenue concepts</caption><thead><tr><th>Segment</th><th>Reported amount</th><th>Concept</th></tr></thead><tbody>{current.map(x=><tr key={JSON.stringify(x)}><td>{x.member}</td><td>{amount(x.value,x.unit,true)}</td><td>{x.concept}</td></tr>)}</tbody></table></div>:<p>No segment records are available for this dimension. Single-segment filers or coverage gaps may return none.</p>}<p className="small muted">Period start, filing accession and original passage are not supplied by this endpoint. This panel therefore does not calculate revenue shares, mix growth or reconcile segment totals.</p></>}</section>
 </section>;
}
