"use client";
import type {ExecutionPlan} from "@/lib/auryn/v5/domain";
import {formatMoney} from "@/lib/nivora-format";
const zone=(x:any)=>x?`${formatMoney(x.low)}–${formatMoney(x.high)}`:"—";
export default function ExecutionPlanPanel({plan}:{plan:ExecutionPlan}){
 if(plan.state==="BLOCKED")return <section className="aurynExecutionPlanV5 blocked"><div><small>EXECUTION PLAN</small><b>BLOCKED</b><span>{plan.reason}</span></div></section>;
 return <section className="aurynExecutionPlanV5">
  <div className="primary"><small>INITIAL ENTRY</small><b>{zone(plan.initialEntry)}</b><span>{plan.initialEntry?.basis}</span></div>
  {plan.dcaZones.map((z,i)=><div key={z.label}><small>{`DCA ${i+1} · ${z.multiplier}×`}</small><b>{zone(z)}</b><span>{z.basis}</span></div>)}
  <div><small>CONFIRMATION</small><b>{plan.confirmation?formatMoney(plan.confirmation):"—"}</b><span>Add only after structure confirms.</span></div>
  <div><small>INVALIDATION</small><b>{plan.invalidation?formatMoney(plan.invalidation):"—"}</b><span>Do not average mechanically below structural invalidation.</span></div>
  {plan.targets.map(t=><div key={t.label}><small>{t.label}</small><b>{formatMoney(t.price)}</b><span>Scenario target; not a guaranteed outcome.</span></div>)}
 </section>;
}
