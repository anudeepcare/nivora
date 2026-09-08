"use client";
import {Sparkles} from "lucide-react";
import type {ScenarioMap} from "@/lib/auryn/v5/domain";
import {formatMoney} from "@/lib/nivora-format";
const money=(x:number|null)=>x==null?"—":formatMoney(x);
const setupTitle=(x:string)=>x.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
export default function ScenarioMapPanel({scenario,mode="full"}:{scenario:ScenarioMap|null;mode?:"compact"|"full"}){
 if(!scenario)return null;
 const rows=[['BULL CASE',scenario.bull],['BASE CASE',scenario.base],['BEAR CASE',scenario.bear]] as const;
 const blocked=scenario.intent==='BLOCKED';
 const bull=scenario.bull;
 return <section className={`aurynScenarioMap ${mode==='compact'?'compact':'full'}`} data-snapshot-id={scenario.snapshotId||undefined}>
   <div className="aurynScenarioHead"><div className="aurynScenarioBrand"><Sparkles size={16}/><small>AURYN SETUP MAP</small></div><h3>{setupTitle(scenario.setup)}</h3><p>{scenario.structure} · Confluence {scenario.confluenceScore}/100 · {scenario.intent.replaceAll('_',' ')}</p></div>
   {mode==='compact'?<div className="aurynScenarioCompact">
      <div><small>BULL CASE</small><b>{bull.summary}</b></div>
      <div className="aurynScenarioCompactLevels"><span>Trigger <strong>{money(bull.trigger)}</strong></span><span>{scenario.intent==='ACCUMULATE'?'Entry zone':'Watch zone'} <strong>{money(bull.zoneLow)}–{money(bull.zoneHigh)}</strong></span><span>Targets <strong>{money(bull.targetLow)}–{money(bull.targetHigh)}</strong></span><span>Invalidation <strong>{money(bull.invalidation)}</strong></span></div>
      <em>{blocked?'PRICE LEVELS BLOCKED':`${bull.confidence} confidence`}</em>
    </div>:<>
      <div className="aurynScenarioGrid">{rows.map(([label,s])=><article key={label}><small>{label}</small><b>{s.summary}</b><span>Trigger {money(s.trigger)} · {scenario.intent==='ACCUMULATE'&&label==='BULL CASE'?'Entry':'Zone'} {money(s.zoneLow)}–{money(s.zoneHigh)}</span><span>Target {money(s.targetLow)}–{money(s.targetHigh)} · Invalidation {money(s.invalidation)}</span><em>{s.confidence} confidence</em></article>)}</div>
      <div className="aurynWaveContext"><small>WAVE CONTEXT</small><b>{scenario.waveContext.label}</b><span>{scenario.waveContext.note}</span></div>
    </>}
  </section>;
}
