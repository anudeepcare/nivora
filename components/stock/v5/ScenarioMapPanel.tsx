"use client";
import type {ScenarioMap} from "@/lib/auryn/v5/domain";
import {formatMoney} from "@/lib/nivora-format";
const money=(x:number|null)=>x==null?"—":formatMoney(x);
export default function ScenarioMapPanel({scenario}:{scenario:ScenarioMap|null}){
 if(!scenario)return null;
 const rows=[['BULL CASE',scenario.bull],['BASE CASE',scenario.base],['BEAR CASE',scenario.bear]] as const;
 return <section className="aurynScenarioMap"><div className="aurynScenarioHead"><small>SETUP & SCENARIO MAP</small><h3>{scenario.setup}</h3><p>{scenario.structure} · Confluence {scenario.confluenceScore}/100</p></div><div className="aurynScenarioGrid">{rows.map(([label,s])=><article key={label}><small>{label}</small><b>{s.summary}</b><span>Trigger {money(s.trigger)} · Zone {money(s.zoneLow)}–{money(s.zoneHigh)}</span><span>Target {money(s.targetLow)}–{money(s.targetHigh)} · Invalidation {money(s.invalidation)}</span><em>{s.confidence} confidence</em></article>)}</div><div className="aurynWaveContext"><small>WAVE CONTEXT</small><b>{scenario.waveContext.label}</b><span>{scenario.waveContext.note}</span></div></section>;
}
