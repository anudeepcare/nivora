"use client";

import {useEffect,useMemo,useRef,useState} from 'react';
import {ChartNoAxesCombined,ChevronRight,Expand,Info} from 'lucide-react';
import {Panel,PageHeading,Note} from '@/components/glass/GlassUi';
import TechnicalReadings from './TechnicalReadings';
import type {ProfessionalMetric} from '@/lib/auryn/v5/domain';
import PriceChart from '@/components/PriceChart';
import {buildResearchStructureStudies,buildResearchSetupMarkers,type ResearchStructureOptions} from '@/lib/research-structure';
import {buildStructureOverlays,buildStructurePresentation,type StructureZone} from '@/lib/research-structure-presentation';
import styles from './TechnicalStudies.module.css';

type Preferences={mode:'auto'|'manual';startDate:string;endDate:string;direction:'UP'|'DOWN';scale:'linear'|'log';averageType:'SMA'|'WMA';fib:boolean;averages:boolean;extensions:boolean;custom686:boolean};
const defaults:Preferences={mode:'auto',startDate:'',endDate:'',direction:'UP',scale:'linear',averageType:'SMA',fib:true,averages:true,extensions:false,custom686:false};
const money=(n:number|null|undefined)=>n==null?'—':'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const range=(zone:StructureZone|null)=>!zone?'Not mapped':zone.low===zone.high?money(zone.low):`${money(zone.low)} – ${money(zone.high)}`;
const dateLabel=(value:string|null|undefined)=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):'Date unavailable';
const statusLabel=(status:StructureZone['status'])=>({HOLD_OBSERVED:'Two-week hold observed',TESTED:'Tested · follow-through needed',UNCONFIRMED:'Unconfirmed',BELOW:'Weekly close below'}[status]);

export default function WeeklyStructure({symbol,bars,loading=false,error='',asOf,metrics=[]}:{symbol:string;bars:any[];loading?:boolean;error?:string;asOf?:string;metrics?:ProfessionalMetric[]}){
 const [settings,setSettings]=useState<Preferences>(defaults),[loadedKey,setLoadedKey]=useState(''),[clock]=useState(()=>new Date().toISOString()),[expanded,setExpanded]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null);
 const storageKey=`auryn-weekly-study-v1:${symbol}`;
 useEffect(()=>{
  let next={...defaults};
  try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object'){
   next={mode:saved.mode==='manual'?'manual':'auto',startDate:typeof saved.startDate==='string'?saved.startDate:'',endDate:typeof saved.endDate==='string'?saved.endDate:'',direction:saved.direction==='DOWN'?'DOWN':'UP',scale:saved.scale==='log'?'log':'linear',averageType:saved.averageType==='WMA'?'WMA':'SMA',fib:saved.fib!==false,averages:saved.averages!==false,extensions:saved.extensions===true,custom686:saved.custom686===true};
  }}catch{}
  setSettings(next);setLoadedKey(storageKey);
 },[storageKey]);
 useEffect(()=>{if(loadedKey===storageKey)try{sessionStorage.setItem(storageKey,JSON.stringify(settings))}catch{}},[settings,loadedKey,storageKey]);
 useEffect(()=>{if(expanded)dialog.current?.showModal();},[expanded]);
 const options:ResearchStructureOptions={...settings,asOf:asOf||clock};
 const studies=useMemo(()=>buildResearchStructureStudies(bars,options),[bars,settings.mode,settings.startDate,settings.endDate,settings.direction,settings.scale,settings.averageType,settings.custom686,asOf,clock]);
 const model=studies.personal??studies.automatic;
 const markers=useMemo(()=>buildResearchSetupMarkers(studies.automatic),[studies.automatic]);
 const view=useMemo(()=>buildStructurePresentation(model),[model]);
 const overlays=useMemo(()=>buildStructureOverlays(model,settings),[model,settings.fib,settings.averages,settings.extensions]);
 const update=<K extends keyof Preferences>(key:K,value:Preferences[K])=>setSettings(previous=>({...previous,[key]:value}));
 const changeMode=(mode:'auto'|'manual')=>setSettings(previous=>({...previous,mode,...(mode==='manual'&&!previous.startDate?{startDate:model.anchors?.start.time??model.weeklyBars[0]?.time??'',endDate:model.anchors?.end.time??model.weeklyBars[model.weeklyBars.length-1]?.time??'',direction:model.anchors?.direction??'UP'}:{})}));
 const chart=(expanded=false)=><PriceChart candles={model.weeklyBars} levels={null} overlays={overlays} compact={!expanded} forceCandles rangeKey={`${symbol}:weekly:${settings.mode}:${settings.startDate}:${settings.endDate}`} ariaLabel={`${symbol} completed weekly candlesticks, Fibonacci retracements and selected weekly moving averages`}/>;
 const support=view.nearestSupport,resistance=view.nearestResistance;
 return <section className="glassTechnicals" aria-label="Weekly Fibonacci research">
 <PageHeading title="Price, levels & momentum" subtitle="The readings are visible. The explanation is one tap away."/>
 <Panel action={<button className="au-btn" onClick={()=>setExpanded(true)} disabled={!model.weeklyBars.length}>Expand</button>} title={`${symbol} · Weekly structure`}>
 {loading&&!bars.length?<p role="status">Loading weekly history…</p>:error&&!bars.length?<p role="status">Weekly history unavailable. {error}</p>:model.weeklyBars.length?<div className="glassWeeklyCanvas">{chart()}</div>:<p className="au-small au-muted">Not enough completed history to draw the weekly chart.</p>}
 <div className="au-levels"><div><span className="au-small au-muted">Weekly close</span><strong>{money(model.lastClose)}</strong></div><div><span className="au-small au-muted">Candidate support</span><strong>{range(support)}</strong></div><div><span className="au-small au-muted">First reclaim</span><strong>{range(resistance)}</strong></div></div><p className="au-policy">{settings.mode==='auto'?'Automatic study':'Personal overlay'} · Latest plotted bar: {dateLabel(model.coverage.lastDate)} · {model.coverage.completedWeeks} completed UTC weeks · current week excluded.</p>
   <details className="weeklySettings"><summary>Chart settings & swing anchors</summary><div className="weeklyStudyControls">
   <label>Swing anchors<select aria-label="Swing anchor selection" value={settings.mode} onChange={e=>changeMode(e.target.value as 'auto'|'manual')}><option value="auto">Automatic · confirmed pivots</option><option value="manual">Personal overlay · choose my swing</option></select></label>
   <label>Average calculation<select aria-label="Average calculation" value={settings.averageType} onChange={e=>update('averageType',e.target.value as 'SMA'|'WMA')}><option value="SMA">Simple · SMA</option><option value="WMA">Weighted · WMA</option></select></label>
   <label>Fibonacci price scale<select aria-label="Fibonacci price scale" value={settings.scale} onChange={e=>update('scale',e.target.value as 'linear'|'log')}><option value="linear">Linear · equal price distances</option><option value="log">Logarithmic · proportional</option></select></label>
  </div>
  {settings.mode==='manual'&&<fieldset className="weeklyAnchorControls"><legend>Personal overlay · separate from the automatic study</legend><label>Direction<select aria-label="Swing direction" value={settings.direction} onChange={e=>update('direction',e.target.value as 'UP'|'DOWN')}><option value="UP">Low → High</option><option value="DOWN">High → Low</option></select></label><label>Start week<select aria-label="Swing start week" value={settings.startDate} onChange={e=>update('startDate',e.target.value)}><option value="">Choose a week</option>{model.weeklyBars.map(b=><option key={b.time} value={b.time}>Week of {dateLabel(b.time)} · {money(settings.direction==='UP'?b.low:b.high)}</option>)}</select></label><label>End week<select aria-label="Swing end week" value={settings.endDate} onChange={e=>update('endDate',e.target.value)}><option value="">Choose a week</option>{model.weeklyBars.map(b=><option key={b.time} value={b.time}>Week of {dateLabel(b.time)} · {money(settings.direction==='UP'?b.high:b.low)}</option>)}</select></label></fieldset>}
  <div className="weeklyOverlayControls" aria-label="Weekly chart studies">{([['fib','Fibonacci levels'],['averages','Weekly averages'],['extensions','Conditional extensions'],['custom686','Custom 0.686 · 68.6%']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={settings[key]} onChange={e=>update(key,e.target.checked)}/><span>{label}</span></label>)}<button type="button" onClick={()=>setExpanded(true)} disabled={!model.weeklyBars.length} aria-label="Expand weekly chart"><Expand size={16}/><span>Expand</span></button></div>
  </details>
</Panel>
 <TechnicalReadings metrics={metrics}/>
 <div className="au-two au-support"><Panel title="Fibonacci map"><div className="au-tablewrap" role="region" tabIndex={0} aria-label="Fibonacci level prices"><table className="au-table"><thead><tr><th>Retracement</th><th>Level</th><th>Context</th></tr></thead><tbody>{model.levels.filter(level=>level.kind==='RETRACEMENT'||level.kind==='EXTENSION'&&settings.extensions).map(level=><tr key={`${level.kind}-${level.ratio}`}><td>{level.ratio.toFixed(3)}<span className="au-meta">{(level.ratio*100).toFixed(1)}%</span></td><td>{money(level.price)}</td><td>{level.custom?'Custom level':level.kind==='EXTENSION'?'Conditional extension':level.ratio===.5?'Midpoint':'Reaction area; unconfirmed'}</td></tr>)}</tbody></table></div>{!model.levels.length&&<p className="au-small au-muted">{model.reason||'A confirmed swing is not yet available.'}</p>}{model.anchors&&<p className="au-policy">{money(model.anchors.start.price)} → {money(model.anchors.end.price)} · {dateLabel(model.anchors.start.time)} → {dateLabel(model.anchors.end.time)} · {settings.scale} scale · {settings.mode==='auto'?`Confirmed ${dateLabel(model.anchors.confirmedAt)}`:'Personal overlay; automatic study unchanged'}</p>}</Panel>
 <Panel title="What would confirm the setup?"><div className="au-timeline"><div><span className="au-pill au-good">Support case</span><p className="au-summary">{view.confirmation}</p></div><div><span className="au-pill au-blue">Reclaim case</span><p className="au-summary">{resistance?`${range(resistance)} · ${resistance.levels.map(x=>x.label).join(' + ')}. A close above needs follow-through.`:'No higher retracement or average is mapped.'}</p></div><div><span className="au-pill au-bad">Setup weakens</span><p className="au-summary">{view.failureLevel==null?'Swing failure level is not defined.':`Weekly close ${view.failureDirection} ${money(view.failureLevel)} calls for a new risk review.`}</p></div></div></Panel></div>
 <Panel className="au-support" title="Weekly averages"><div className="au-list">{Object.values(model.movingAverages).map(average=><div className="au-listrow" key={average.period}><span>{average.period}-week {settings.averageType}</span><strong>{money(average.value)}</strong></div>)}</div><p className="au-policy">Averages require consecutive completed weeks. A mapped level is not proof of support.</p></Panel>

 <details className="au-panel au-support glassDisclosure"><summary>How these levels work</summary><p className="au-policy">Fibonacci retracements measure a selected swing; different anchors change the levels. The 0.500 midpoint is a common convention. A custom 0.686 is not a standard Fibonacci ratio. Weekly averages require consecutive completed bars. Levels alone do not confirm support or establish fair value.</p></details><p className="au-policy au-support">Action levels remain separate from business valuation. These are weekly studies; 15-minute and hourly evidence are not inferred from daily bars.</p>
 <details className="au-panel au-support glassDisclosure"><summary>AURYN weekly reclaim · {markers.length} observed setups</summary><p className="au-policy">Automatic linear 0.618 study. Anchors must be confirmed before the signal week. A completed week closes above 0.618 after the prior close was at or below it; only the first reclaim per anchor pair is recorded. A close below the starting low invalidates it. Revised provider history can change replay; these are observations, not validated forecasts.</p><div className="au-tablewrap"><table className="au-table"><thead><tr><th>Signal week</th><th>First known · UTC</th><th>Reclaim</th><th>Invalidation</th></tr></thead><tbody>{markers.slice().reverse().map(marker=><tr key={marker.id}><td>{dateLabel(marker.signalWeek)}</td><td>{dateLabel(marker.firstKnownAt)}</td><td>{money(marker.reclaimPrice)}</td><td>{money(marker.invalidationPrice)}</td></tr>)}</tbody></table></div></details>
 <dialog className="au-modal glassChartModal" ref={dialog} onClose={()=>setExpanded(false)} onCancel={()=>setExpanded(false)}><div className="au-panelhead"><h2>{symbol} · Weekly structure</h2><button className="au-btn" onClick={()=>dialog.current?.close()}>Close</button></div>{expanded&&chart(true)}</dialog>
 </section>;
}
