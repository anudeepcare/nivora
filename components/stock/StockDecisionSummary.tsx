import {TriangleAlert,Leaf,ShieldCheck} from 'lucide-react';
import {firstGlance} from '@/lib/research-first-glance';
import MetricHelp from '@/components/MetricHelp';
import DcaInsight from '@/components/research/DcaInsight';
export default function StockDecisionSummary({decision,state,snapshot,candles,loading,horizon='long'}:{decision:any;state?:string;snapshot?:any;candles?:any[];loading?:boolean;horizon?:'long'|'year'|'swing'|'now'}){
 const glance=firstGlance(decision,state),business=decision?.pillars?.business?.score;
 const perspective={long:{label:'Long term · 3–5 years',key:'threeToFiveYears'},year:{label:'6–12 months',key:'sixToTwelveMonths'},swing:{label:'Swing · weeks',key:'swing'},now:{label:'Today',key:'now'}}[horizon];
 const raw=decision?.horizons?.[perspective.key]??(horizon==='long'?decision.longTermAction:null);
 const longTerm=glance.ready?({ATTRACTIVE:'Constructive',SELECTIVE:'Selective',UNATTRACTIVE:'Cautious',UNASSESSED:'Not assessed',WAIT:'Wait',BUY:'Buy',START_SMALL:'Start small',AVOID:'Avoid',WATCH:'Watch',HOLD:'Hold'} as Record<string,string>)[raw]||'Not assessed':'Review evidence';
 const Icon=glance.tone==='positive'?ShieldCheck:TriangleAlert;
 return <section className="nativeDecision" aria-label="Investment assessment">
  <div className="nativeDecisionStrip" data-tone={glance.tone}><Icon size={25}/><div><strong>{glance.label}</strong><p>{glance.reason}</p></div><MetricHelp term="AURYN assessment" body="AURYN keeps business quality, valuation and entry timing separate. Missing evidence is not a negative judgment. These are uncalibrated research assessments, not orders or probabilities of profit."/></div>
  <div className="nativeOutlook" data-tone={longTerm==='Constructive'?'positive':'neutral'} aria-live="polite"><Leaf size={26}/><div><span>{perspective.label}</span><strong>{longTerm}</strong><small>{longTerm==='Not assessed'?'Insufficient evidence for this horizon':`Already own · ${glance.owner}`}</small></div></div>
  <DcaInsight snapshot={snapshot} candles={candles} loading={loading}/>
 </section>;
}
