"use client";
import type {ExecutionPlan} from "@/lib/auryn/v5/domain";
import {formatMoney} from "@/lib/nivora-format";
const zone=(x:any)=>x?`${formatMoney(x.low)}–${formatMoney(x.high)}`:"—";
export default function ExecutionPlanPanel({plan}:{plan:ExecutionPlan}){
 if(plan.state==="BLOCKED")return <section className="aurynExecutionPlanV5 blocked"><div><small>EXECUTION PLAN</small><b>BLOCKED</b><span>{plan.reason}</span></div></section>;
 if(plan.intent==="EXIT"||plan.intent==="REDUCE")return <section className={`aurynExecutionPlanV5 policy ${plan.intent.toLowerCase()}`}><div><small>{plan.intent==="EXIT"?"EXIT POLICY":"REDUCE POLICY"}</small><b>{plan.intent==="EXIT"?"NO DCA / EXIT DISCIPLINE":"NO NEW DCA"}</b><span>{plan.reason}</span></div>{plan.invalidation!=null&&<div><small>STRUCTURAL BREAK</small><b>{formatMoney(plan.invalidation)}</b><span>Reference level for thesis/risk reassessment; not an averaging trigger.</span></div>}</section>;
 const watch=plan.intent==="WATCH";
 return <section className={`aurynExecutionPlanV5 ${watch?"watch":"accumulate"}`}>
  {plan.initialEntry&&<div className="primary"><small>{watch?"STRUCTURAL WATCH ZONE":"INITIAL ENTRY"}</small><b>{zone(plan.initialEntry)}</b><span>{plan.initialEntry.basis}</span></div>}
  {plan.intent==="ACCUMULATE"&&plan.dcaZones.map((z,i)=><div key={z.label}><small>{`DCA ${i+1} · ${z.multiplier}×`}</small><b>{zone(z)}</b><span>{z.basis}</span></div>)}
  {plan.confirmation!=null&&<div><small>{watch?"RECLAIM / CONFIRM":"CONFIRMATION"}</small><b>{formatMoney(plan.confirmation)}</b><span>{watch?"A stronger structure can upgrade a HOLD/watch state.":"Add only after structure confirms."}</span></div>}
  {plan.invalidation!=null&&<div><small>{watch?"STRUCTURAL BREAK":"INVALIDATION"}</small><b>{formatMoney(plan.invalidation)}</b><span>{watch?"Below this level the setup requires thesis/risk reassessment.":"Do not average mechanically below structural invalidation."}</span></div>}
  {plan.targets.map(t=><div key={t.label}><small>{watch?`${t.label} SCENARIO`:t.label}</small><b>{formatMoney(t.price)}</b><span>Scenario target; not a guaranteed outcome.</span></div>)}
 </section>;
}
