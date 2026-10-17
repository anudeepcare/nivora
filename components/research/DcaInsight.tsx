"use client";
import {useMemo} from 'react';
import {Layers} from 'lucide-react';
import {buildDcaMarketSignal} from '@/lib/dca-market-signal';
import MetricHelp from '@/components/MetricHelp';
export default function DcaInsight({snapshot,candles=[],loading=false,onOpenTechnicals}:{snapshot:any;candles?:any[];loading?:boolean;onOpenTechnicals?:()=>void}){
 const broken=snapshot?.research?.decision?.hardVetoReasons?.includes('FUNDAMENTAL_THESIS_BREAK')===true;
 const signal=useMemo(()=>buildDcaMarketSignal(candles,{thesisBroken:broken}),[candles,broken]);
 const m=signal.metrics;
 const date=signal.observedAt?new Date(signal.observedAt+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric'}):null;
 const explanation=`${signal.reason} ${m?`Weekly RSI ${m.rsi.toFixed(1)}; 52-week drawdown ${m.drawdown.toFixed(1)}%.`:''} AURYN's experimental weekly heuristic: 1× is baseline; 2× requires drawdown ≥15%, RSI ≤45 and price below the 52-week average; 4× requires drawdown ≥30%, RSI ≤35 and price 15% below that average. 0× indicates RSI ≥70 and price 15% above that average, or a documented thesis break. Only completed UTC weeks are included. Not leverage or an automatic trade. Performance has not been validated.`;
 return <aside className="au-dca nativeDca" aria-label="DCA intensity" data-multiple={signal.multiplier??'unknown'}><h3><Layers size={18}/>DCA intensity <MetricHelp term="DCA intensity" body={explanation}/></h3><strong className="nativeDcaValue">{signal.multiplier==null?'—':`${signal.multiplier}×`}</strong><p>{loading&&!m?'Loading history':signal.label}</p><div className="au-dcarail" aria-label="DCA signal scale">{[0,1,2,4].map(n=><span key={n} className={signal.multiplier===n?'active':''}><i/><b>{n}×</b></span>)}</div><span className="nativeDcaDate">{date?`Weekly · ${date}`:'52 completed weeks needed'} · Experimental</span></aside>;
}
