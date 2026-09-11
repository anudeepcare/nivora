"use client";

import {Activity,ArrowUpRight,BarChart3,CheckCircle2,Flag,Shield,Target,TrendingUp,TriangleAlert,UsersRound,Clock3,Gauge} from "lucide-react";
import PriceChart from "@/components/PriceChart";
import MetricInfo from "@/components/v65/MetricInfo";
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
const actionClass=(action:any)=>{
 const a=String(action||"").toUpperCase();
 if(/STRONG_BUY|BUY|ADD|ACCUMULATE/.test(a))return"buy";
 if(/START_SMALL/.test(a))return"start";
 if(/HOLD/.test(a))return"hold";
 if(/REDUCE|TRIM/.test(a))return"reduce";
 if(/SELL|EXIT|AVOID/.test(a))return"sell";
 return"wait";
};

function BullMark(){return <svg viewBox="0 0 40 32" aria-hidden="true"><path d="M8 8c3-6 7-6 11-2h2c4-4 8-4 11 2l-5 1c2 2 3 5 2 8-1 6-5 10-9 10s-8-4-9-10c-1-3 0-6 2-8L8 8Z"/><path d="M13 13h4M23 13h4"/></svg>}
function BearMark(){return <svg viewBox="0 0 40 32" aria-hidden="true"><circle cx="13" cy="8" r="4"/><circle cx="27" cy="8" r="4"/><path d="M10 16c0-7 5-11 10-11s10 4 10 11c0 7-5 11-10 11S10 23 10 16Z"/><path d="M16 15h1M23 15h1M17 21c2 2 4 2 6 0"/></svg>}
function BaseMark(){return <span className="v936BaseMark" aria-hidden="true"/>}

function Metric({icon:Icon,label,value,sub,toneName="",help,score}:{icon:any;label:string;value:string;sub?:string;toneName?:string;help?:string;score?:number|null}){
 return <article className={`v936Metric ${toneName}`}><span className="v936MetricIcon"><Icon size={18}/></span><div><small>{label}{help?<MetricInfo title={label} description={help} score={score==null?undefined:score}/>:null}</small><b>{value}</b>{sub?<em>{sub}</em>:null}</div></article>;
}
function Pulse({label,value,sub,toneName="",help,score}:{label:string;value:string;sub:string;toneName?:string;help:string;score?:number|null}){
 return <article><small>{label}<MetricInfo title={label} description={help} score={score==null?undefined:score}/></small><b className={toneName}>{value}</b><span>{sub}</span></article>;
}
function LadderItem({label,value,sub,toneName=""}:{label:string;value:string;sub?:string;toneName?:string}){return <span className={`v937LadderItem ${toneName}`}><small>{label}</small><b>{value}</b>{sub?<em>{sub}</em>:null}</span>}

export default function AurynResearchOverview({decision,marketTruth,displayPrice,displayPriceLive=false,marketIntelligence,scenario,entryQuality,candles,chartLevels}:{decision:InstitutionalDecision;marketTruth:any;displayPrice?:number|null;displayPriceLive?:boolean;marketIntelligence?:any;scenario?:ScenarioMap|null;entryQuality?:number|null;candles:any[];chartLevels:any|null}){
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
 const lens=buildOpportunityLens({action:decision.newMoneyAction,hardVeto:decision.hardVetoReasons.length>0,scores:{business:n(decision.pillars.business.score),earningsRevisions:n(decision.pillars.earningsRevisions.score),valuation:n(decision.pillars.valuation.score),marketStructure:n(decision.pillars.marketStructure.score),catalystsRegime:n(decision.pillars.catalystsRegime.score),riskAsymmetry:n(decision.pillars.riskAsymmetry.score),entryQuality:n(entryQuality),relativeStrength:relPct==null?null:Math.max(0,Math.min(100,50+relPct*2.2)),participation,rewardRisk:rr1,volatilityRisk:atrPct==null?null:Math.max(0,Math.min(100,atrPct*10))}});
 const currentPrice=n(displayPrice??marketTruth?.decisionPrice??marketTruth?.price??marketTruth?.regularPrice??marketTruth?.officialClose);
 const bullValue=scenarioValue(scenario?.bull),baseValue=scenarioValue(scenario?.base),bearValue=scenarioValue(scenario?.bear);
 const confirmDelta=delta(currentPrice,confirm),t1Delta=delta(currentPrice,t1),riskDelta=delta(currentPrice,risk);
 const marketStatus=displayPriceLive?`${pretty(marketTruth?.session||"REGULAR")} · live research price`:marketTruth?.session?`${pretty(marketTruth.session)} · ${marketTruth?.priceState==="OFFICIAL_CLOSE"?"verified close":"verified market truth"}`:"verified market truth";
 const heroReason=decision.newMoneyAction==="START_SMALL"?`Positive evidence supports a partial position${tfSummary?` while confirmed structure reads ${tfSummary}`:""}.`:decision.policyReasons?.[0]||decision.drivers?.[0]||`AURYN is waiting for stronger alignment across evidence, setup and asymmetry.`;
 const freshness=marketTruth?.decisionPriceAsOf||marketTruth?.asOf||marketTruth?.providerTimestamp||null;
 const entryScore=n(entryQuality);
 return <section className="v936Overview" data-snapshot-id={decision.snapshotId}>
  <span className="v940TruthContract">Opportunity is not a probability of profit. Expected Asymmetry is not an expected-return forecast. Current Price is never inferred from portfolio value.</span>
  <div className="v936HeroGrid v938FirstViewport">
   <article className={`v936CallHero action-${actionClass(decision.newMoneyAction)}`}>
    <div className="v936HeroGlow" aria-hidden="true"/>
    <small>AURYN CALL</small>
    <h2 className={tone(decision.newMoneyAction)}>{pretty(decision.newMoneyAction)}</h2>
    <p>{heroReason}</p>
    <div className="v936ActionRow"><span><small>NEW MONEY</small><b>{pretty(decision.newMoneyAction)}</b></span><span><small>OWNER</small><b>{pretty(decision.ownerAction)}</b></span><span><small>LONG TERM</small><b className={tone(decision.longTermAction)}>{pretty(decision.longTermAction)}</b></span></div>
    <div className="v940HeroProof" aria-label="Decision proof"><span><small>Opportunity</small><b>{lens.opportunityScore}</b></span><span><small>Evidence</small><b>{decision.evidenceCompleteness}</b></span><span><small>Entry</small><b>{entryScore==null?"—":Math.round(entryScore)}</b></span><span><small>Confirm</small><b>{money(confirm)}</b></span></div>
    <div className="v936HeroMeta"><span>{marketStatus}</span><span>Evidence quality {decision.evidenceCompleteness}/100 · uncalibrated</span></div>
   </article>
   <article className="v936ChartCard">
    <div className="v936ChartHead"><div><small>PRICE STRUCTURE</small><b>{tfSummary||"Confirmed structure loading"}</b></div><span>{lens.opportunityScore}/100 opportunity</span></div>
    {candles?.length?<PriceChart candles={candles} levels={chartLevels} showTrend={false}/>:<div className="v936ChartEmpty">Verified chart history is updating.</div>}
   </article>
  </div>

  <div className="v940PulseGroups" aria-label="AURYN decision pulse">
   <section className="v940PulseGroup"><small>DECISION</small><div><Pulse label="Opportunity" value={`${lens.opportunityScore}/100`} sub={scoreBand(lens.opportunityScore)} score={lens.opportunityScore} help="A decision-usefulness score combining company quality, setup, entry, risk and evidence. It is not a probability of profit."/><Pulse label="Entry Quality" value={entryScore==null?"N/A":`${Math.round(entryScore)}/100`} sub={scoreBand(entryScore)} score={entryScore} help="How attractive the current entry is relative to structure, extension and confirmation."/></div></section>
   <section className="v940PulseGroup"><small>TRIGGER</small><div><Pulse label="Distance to Confirm" value={confirmDelta!=null?`${confirmDelta>=0?"+":""}${confirmDelta.toFixed(1)}%`:"N/A"} sub={confirm!=null?money(confirm):"No level"} toneName={confirmDelta!=null&&confirmDelta<=3?"good":""} help="How far current price is from confirmation."/><Pulse label="Upside to T1" value={t1Delta!=null?`${t1Delta>=0?"+":""}${t1Delta.toFixed(1)}%`:"N/A"} sub={t1!=null?money(t1):"No target"} toneName="good" help="Distance to AURYN's first decision-grade target."/></div></section>
   <section className="v940PulseGroup"><small>ASYMMETRY</small><div><Pulse label="Reward / Risk" value={rr1!=null?`${rr1.toFixed(1)} : 1`:"N/A"} sub={rr2!=null?`T2 ${rr2.toFixed(1)}×`:"No complete plan"} help="Reward to first target divided by structural downside."/><Pulse label="Downside to Risk" value={riskDelta!=null?`${riskDelta.toFixed(1)}%`:"N/A"} sub={risk!=null?money(risk):"No invalidation"} toneName="bad" help="Distance to structural invalidation."/></div></section>
   <section className="v940PulseGroup"><small>TRUST</small><div><Pulse label="Evidence Quality" value={`${decision.evidenceCompleteness}/100`} sub={scoreBand(decision.evidenceCompleteness)} score={decision.evidenceCompleteness} help="Completeness and usability of the canonical evidence set."/><Pulse label="Data Freshness" value={displayPriceLive?"● LIVE":freshness?new Date(freshness).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"N/A"} sub={marketStatus} toneName={displayPriceLive?"good":""} help="Freshness of the market evidence currently displayed."/></div></section>
  </div>

  <div className="v936SectionHead"><div><small>KEY METRICS</small><h3>Decision map</h3></div><span>One canonical snapshot · no duplicate levels</span></div>
  <div className="v940DecisionRail" aria-label="Visual decision map">
   <div className="v940RailLine"/>
   {risk!=null?<span className="v940RailPoint risk" style={{left:"3%"}}><i/><small>THESIS</small><b>{money(risk)}</b></span>:null}
   {major!=null?<span className="v940RailPoint support" style={{left:"20%"}}><i/><small>MAJOR SUPPORT</small><b>{money(major)}</b></span>:null}
   {eLow!=null?<span className="v940RailPoint entry" style={{left:"38%"}}><i/><small>ENTRY RANGE</small><b>{eLow!=null&&eHigh!=null?`${money(eLow)}–${money(eHigh)}`:money(eLow)}</b></span>:null}
   {currentPrice!=null?<span className="v940CurrentMarker" style={{left:"49%"}}><small>CURRENT</small><b>{money(currentPrice)}</b><i/></span>:null}
   {confirm!=null?<span className="v940RailPoint confirm" style={{left:"58%"}}><i/><small>CONFIRM</small><b>{money(confirm)}</b></span>:null}
   {t1!=null?<span className="v940RailPoint target" style={{left:"78%"}}><i/><small>T1</small><b>{money(t1)}</b></span>:null}
   {t2!=null?<span className="v940RailPoint target" style={{left:"96%"}}><i/><small>T2</small><b>{money(t2)}</b></span>:null}
   <div className="v940RailZones"><span>RISK ZONE ←</span><span>ACCUMULATION</span><span>GROWTH ZONE →</span></div>
  </div>
  <div className="v937DecisionMap">
   <section><header><span>Decision ladder</span><MetricInfo title="Decision ladder" description="The preferred sequence for a new-money setup: enter only in the preferred zone, look for confirmation, then manage toward targets."/></header><div className="v937Ladder"><LadderItem label="ENTRY" value={eLow!=null&&eHigh!=null?`${money(eLow)} – ${money(eHigh)}`:"N/A"} sub="Preferred zone"/><LadderItem label="CONFIRM" value={money(confirm)} sub="Reclaim / breakout" toneName="good"/><LadderItem label="T1" value={money(t1)} sub={t1Delta!=null?`${t1Delta>=0?"+":""}${t1Delta.toFixed(1)}% from now`:"First objective"}/><LadderItem label="T2" value={money(t2)} sub="Extended objective"/></div></section>
   <section><header><span>Risk ladder</span><MetricInfo title="Risk ladder" description="Structural levels that should hold if the setup is healthy. Invalidation is the level where the current setup thesis materially weakens."/></header><div className="v937Ladder risk"><LadderItem label="SUPPORT" value={money(support)} sub="Key support"/><LadderItem label="MAJOR SUPPORT" value={money(major)} sub="Stronger support"/><LadderItem label="INVALIDATION" value={money(risk)} sub={riskDelta!=null?`${riskDelta.toFixed(1)}% from now`:"Structural risk"} toneName="bad"/></div></section>
  </div>
  <div className="v936MetricGrid v937EvidenceGrid">
   <Metric icon={TrendingUp} label="Market Setup" value={setup.title} sub={scenario?.structure||scoreBand(n(decision.pillars.marketStructure.score))} help="AURYN's confirmed structural state. This helps describe the setup but does not create a buy or sell call by itself."/>
   <Metric icon={Activity} label="Pattern Evidence" value={pattern?.title||pretty(scenario?.setup||"No dominant pattern")} sub={scenario?.bull?.confidence?`${scenario.bull.confidence} confidence`:"Supporting evidence"} help="Pattern classification from confirmed price structure. Patterns are supporting evidence, never standalone trade signals."/>
   <Metric icon={ArrowUpRight} label="Relative Strength" value={relPct!=null?`${relPct>=0?"+":""}${relPct.toFixed(1)}%`:"N/A"} sub={relPct!=null?`vs ${relBench}`:"Benchmark unavailable"} toneName={relPct!=null&&relPct>0?"good":""} help="How the stock has performed relative to its benchmark. Positive relative strength means it is outperforming over the measured window."/>
   <Metric icon={UsersRound} label="Participation" value={participation!=null?`${Math.round(participation)}/100`:"N/A"} sub={scoreBand(participation)} score={participation} help="Whether volume/participation supports the price move. Stronger participation can make a breakout or reversal more credible."/>
   <Metric icon={Activity} label="Volatility" value={volatility||"N/A"} sub={atrPct!=null?`ATR ${atrPct.toFixed(1)}%`:"ATR unavailable"} help="Current realized movement/range context. High volatility increases execution and sizing risk even when the thesis is intact."/>
   <Metric icon={Gauge} label="Expected Asymmetry" value={rr1!=null?`${rr1.toFixed(1)}×`:"N/A"} sub="T1 reward per unit risk" help="A compact expression of upside versus structural downside based on current plan levels. It is not an expected-return forecast."/>
   <Metric icon={Clock3} label="Decision Freshness" value={freshness?new Date(freshness).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"N/A"} sub={freshness?new Date(freshness).toLocaleDateString():"Timestamp unavailable"} help="When the price-sensitive evidence supporting this decision was last verified. Fresher is generally better for tactical decisions."/>
  </div>

  <div className="v936InsightGrid">
   <article className="v936ScenarioCard"><div className="v936CardTitle"><small>MARKET OUTLOOK</small><b>Scenario value</b><span>Decision-grade values only · unavailable evidence stays N/A</span></div><div className="v936ScenarioValues">
    <span className="v938ScenarioTile bull"><span className="v936AnimalMark"><BullMark/></span><span className="v938ScenarioCopy"><em>BULL VALUE</em><b>{money(bullValue.value)}</b><strong>{delta(currentPrice,bullValue.value)!=null?`${delta(currentPrice,bullValue.value)!>=0?"+":""}${delta(currentPrice,bullValue.value)!.toFixed(1)}% vs current`:"N/A"}</strong><small>{bullValue.range||scenario?.bull?.summary||"N/A"}</small></span></span>
    <span className="v938ScenarioTile base"><span className="v936AnimalMark"><BaseMark/></span><span className="v938ScenarioCopy"><em>BASE VALUE</em><b>{money(baseValue.value)}</b><strong>{delta(currentPrice,baseValue.value)!=null?`${delta(currentPrice,baseValue.value)!>=0?"+":""}${delta(currentPrice,baseValue.value)!.toFixed(1)}% vs current`:"N/A"}</strong><small>{baseValue.range||scenario?.base?.summary||"N/A"}</small></span></span>
    <span className="v938ScenarioTile bear"><span className="v936AnimalMark"><BearMark/></span><span className="v938ScenarioCopy"><em>BEAR VALUE</em><b>{money(bearValue.value)}</b><strong>{delta(currentPrice,bearValue.value)!=null?`${delta(currentPrice,bearValue.value)!>=0?"+":""}${delta(currentPrice,bearValue.value)!.toFixed(1)}% vs current`:"N/A"}</strong><small>{bearValue.range||scenario?.bear?.summary||"N/A"}</small></span></span>
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
