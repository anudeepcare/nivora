"use client";

import {Activity,ArrowUpRight,BarChart3,CheckCircle2,Flag,Shield,Target,TrendingUp,TriangleAlert,UsersRound} from "lucide-react";
import PriceChart from "@/components/PriceChart";
import {describeSetupState} from "@/lib/auryn/v934/setup-explanations";
import {buildOpportunityLens} from "@/lib/auryn/v936/opportunity";
import {formatMoney} from "@/lib/nivora-format";
import type {InstitutionalDecision} from "@/lib/auryn/v931/domain";
import type {ScenarioMap} from "@/lib/auryn/v5/domain";

const pretty=(s:any)=>String(s||"—").replaceAll("_"," ");
const n=(v:any)=>{if(v==null||v==="")return null;const x=Number(v);return Number.isFinite(x)?x:null};
const money=(v:any)=>n(v)==null?"—":formatMoney(Number(v));
const tone=(s:any)=>/STRONG_BUY|BUY|ADD|ATTRACTIVE|BULL|TRENDING|READY|CONFIRMED/.test(String(s||"").toUpperCase())?"good":/AVOID|SELL|EXIT|REDUCE|UNATTRACTIVE|DAMAGED|FAILED/.test(String(s||"").toUpperCase())?"bad":"mid";
const scoreBand=(x:number|null)=>x==null?"Unavailable":x>=75?"Strong":x>=60?"Constructive":x>=45?"Mixed":"Weak";
const scenarioValue=(leg:any)=>{const lo=n(leg?.targetLow),hi=n(leg?.targetHigh);if(lo!=null&&hi!=null)return{value:(lo+hi)/2,range:Math.abs(hi-lo)>.01?`${money(lo)} – ${money(hi)}`:null};if(lo!=null)return{value:lo,range:null};if(hi!=null)return{value:hi,range:null};return{value:null,range:null};};
const delta=(from:number|null,to:number|null)=>from!=null&&to!=null&&from>0?(to/from-1)*100:null;

function BullMark(){return <svg viewBox="0 0 40 32" aria-hidden="true"><path d="M8 8c3-6 7-6 11-2h2c4-4 8-4 11 2l-5 1c2 2 3 5 2 8-1 6-5 10-9 10s-8-4-9-10c-1-3 0-6 2-8L8 8Z"/><path d="M13 13h4M23 13h4"/></svg>}
function BearMark(){return <svg viewBox="0 0 40 32" aria-hidden="true"><circle cx="13" cy="8" r="4"/><circle cx="27" cy="8" r="4"/><path d="M10 16c0-7 5-11 10-11s10 4 10 11c0 7-5 11-10 11S10 23 10 16Z"/><path d="M16 15h1M23 15h1M17 21c2 2 4 2 6 0"/></svg>}
function BaseMark(){return <span className="v936BaseMark" aria-hidden="true"/>}

function Metric({icon:Icon,label,value,sub,toneName=""}:{icon:any;label:string;value:string;sub?:string;toneName?:string}){
 return <article className={`v936Metric ${toneName}`}><span className="v936MetricIcon"><Icon size={18}/></span><div><small>{label}</small><b>{value}</b>{sub?<em>{sub}</em>:null}</div></article>;
}

export default function AurynResearchOverview({decision,marketTruth,marketIntelligence,scenario,entryQuality,candles,chartLevels}:{decision:InstitutionalDecision;marketTruth:any;marketIntelligence?:any;scenario?:ScenarioMap|null;entryQuality?:number|null;candles:any[];chartLevels:any|null}){
 const map=marketIntelligence?.actionMap??marketIntelligence?.levels??chartLevels??{};
 const daily=marketIntelligence?.confirmed?.["1D"]??null;
 const tf=(key:string)=>marketIntelligence?.confirmed?.[key]?.rating??marketIntelligence?.timeframes?.[key]?.confirmed??null;
 const tfSummary=["4H","1D","1W"].map(x=>[x,tf(x)] as const).filter(([,v])=>v).map(([k,v])=>`${k} ${v}`).join(" · ");
 const eLow=n(map?.preferredEntry?.low??chartLevels?.entryLow),eHigh=n(map?.preferredEntry?.high??chartLevels?.entryHigh),confirm=n(map?.confirm??chartLevels?.confirm),support=n(map?.support??chartLevels?.support),major=n(map?.majorSupport??chartLevels?.majorSupport),t1=n(map?.t1??chartLevels?.target1),t2=n(map?.t2??chartLevels?.target2),risk=n(map?.invalidation??chartLevels?.stop);
 const planned=eLow!=null&&eHigh!=null?(eLow+eHigh)/2:null;
 const riskPerShare=planned!=null&&risk!=null&&planned>risk?planned-risk:null;
 const rr1=riskPerShare&&t1!=null&&t1>planned!?(t1-planned!)/riskPerShare:null;
 const rr2=riskPerShare&&t2!=null&&t2>planned!?(t2-planned!)/riskPerShare:null;
 const relPct=n(daily?.relativeStrength?.relativePct),relBench=String(daily?.relativeStrength?.benchmark||"SPY");
 const participation=n(daily?.participation?.score),atrPct=n(daily?.volatility?.atrPct),volatility=String(daily?.volatility?.regime||"").toUpperCase();
 const setup=describeSetupState({setup:String(decision.setupState||"UNKNOWN"),newMoneyAction:decision.newMoneyAction,confirm,invalidation:risk});
 const patternLabel=scenario?.setup&&String(scenario.setup)!==String(decision.setupState)?String(scenario.setup):null;
 const pattern=patternLabel?describeSetupState({setup:patternLabel,newMoneyAction:decision.newMoneyAction,confirm,invalidation:risk}):null;
 const lens=buildOpportunityLens({action:decision.newMoneyAction,hardVeto:decision.hardVetoReasons.length>0,scores:{
  business:n(decision.pillars.business.score),earningsRevisions:n(decision.pillars.earningsRevisions.score),valuation:n(decision.pillars.valuation.score),marketStructure:n(decision.pillars.marketStructure.score),catalystsRegime:n(decision.pillars.catalystsRegime.score),riskAsymmetry:n(decision.pillars.riskAsymmetry.score),entryQuality:n(entryQuality),relativeStrength:relPct==null?null:Math.max(0,Math.min(100,50+relPct*2.2)),participation, rewardRisk:rr1,volatilityRisk:atrPct==null?null:Math.max(0,Math.min(100,atrPct*10))
 }});
 const currentPrice=n(marketTruth?.decisionPrice??marketTruth?.price??marketTruth?.regularPrice??marketTruth?.officialClose);
 const bullValue=scenarioValue(scenario?.bull),baseValue=scenarioValue(scenario?.base),bearValue=scenarioValue(scenario?.bear);
 const confirmDelta=delta(currentPrice,confirm),t1Delta=delta(currentPrice,t1),riskDelta=delta(currentPrice,risk);
 const marketStatus=marketTruth?.session?`${pretty(marketTruth.session)} · ${marketTruth?.priceState==="OFFICIAL_CLOSE"?"verified close":"verified market truth"}`:"verified market truth";
 const heroReason=decision.newMoneyAction==="START_SMALL"?`Positive evidence supports a partial position${tfSummary?` while confirmed structure reads ${tfSummary}`:""}.`:decision.policyReasons?.[0]||decision.drivers?.[0]||`AURYN is waiting for stronger alignment across evidence, setup and asymmetry.`;
 return <section className="v936Overview" data-snapshot-id={decision.snapshotId}>
  <div className="v936HeroGrid">
   <article className="v936CallHero">
    <div className="v936HeroGlow" aria-hidden="true"/>
    <small>AURYN CALL</small>
    <h2 className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</h2>
    <p>{heroReason}</p>
    <div className="v936HeroMeta"><span>{marketStatus}</span><span>Evidence quality {decision.evidenceCompleteness}/100 · uncalibrated</span></div>
    <div className="v936ActionRow"><span><small>NEW MONEY</small><b>{pretty(decision.newMoneyAction)}</b></span><span><small>OWNER</small><b>{pretty(decision.ownerAction)}</b></span><span><small>LONG TERM</small><b className={tone(decision.longTermAction)}>{pretty(decision.longTermAction)}</b></span></div>
   </article>
   <article className="v936ChartCard">
    <div className="v936ChartHead"><div><small>PRICE STRUCTURE</small><b>{tfSummary||"Confirmed structure loading"}</b></div><span>{lens.opportunityScore}/100 opportunity</span></div>
    {candles?.length?<PriceChart candles={candles} levels={chartLevels} showTrend={false}/>:<div className="v936ChartEmpty">Verified chart history is updating.</div>}
   </article>
  </div>

  <div className="v936PulseGrid" aria-label="AURYN decision pulse">
   <article><small>Opportunity</small><b>{lens.opportunityScore}<em>/100</em></b><span>{scoreBand(lens.opportunityScore)}</span></article>
   <article><small>Evidence Quality</small><b>{decision.evidenceCompleteness}<em>/100</em></b><span>{scoreBand(decision.evidenceCompleteness)}</span></article>
   <article><small>Distance to Confirm</small><b className={confirmDelta!=null&&confirmDelta<=3?"good":""}>{confirmDelta!=null?`${confirmDelta>=0?"+":""}${confirmDelta.toFixed(1)}%`:"—"}</b><span>{confirm!=null?money(confirm):"No level"}</span></article>
   <article><small>Upside to T1</small><b className="good">{t1Delta!=null?`${t1Delta>=0?"+":""}${t1Delta.toFixed(1)}%`:"—"}</b><span>{t1!=null?money(t1):"No target"}</span></article>
   <article><small>Downside to Risk</small><b className="bad">{riskDelta!=null?`${riskDelta.toFixed(1)}%`:"—"}</b><span>{risk!=null?money(risk):"No invalidation"}</span></article>
  </div>

  <div className="v936SectionHead"><div><small>KEY METRICS</small><h3>Decision map</h3></div><span>One canonical snapshot · no duplicate levels</span></div>
  <div className="v936MetricGrid">
   <Metric icon={TrendingUp} label="Market Setup" value={setup.title} sub={scenario?.structure||scoreBand(n(decision.pillars.marketStructure.score))}/>
   <Metric icon={Activity} label="Pattern Evidence" value={pattern?.title||pretty(scenario?.setup||"No dominant pattern")} sub={scenario?.bull?.confidence?`${scenario.bull.confidence} confidence`:"Supporting evidence"}/>
   <Metric icon={Target} label={String(decision.setupState).includes("DAMAGED")?"Recovery Zone":"Preferred Entry"} value={eLow!=null&&eHigh!=null?`${money(eLow)} – ${money(eHigh)}`:"—"} sub="Preferred range"/>
   <Metric icon={CheckCircle2} label="Confirm / Reclaim" value={money(confirm)} sub="Above to confirm" toneName="good"/>
   <Metric icon={Shield} label="Support" value={money(support)} sub="Key support"/>
   <Metric icon={Shield} label="Major Support" value={money(major)} sub="Stronger support"/>
   <Metric icon={Flag} label="T1" value={money(t1)} sub={planned!=null&&t1!=null?`${((t1/planned-1)*100).toFixed(1)}%`:"First objective"}/>
   <Metric icon={Flag} label="T2" value={money(t2)} sub={planned!=null&&t2!=null?`${((t2/planned-1)*100).toFixed(1)}%`:"Second objective"}/>
   <Metric icon={TriangleAlert} label="Risk / Invalidation" value={money(risk)} sub={planned!=null&&risk!=null?`${((risk/planned-1)*100).toFixed(1)}%`:"Structural risk"} toneName="bad"/>
   <Metric icon={BarChart3} label="Reward / Risk" value={rr1!=null?`${rr1.toFixed(1)} : 1`:"—"} sub={rr2!=null?`T2 ${rr2.toFixed(1)}×`:"Plan ratio"}/>
   <Metric icon={ArrowUpRight} label="Relative Strength" value={relPct!=null?`${relPct>=0?"+":""}${relPct.toFixed(1)}%`:"—"} sub={relPct!=null?`vs ${relBench}`:"Benchmark unavailable"} toneName={relPct!=null&&relPct>0?"good":""}/>
   <Metric icon={UsersRound} label="Participation" value={participation!=null?`${Math.round(participation)}/100`:"—"} sub={scoreBand(participation)}/>
   <Metric icon={Activity} label="Volatility" value={volatility||"—"} sub={atrPct!=null?`ATR ${atrPct.toFixed(1)}%`:"ATR unavailable"}/>
  </div>

  <div className="v936InsightGrid">
   <article className="v936ScenarioCard"><div className="v936CardTitle"><small>MARKET OUTLOOK</small><b>Scenario value</b><span>Decision-grade values only · unavailable evidence stays N/A</span></div><div className="v936ScenarioValues">
    <span className="bull"><span className="v936AnimalMark"><BullMark/></span><em>BULL VALUE</em><b>{money(bullValue.value)}</b><small>{bullValue.range||scenario?.bull?.summary||"N/A"}</small></span>
    <span className="base"><span className="v936AnimalMark"><BaseMark/></span><em>BASE VALUE</em><b>{money(baseValue.value)}</b><small>{baseValue.range||scenario?.base?.summary||"N/A"}</small></span>
    <span className="bear"><span className="v936AnimalMark"><BearMark/></span><em>BEAR VALUE</em><b>{money(bearValue.value)}</b><small>{bearValue.range||scenario?.bear?.summary||"N/A"}</small></span>
   </div></article>
   <article className="v936ExplainCard"><small>WHAT THIS MEANS</small><h4>{setup.title}</h4><p>{setup.meaning}</p><strong>{setup.actionImplication}</strong></article>
   <article className="v936ExplainCard"><small>PATTERN EVIDENCE</small><h4>{pattern?.title||pretty(scenario?.setup||"No dominant pattern")}</h4><p>{pattern?.meaning||"Pattern evidence is supporting context and never determines the investment action by itself."}</p><strong>{pattern?.actionImplication||decision.nextDecisionTrigger}</strong></article>
  </div>

  <div className="v936DecisionLogic">
   <article><small>WHAT UPGRADES IT</small><h4>Next decision trigger</h4><p>{decision.nextDecisionTrigger}</p></article>
   <article><small>WHAT BREAKS IT</small><h4>Risk / invalidation</h4><p>{decision.invalidationTrigger||"No decision-grade structural invalidation is currently established."}</p></article>
  </div>
 </section>;
}
