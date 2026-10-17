import {TriangleAlert,Leaf,ShieldCheck} from 'lucide-react';
import {firstGlance} from '@/lib/research-first-glance';
import MetricHelp from '@/components/MetricHelp';
import DcaInsight from '@/components/research/DcaInsight';
export default function StockDecisionSummary({decision,state,snapshot,candles,loading}:{decision:any;state?:string;snapshot?:any;candles?:any[];loading?:boolean}){
 const glance=firstGlance(decision,state),business=decision?.pillars?.business?.score;
 const longTerm=glance.ready?({ATTRACTIVE:'Constructive',SELECTIVE:'Selective',UNATTRACTIVE:'Cautious',UNASSESSED:'Unassessed'} as Record<string,string>)[decision.longTermAction]||'Review evidence':'Review evidence';
 const supportWait=glance.ready&&decision.newMoneyAction==='WAIT'&&['DAMAGED','REPAIRING','RECLAIM_ATTEMPT','FAILED_RECLAIM'].includes(decision.setupState);
 const reason=!glance.ready?'Current evidence needs review.':business==null?'Business evidence is incomplete.':decision.newMoneyAction==='WAIT'?'Entry needs confirmation.':glance.tone==='positive'?'Review valuation and position risk.':glance.tone==='negative'?'Review the documented risks.':'Review the supporting evidence.';
 const Icon=glance.tone==='positive'?ShieldCheck:TriangleAlert;
 return <section className="nativeDecision" aria-label="Investment assessment">
  <div className="nativeDecisionStrip" data-tone={glance.tone}><Icon size={25}/><div><strong>{supportWait?'Wait for support':glance.label}</strong><p>{reason}</p></div><MetricHelp term="AURYN assessment" body="AURYN keeps business quality, valuation and entry timing separate. Missing evidence is not a negative judgment. These are uncalibrated research assessments, not orders or probabilities of profit."/></div>
  <div className="nativeOutlook" data-tone={longTerm==='Constructive'?'positive':'neutral'}><Leaf size={26}/><div><span>Long term</span><strong>{longTerm}</strong><small>Already own · {glance.owner}</small></div></div>
  <DcaInsight snapshot={snapshot} candles={candles} loading={loading}/>
 </section>;
}
