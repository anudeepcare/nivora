"use client";
import {useMemo,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ShieldCheck,CalendarDays,SlidersHorizontal} from 'lucide-react';
import type {Research} from '@/lib/types';
import {researchDecision,styles,type EvidenceMetric,type ResearchStyle} from '@/lib/decision-research';
import {amount,percent,dateLabel} from '@/lib/format';
import {consensusOutlook} from '@/lib/outlook';
import {useResearchPreferences} from './ResearchPreferences';
export function evidenceValue(m:EvidenceMetric,currency:string){if(m.value==null)return '—';return m.unit==='money'?amount(m.value,currency,true):m.unit==='percent'?percent(m.value):`${m.value.toFixed(1)}${m.unit==='ratio'?'×':' days'}`;}
export default function DecisionWorkspace({research:r,onTab,part='all'}:{research:Research;onTab:(tab:'Valuation'|'Technicals'|'Thesis'|'News')=>void;part?:'summary'|'detail'|'all'}){
 const {preferences:p,setPreferences}=useResearchPreferences(),[selected,setSelected]=useState('profit');
 const d=useMemo(()=>researchDecision(r,p.style),[r,p.style]),lens=d.lenses.find(x=>x.id===selected)??d.lenses[0],consensus=consensusOutlook(r);
 const angle=(i:number)=>i*Math.PI/4-Math.PI/2,point=(i:number,v:number)=>[170+101*v/10*Math.cos(angle(i)),142+101*v/10*Math.sin(angle(i))];
 return <section className={`decision-workspace decision-${part}`} aria-label="Investment evidence overview">
  {part!=='detail'&&<><header className="decision-intro"><div><span className="eyebrow">The decision, in perspective</span><h2>{d.stance}</h2><p>{p.horizon==='long'?'Business first. Price second. Timing alongside.':'Timing first in this view; the business case remains separate.'}</p></div><span className="evidence-label"><ShieldCheck size={16}/>{d.metricsAvailable} reported or calculated metrics</span></header>
  {d.flags.length>0&&<aside className={`decision-risk-banner ${d.flags.some(x=>x.severe)?'high-risk':''}`} aria-label="Evidence to review first"><strong>{d.flags.some(x=>x.severe)?'Financing evidence needs attention':'Review the risks alongside growth'}</strong><p>{d.flags.slice(0,2).map(x=>x.title).join(' · ')}</p></aside>}
  <div className="decision-answer-grid">
   <button onClick={()=>part==='summary'?onTab('Thesis'):setSelected('profit')}><span>Is the business working?</span><strong>{d.forCase.length?d.forCase[0].title:'More evidence needed'}</strong><small>{d.period?`${dateLabel(d.period)} · ${d.currency}`:'Financial statements unavailable'}</small></button>
   <button onClick={()=>onTab('Valuation')}><span>What does the price imply?</span><strong>{consensus?`Analyst target gap: ${percent(consensus.change,true)}`:'Valuation needs assumptions'}</strong><small>Consensus is not intrinsic value</small></button>
   <button onClick={()=>onTab('Technicals')}><span>How is the timing?</span><strong>{d.timing.rsi==null?'Insufficient completed bars':`RSI ${d.timing.rsi.toFixed(0)} · ${d.timing.ma200!=null&&d.timing.close!=null?(d.timing.close>=d.timing.ma200?'above':'below')+' 200-day':'building trend history'}`}</strong><small>Price signals do not establish a moat</small></button>
   <button onClick={()=>onTab('News')}><span>What could change next?</span><strong>{d.nextReport?dateLabel(d.nextReport):'Review company disclosures'}</strong><small><CalendarDays size={12}/> {d.nextReport?'Next scheduled earnings':'No next report date supplied'}</small></button>
  </div>
  </>}
  {part!=='summary'&&<><div className="decision-lens-layout"><div className="lens-visual">
   <svg viewBox="0 0 340 285" role="img" aria-label={`Evidence screening composite ${d.overall==null?'unavailable':d.overall.toFixed(1)+' out of ten'}; ${d.scoredLenses} scored lenses. Missing lenses have no plotted score.`}>
    {[2.5,5,7.5,10].map(v=><polygon key={v} points={d.lenses.map((_,i)=>point(i,v).join(',')).join(' ')} fill="none" stroke="var(--line)"/>)}
    {d.lenses.map((l,i)=>{const [x,y]=point(i,10),[tx,ty]=point(i,12);return <g key={l.id}><line x1="170" y1="142" x2={x} y2={y} stroke="var(--line)"/><text x={tx} y={ty+4} textAnchor={Math.abs(tx-170)<8?'middle':tx>170?'start':'end'}>{['Value','Profit','Growth','Health','Cash','Returns','Moat','Owners'][i]}</text>{l.score!=null&&<circle cx={point(i,l.score)[0]} cy={point(i,l.score)[1]} r={selected===l.id?6:4} fill={selected===l.id?'var(--ink)':'var(--blue)'}/>}</g>;})}
    <rect x="127" y="118" width="86" height="53" rx="18" fill="var(--surface)"/><text x="170" y="155" textAnchor="middle" className="lens-total">{d.overall==null?'—':d.overall.toFixed(1)}</text>
   </svg><span className="muted small">Screening composite · {d.scoredLenses}/8 lenses scored</span><p className="small muted">Absolute anchors, not peer ranks or a probability of success. Missing lenses stay unscored.</p>
   <div className="style-options" aria-label="Research style">{(Object.keys(styles) as ResearchStyle[]).map(s=><button key={s} aria-pressed={p.style===s} onClick={()=>setPreferences({style:s})}>{s}</button>)}</div>
  </div><div className="lens-evidence"><div className="lens-list" aria-label="Evidence lenses">{d.lenses.map(l=><button key={l.id} aria-pressed={selected===l.id} onClick={()=>setSelected(l.id)}><span>{l.name}</span><i><b style={{width:`${(l.score??0)*10}%`}}/></i><strong>{l.score==null?'Unscored':l.score.toFixed(1)}</strong></button>)}</div>
    <section className="selected-lens" aria-live="polite"><h3>{lens.name}</h3><p>{lens.note}</p><dl>{lens.metrics.filter(m=>p.detail==='advanced'||m.value!=null).map(m=><div key={m.id}><dt>{m.label}<small>{m.reason}</small></dt><dd>{evidenceValue(m,d.currency)}</dd></div>)}</dl>{!lens.metrics.some(m=>m.value!=null)&&<p className="muted">{lens.id==='moat'?'Verify competitive advantage from filings, retention, pricing power and customer evidence. No moat score is fabricated.':'Relevant measurements are not available in this snapshot.'}</p>}</section>
  </div></div>
  <div className="decision-case-grid"><section><h3>Supports the case</h3>{d.forCase.length?d.forCase.map(x=><p key={x.key}><b>{x.title}</b><span>{x.text}</span></p>):<p>No financial strength established by the available snapshot.</p>}</section><section><h3>Challenge the case</h3>{d.flags.length?d.flags.slice(0,3).map(x=><p key={x.id}><b className={x.severe?'negative':''}>{x.title}</b><span>{x.text}</span></p>):<p>No threshold flags fired among the available checks. Unavailable metrics and filing risks are not cleared.</p>}</section></div>
  {d.description&&<details className="business-description" open={p.detail==='advanced'}><summary>How this business makes money</summary><p>{d.description}</p><p className="muted small">Company profile description; not a verified moat or management execution record.</p></details>}
  <div className="decision-bottomline"><span>{d.version} · {d.period?`Financial period ${d.period}`:'No comparable financial period'}</span><Link href="/methodology">How the evidence is assessed <ArrowUpRight size={14}/></Link></div>
 </>}
 </section>;
}
