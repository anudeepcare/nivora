import {deriveTodayAction, type TodayDecision} from "./nivora-today";
import {checkValuationSanity,consolidateEntryZones} from "./nivora-valuation-sanity";
import {buildAdversarialRisks,type RankedRisk} from "./nivora-adversarial-risk";
import {buildActionTriggers,type ActionTriggerResult} from "./nivora-action-triggers";
import {buildDecisionReality,technicalRealityFromCandles,roundPriceZone,applyRealityGuardToToday} from "./nivora-decision-reality";
import {buildMetricProof,type MetricProof} from "./nivora-metric-proof";
import {ENGINE_VERSION,WEIGHTS_VERSION,VALUATION_VERSION,TODAY_POLICY_VERSION} from "./nivora-version";
export type ThesisState="Strengthening"|"Recovering"|"Intact"|"Mixed"|"Weakening"|"Broken";
export type OutlookLabel="STRONG BULLISH"|"BULLISH"|"CONSTRUCTIVE"|"NEUTRAL"|"CAUTIOUS"|"BEARISH"|"STRONG BEARISH";
export type HorizonOutlook={key:"3M"|"6M"|"1Y"|"2Y"|"3Y";score:number;label:OutlookLabel;reason:string};
export type PositionContext={shares:number;avgCost:number;marketValue?:number;weightPct?:number|null};
export type PriceZone={label:string;low:number|null;high:number|null;kind:"starter"|"accumulate"|"strong"|"fair"|"chase"|"risk";confidence:"High"|"Medium"|"Low";basis:string};
export type InvestorDecision={
  companyScore:number;thesisScore:number;opportunityScore:number;confidence:number;
  companyLabel:string;thesisLabel:"BULLISH"|"NEUTRAL"|"BEARISH";thesisState:ThesisState;
  valuationLabel:"Deeply attractive"|"Attractive"|"Fair"|"Expensive"|"Unclear";
  action:"STRONG BUY"|"ACCUMULATE"|"ADD"|"HOLD"|"HOLD / WATCH"|"WAIT"|"TRIM"|"REDUCE"|"AVOID"|"EXIT / REASSESS";
  actionReason:string;horizon:string;oneLine:string;drivers:string[];risks:string[];breakers:string[];changed:string[];
  factors:Record<string,number|null>;factorAvailability:Record<string,boolean>;horizons:HorizonOutlook[];bestHorizon:string;
  streetTarget?:{mean:number;low?:number;high?:number;upsidePct:number}|null;
  expectedReturn?:{oneYearPct:number|null;threeYearCagrPct:number|null;source:"street"|"unavailable"};
  consistency:{ok:boolean;notes:string[]};position?:{shares:number;avgCost:number;pnlPct:number;belowCost:boolean;weightPct?:number|null}|null;
  archetype:string;dataCompleteness:number;modelConfidenceLabel:"Uncalibrated"|"Collecting"|"Calibrated";
  timing:{score:number;label:"ATTRACTIVE"|"SELECTIVE"|"WAIT"|"OVEREXTENDED"|"WEAK";reason:string};
  streetView:{label:"Positive"|"Mixed"|"Cautious"|"Unavailable";score:number|null;note:string};
  streetDisagreement?:{active:boolean;headline:string;reasons:string[]};
  zones:PriceZone[];valuationBasis:string;vetoes:string[];
  valuationRange?:{bear:number;base:number;bull:number;method:string;confidence:"High"|"Medium"|"Low"}|null;
  valuationValidity?:{status:"VALID"|"PARTIAL"|"UNSUPPORTED"|"STALE"|"IMPLAUSIBLE";reason:string;fairValueAllowed:boolean;zonesAllowed:boolean};
  decisionGradeEvidence?:number;
  expectedCagr?:{oneYearPct:number|null;threeYearPct:number|null}|null;
  longTermThesis?:{label:"STRONG"|"CONSTRUCTIVE"|"MIXED"|"WEAK";score:number;summary:string;nearTerm:string;longTerm:string};
  expectationGap?:{label:"POSITIVE"|"BALANCED"|"NEGATIVE"|"UNKNOWN";score:number|null;reason:string};
  valuationSanity?:{status:"PASS"|"WARN"|"FAIL"|"UNAVAILABLE";warnings:string[];bearUpsidePct:number|null;baseUpsidePct:number|null;bullUpsidePct:number|null};
  adversarialRisks?:RankedRisk[];
  actionTriggers?:ActionTriggerResult;
  calibrationEvidence?:{scope:string;n:number;hitRatePct:number;avgAlphaPct:number;medianAlphaPct:number;brierScore:number;expectedCalibrationErrorPct:number;confidence95?:{lowPct:number;highPct:number}|null}|null;
  decisionReality?:ReturnType<typeof buildDecisionReality>;
  marketDataIntegrity?:{state:string;reason:string;provider?:string|null;ageSeconds?:number|null;disagreementPct?:number|null;tradable?:boolean}|null;
  metricProofs?:Record<string,MetricProof>;
  today?:TodayDecision;
};

const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
const num=(x:any,f=50)=>Number.isFinite(Number(x))?Number(x):f;
const finite=(x:any)=>Number.isFinite(Number(x));
const uniq=(x:string[])=>[...new Set(x.filter(Boolean))];
const ol=(s:number):OutlookLabel=>s>=82?"STRONG BULLISH":s>=70?"BULLISH":s>=60?"CONSTRUCTIVE":s>=48?"NEUTRAL":s>=39?"CAUTIOUS":s>=28?"BEARISH":"STRONG BEARISH";
const range=(center:number|null,width:number|null)=>center!=null&&width!=null&&center>0&&width>0?{low:Math.max(.01,center-width),high:center+width}:null;
const weighted=(parts:Array<{value:number|null|undefined;weight:number;available?:boolean}>,fallback=50)=>{
  const usable=parts.filter(p=>p.available!==false&&finite(p.value)&&p.weight>0);
  const w=usable.reduce((a,p)=>a+p.weight,0);
  return w?clamp(usable.reduce((a,p)=>a+Number(p.value)*p.weight,0)/w):fallback;
};

function analyst(context:any){
  const rs=Array.isArray(context?.recommendations)?context.recommendations:[];
  const score=(r:any)=>{if(!r)return null;const sb=num(r.strongBuy,0),b=num(r.buy,0),h=num(r.hold,0),s=num(r.sell,0),ss=num(r.strongSell,0),t=sb+b+h+s+ss;return t?clamp((sb*100+b*78+h*50+s*22+ss*5)/t):null};
  const now=score(rs[0]),prior=score(rs[1]);
  const total=rs[0]?num(rs[0].strongBuy,0)+num(rs[0].buy,0)+num(rs[0].hold,0)+num(rs[0].sell,0)+num(rs[0].strongSell,0):0;
  const level=now==null?50:now;
  const change=now!=null&&prior!=null?now-prior:0;
  return{score:Math.round(level),trend:Math.round(change),total,available:now!=null};
}

function earnings(context:any){
  const xs=Array.isArray(context?.surprises)?context.surprises:[];
  if(!xs.length)return{score:50,trend:0,available:false};
  const f=(x:any)=>finite(x?.surprisePercent)?clamp(50+Number(x.surprisePercent)*.9,15,88):50;
  const a=f(xs[0]),b=f(xs[1]),c=f(xs[2]);
  return{score:Math.round(a*.55+b*.30+c*.15),trend:Math.round(a-b),available:true};
}

export function classifyArchetype(context:any,raw:any,assetType:string){
  if(assetType==="crypto")return"crypto";
  const industry=String(context?.profile?.finnhubIndustry||"").toLowerCase();
  const text=[
    industry,
    context?.profile?.description,
    context?.profile?.name,
    context?.summary,
    ...(Array.isArray(context?.news)?context.news.slice(0,5).map((x:any)=>x?.headline||x?.title||""):[])
  ].filter(Boolean).join(" ").toLowerCase();
  const op=Number(raw.opMargin),fcf=Number(raw.fcf),rev=num(raw.revGrowth,0);
  const aiInfra=/\b(ai cloud|gpu cloud|gpu compute|data cent(?:er|re)|hyperscaler|accelerated compute)\b/.test(text);
  const milestone=/\b(satellite|constellation|direct-to-device|direct to device|space-based|launch milestone)\b/.test(text);
  if(aiInfra)return"ai_infrastructure";
  if(milestone||(rev>=40&&finite(op)&&op<0&&finite(fcf)&&fcf<0&&industry.includes("tele")))return"pre_scale";
  if(industry.includes("bank"))return"bank";
  if(industry.includes("insurance"))return"insurer";
  if(industry.includes("biotech")||industry.includes("pharma"))return"biotech";
  if(industry.includes("mining")||industry.includes("metals"))return"miner";
  if(industry.includes("energy")||industry.includes("oil")||industry.includes("gas"))return"cyclical";
  if(industry.includes("utility")||industry.includes("infrastructure"))return"infrastructure";
  if(rev>=25&&(!finite(op)||op<15))return"hypergrowth";
  if(finite(fcf)&&fcf>0&&finite(op)&&op>=15)return"compounder";
  return"general";
}

export function valuationScore(kind:string,context:any,raw:any){
  const m=context?.metrics||context?.basicMetrics||{};
  const pe=Number(m.peTTM??m.peNormalizedAnnual??m.peBasicExclExtraTTM??m.peBasicExclExtraAnnual);
  const ps=Number(m.psTTM??m.psAnnual);
  const pb=Number(m.pbAnnual??m.pbQuarterly);
  const rev=num(raw.revGrowth,0);
  const fcf=Number(raw.fcf),op=Number(raw.opMargin);
  if(kind==="crypto")return{score:50,label:"Unclear" as const,basis:"No crypto intrinsic-value model is enabled yet.",available:false};
  if(kind==="bank"||kind==="insurer"){
    if(finite(pb)&&pb>0){const s=pb<1?76:pb<1.8?66:pb<3?54:38;return{score:s,label:s>=64?"Attractive" as const:s<42?"Expensive" as const:"Fair" as const,basis:"Book-value multiple is used as a preliminary financial-sector valuation check; residual-income modeling is not yet enabled.",available:true}}
    return{score:50,label:"Unclear" as const,basis:"Financial-sector valuation requires book value/ROE evidence that is not available from the current feed.",available:false};
  }
  if(kind==="biotech")return{score:50,label:"Unclear" as const,basis:"Pre-revenue biotech requires pipeline rNPV; NIVORA refuses to force an earnings multiple.",available:false};
  if(kind==="pre_scale")return{score:50,label:"Unclear" as const,basis:"Pre-scale milestone companies require milestone probability, capital runway and dilution modeling; trailing multiples are not decision-grade.",available:false};
  if(kind==="miner"||kind==="cyclical"){
    return{score:50,label:"Unclear" as const,basis:"Cyclical/miner valuation requires normalized cycle earnings or NAV evidence; trailing multiples are intentionally not treated as fair value.",available:false};
  }
  if(kind==="hypergrowth"||kind==="ai_infrastructure"){
    if(finite(ps)&&ps>0&&rev>0){const g=Math.max(5,rev);const ratio=ps/g*100;const s=clamp(82-ratio*1.8+(finite(op)&&op>10?5:0));return{score:Math.round(s),label:s>=72?"Deeply attractive" as const:s>=62?"Attractive" as const:s<38?"Expensive" as const:"Fair" as const,basis:"Growth-adjusted sales multiple (preliminary hypergrowth model).",available:true}}
    return{score:50,label:"Unclear" as const,basis:"Hypergrowth valuation needs a usable sales multiple and growth evidence.",available:false};
  }
  if(finite(pe)&&pe>0){
    const growthAdj=rev>0?Math.min(15,rev*.30):0;let s=pe<18?74:pe<28?64:pe<42?54:pe<65?43:31;s+=growthAdj;if(finite(fcf)&&fcf<0)s-=8;
    s=clamp(s);return{score:Math.round(s),label:s>=74?"Deeply attractive" as const:s>=62?"Attractive" as const:s<40?"Expensive" as const:"Fair" as const,basis:"Growth-adjusted earnings multiple used as a preliminary cross-check; not a full DCF.",available:true};
  }
  return{score:50,label:"Unclear" as const,basis:"Independent valuation is not established from the currently available evidence.",available:false};
}

function validateValuationRange(kind:string,market:any,model:{available:boolean;basis:string},fairRange:{bear:number;base:number;bull:number;method:string;confidence:"High"|"Medium"|"Low"}|null){
  const px=Number(market?.price);
  if(!model.available)return{status:"UNSUPPORTED" as const,reason:model.basis,fairValueAllowed:false,zonesAllowed:false};
  if(!fairRange||!finite(px)||px<=0)return{status:"PARTIAL" as const,reason:"A valuation score exists, but NIVORA does not have a decision-grade intrinsic-value range for this archetype.",fairValueAllowed:false,zonesAllowed:false};
  // Preliminary hypergrowth sales-multiple scenarios are useful as relative valuation evidence, not as absolute price targets.
  if(kind==="hypergrowth"||kind==="ai_infrastructure")return{status:"PARTIAL" as const,reason:"The high-growth sales-multiple model is preliminary and is not allowed to publish absolute fair-value or accumulation zones.",fairValueAllowed:false,zonesAllowed:false};
  if(kind==="pre_scale")return{status:"UNSUPPORTED" as const,reason:"Pre-scale valuation requires milestone probability, runway and dilution evidence before fair value can be published.",fairValueAllowed:false,zonesAllowed:false};
  if(fairRange.confidence==="Low")return{status:"PARTIAL" as const,reason:"Valuation confidence is too low to publish an actionable fair-value range.",fairValueAllowed:false,zonesAllowed:false};
  const ratio=fairRange.base/px,dispersion=(fairRange.bull-fairRange.bear)/Math.max(.01,fairRange.base);
  if(!finite(ratio)||ratio<.55||ratio>1.80||dispersion>.65)return{status:"IMPLAUSIBLE" as const,reason:"The modeled fair value failed NIVORA's plausibility gate versus current price or scenario dispersion.",fairValueAllowed:false,zonesAllowed:false};
  return{status:"VALID" as const,reason:"Archetype, inputs, confidence and price plausibility checks passed.",fairValueAllowed:true,zonesAllowed:true};
}

function valuationRange(kind:string,market:any,context:any,raw:any,valuation:number){
  const px=Number(market?.price),m=context?.metrics||context?.basicMetrics||{};if(!finite(px)||px<=0)return null;
  const pe=Number(m.peTTM??m.peNormalizedAnnual??m.peBasicExclExtraTTM),ps=Number(m.psTTM??m.psAnnual),pb=Number(m.pbAnnual??m.pbQuarterly),rev=Math.max(-20,Math.min(100,num(raw.revGrowth,0)));
  let base:number|null=null,method="",confidence:"High"|"Medium"|"Low"="Low";
  if((kind==="bank"||kind==="insurer")&&finite(pb)&&pb>0){const bvps=px/pb,targetPB=valuation>=65?1.8:valuation>=50?1.35:1.0;base=bvps*targetPB;method="Book value / normalized P-B scenario";confidence="Medium"}
  else if((kind==="hypergrowth"||kind==="ai_infrastructure")&&finite(ps)&&ps>0&&rev>0){const salesPerShare=px/ps,targetPS=Math.max(2,Math.min(18,2.5+rev*.18+(finite(raw.opMargin)&&Number(raw.opMargin)>15?1.5:0)));base=salesPerShare*targetPS;method="Growth-adjusted forward sales scenario";confidence="Low"}
  else if((kind==="compounder"||kind==="general"||kind==="infrastructure")&&finite(pe)&&pe>0){const eps=px/pe,targetPE=Math.max(12,Math.min(40,16+Math.max(0,rev)*.45+(finite(raw.opMargin)&&Number(raw.opMargin)>20?3:0)));base=eps*targetPE;method="Normalized earnings / growth scenario";confidence="Medium"}
  if(base==null||!finite(base)||base<=0)return null;const uncertainty=(kind==="hypergrowth"||kind==="ai_infrastructure") ? .30 : (kind==="bank"||kind==="insurer") ? .20 : .24;
  return{bear:+(base*(1-uncertainty)).toFixed(2),base:+base.toFixed(2),bull:+(base*(1+uncertainty)).toFixed(2),method,confidence};
}

export function buildZones(market:any,thesisLabel:InvestorDecision["thesisLabel"],timingScore:number,valuationAvailable:boolean,fairRange?:{bear:number;base:number;bull:number}|null):PriceZone[]{
  const px=num(market?.price,0),lv=market?.levels||{},atr=Number(market?.volatility?.atr14),atrPct=Number(market?.volatility?.atrPct);
  const support=Number(lv.support),major=Number(lv.majorSupport),resistance=Number(lv.resistance),breakout=Number(lv.breakout);
  const width=finite(atr)&&atr>0?atr*.28:px>0&&finite(atrPct)?px*(atrPct/100)*.28:null;
  const z:PriceZone[]=[];
  if(thesisLabel!=="BEARISH"&&fairRange&&px>0){
    const starter=Math.min(fairRange.base,px); const accumulate=Math.min(fairRange.bear+(fairRange.base-fairRange.bear)*.45,starter);
    const strong=Math.min(fairRange.bear,accumulate);
    z.push({label:"Fundamental starter",low:+(starter*.97).toFixed(2),high:+starter.toFixed(2),kind:"starter",confidence:"Medium",basis:"Expected-return zone derived from NIVORA base valuation; technicals refine execution."});
    z.push({label:"Fundamental accumulate",low:+(accumulate*.96).toFixed(2),high:+accumulate.toFixed(2),kind:"accumulate",confidence:"Medium",basis:"Larger margin-of-safety zone derived from the bear/base valuation distribution."});
    z.push({label:"Strong accumulate / thesis intact",low:+(strong*.96).toFixed(2),high:+strong.toFixed(2),kind:"strong",confidence:"Low",basis:"Deep valuation zone. Only valid while company-specific thesis breakers remain false."});
  }
  if(finite(major)&&finite(support)&&major>0&&support>major){
    const gap=support-major;
    const localWidth=Math.max(.01,Math.min(width||gap*.14,gap*.19));
    const mid=(support+major)/2;
    const rs=range(support,localWidth),ra=range(mid,localWidth),rg=range(major,localWidth);
    if(rs)z.push({label:"Starter / first support",...rs,kind:"starter",confidence:timingScore>=58?"Medium":"Low",basis:"Nearest structural support with volatility-adjusted execution width."});
    if(ra)z.push({label:"Accumulate / deeper support",...ra,kind:"accumulate",confidence:timingScore>=50?"Medium":"Low",basis:"Deeper structural support between first support and major support; thesis must remain intact."});
    if(rg)z.push({label:"Strong accumulate only with intact thesis",...rg,kind:"strong",confidence:valuationAvailable?"Medium":"Low",basis:valuationAvailable?"Valuation context plus major technical support alignment.":"Major technical support only; independent fair value is not yet established."});
  }else{
    if(finite(support)&&support>0){const r=range(support,width||Math.max(.01,Math.abs(px-support)*.15));if(r)z.push({label:"Starter / first support",...r,kind:"starter",confidence:timingScore>=58?"Medium":"Low",basis:"Nearest structural support with volatility-adjusted execution width."})}
    if(finite(major)&&major>0){const r=range(major,width||Math.max(.01,Math.abs(px-major)*.12));if(r)z.push({label:"Accumulate / major support",...r,kind:"accumulate",confidence:timingScore>=50?"Medium":"Low",basis:"Deeper structural support; thesis must remain intact."})}
  }
  if(finite(resistance)&&resistance>0)z.push({label:"Do not chase / resistance",low:resistance,high:finite(breakout)&&breakout>resistance?breakout:resistance,kind:"chase",confidence:"Medium",basis:"Overhead supply / breakout area; price strength is timing evidence, not thesis evidence."});
  if(finite(lv.invalidation)&&Number(lv.invalidation)>0)z.push({label:"Technical risk check",low:Number(lv.invalidation),high:Number(lv.invalidation),kind:"risk",confidence:"Medium",basis:"Technical deterioration level. Fundamental exits require thesis deterioration, not price alone."});
  if(thesisLabel==="BEARISH")return z.map(x=>x.kind==="starter"||x.kind==="accumulate"||x.kind==="strong"?{...x,label:x.label.replace(/Starter|Accumulate|Strong accumulate/gi,"Support context"),confidence:"Low" as const}:x);
  return z;
}

export function buildInvestorDecision({market,company,context,institutional,owns=false,position=null}:{market:any,company:any,context:any,institutional?:any,owns?:boolean,position?:PositionContext|null}):InvestorDecision|null{
  if(!market)return null;
  const raw=company?.rawMetrics||{},assetType=String(market?.assetType||company?.assetType||"stock");
  const base=num(company?.fundamentalSignal?.score,50),five=num(company?.fiveYearRecord?.score,base);
  const rev=num(raw.revGrowth,0),ni=num(raw.niGrowth,0),margin=Number(raw.opMargin),fcf=Number(raw.fcf),lev=Number(raw.leverage),grossMargin=Number(raw.grossMargin);
  const kind=classifyArchetype(context,raw,assetType);

  let financial=50+(finite(fcf)?fcf>0?13:-15:0)+(finite(margin)?clamp((margin-8)*.60,-13,14):0)+(finite(lev)?lev<60?9:lev>85?-15:0:0);
  if(finite(grossMargin)&&grossMargin>45)financial+=5;
  if(kind==="hypergrowth"&&finite(margin)&&margin<0)financial-=4;
  financial=clamp(financial);

  let growth=clamp(50+clamp(rev*.62,-27,28)+clamp(ni*.14,-12,12));
  if(company?.fiveYearRecord?.revenueTrend==="Strong")growth=clamp(growth+12);
  if(company?.fiveYearRecord?.revenueTrend==="Improving")growth=clamp(growth+6);
  if(company?.fiveYearRecord?.revenueTrend==="Weakening")growth=clamp(growth-16);

  const durability=clamp(five*.58+base*.24+financial*.18);
  const qualityWeights=(kind==="hypergrowth"||kind==="ai_infrastructure"||kind==="pre_scale")?{base:.25,financial:.18,durability:.22,growth:.35}:kind==="cyclical"||kind==="miner"?{base:.27,financial:.33,durability:.29,growth:.11}:kind==="bank"||kind==="insurer"?{base:.30,financial:.36,durability:.28,growth:.06}:{base:.31,financial:.27,durability:.27,growth:.15};
  const quality=clamp(base*qualityWeights.base+financial*qualityWeights.financial+durability*qualityWeights.durability+growth*qualityWeights.growth);

  const a=analyst(context),e=earnings(context),instEnabled=!!institutional?.enabled,inst=num(institutional?.institutional?.institutionalScore,50);
  const news=context?.summary?.tone;
  const catalysts=clamp(50+(news==="positive"?8:news==="negative"?-10:0)+(company?.filingRisk?-22:0));
  const streetChange=clamp(50+a.trend*2.2);
  // Analyst level is intentionally low-weight. Changes matter more than the structurally bullish sell-side level.
  const forward=clamp(growth*.43+e.score*.25+streetChange*.18+catalysts*.14);
  const companyScore=Math.round(quality),companyLabel=companyScore>=82?"Exceptional":companyScore>=70?"Strong":companyScore>=55?"Average":"Weak";

  const vetoes:string[]=[];
  if(company?.filingRisk)vetoes.push("Active financing/dilution filing risk requires explicit review.");
  if(financial<24)vetoes.push("Financial health is too weak for an aggressive long recommendation.");
  if(growth<24&&forward<35)vetoes.push("Growth and forward evidence are both deteriorating.");
  if(finite(fcf)&&fcf<0&&finite(lev)&&lev>88)vetoes.push("Negative free cash flow plus extreme liabilities creates a capital-risk veto.");

  // Fundamental thesis deliberately excludes technical timing and current price.
  let tr=companyScore*.31+durability*.18+forward*.31+e.score*.10+catalysts*.07+(instEnabled?inst:50)*.03;
  if(financial<35)tr-=11;if(forward<36)tr-=13;if(growth<30)tr-=9;if(financial<45&&growth<40)tr-=6;if(company?.filingRisk)tr-=7;
  if(vetoes.length>=2)tr=Math.min(tr,34);
  const thesisScore=Math.round(clamp(tr));
  const thesisLabel:InvestorDecision["thesisLabel"]=thesisScore>=72&&forward>=56&&companyScore>=56&&!vetoes.length?"BULLISH":thesisScore<=41||forward<=33||financial<=27||vetoes.length>=2?"BEARISH":"NEUTRAL";

  const delta=(forward-50)*.42+e.trend*.50+a.trend*.55+(instEnabled?(inst-50)*.04:0)+(catalysts-50)*.10;
  let thesisState:ThesisState=thesisScore<27?"Broken":delta<=-8?"Weakening":thesisScore>=60?"Intact":"Mixed";
  if(delta>=8)thesisState=thesisLabel==="BEARISH"?"Recovering":"Strengthening";

  const valuationModel=valuationScore(kind,context,raw);
  const valuation=valuationModel.score,valuationLabel=valuationModel.label;
  const px=num(market.price,0),pt=context?.priceTarget||{},mean=Number(pt.targetMean),low=Number(pt.targetLow),high=Number(pt.targetHigh);
  const hasStreet=px>0&&finite(mean)&&mean>0;
  const rawFairRange=valuationRange(kind,market,context,raw,valuation);
  const valuationValidity=validateValuationRange(kind,market,valuationModel,rawFairRange);
  const fairRange=valuationValidity.fairValueAllowed?rawFairRange:null;
  const expectedCagr=fairRange&&px>0?{oneYearPct:+((fairRange.base/px-1)*100).toFixed(1),threeYearPct:+((Math.pow(fairRange.base/px,1/3)-1)*100).toFixed(1)}:null;
  const upside=hasStreet?(mean/px-1)*100:null;

  const risk=num(market?.scores?.risk,60),trend=num(market?.scores?.trend,50),momentum=num(market?.scores?.momentum,50),flow=num(market?.scores?.flow,50),entry=num(market?.scores?.entry,50),extension=num(market?.scores?.extension,50);
  const technical=clamp(trend*.42+momentum*.25+flow*.18+entry*.15);
  const timingScore=Math.round(clamp(entry*.38+trend*.23+momentum*.16+flow*.10+(100-extension)*.13));
  const timingLabel:InvestorDecision["timing"]["label"]=extension>=78&&trend>=60?"OVEREXTENDED":trend<38&&momentum<42?"WEAK":timingScore>=68?"ATTRACTIVE":timingScore>=55?"SELECTIVE":"WAIT";
  const timingReason=timingLabel==="OVEREXTENDED"?"The thesis may be valid, but price is stretched; avoid chasing.":timingLabel==="WEAK"?"Price has not stabilized enough to reward aggressive entry.":timingLabel==="ATTRACTIVE"?"Price structure, momentum and extension are aligned for staged entry.":timingLabel==="SELECTIVE"?"Entry is acceptable only with disciplined sizing and thesis confirmation.":"The current price setup does not provide enough timing edge.";

  // Missing valuation is uncertainty, not bearish evidence. Re-normalize available families instead of inserting a zero/neutral penalty.
  const opportunityScore=Math.round(weighted([
    {value:thesisScore,weight:.55},
    {value:valuation,weight:.22,available:valuationModel.available},
    {value:100-risk,weight:.13},
    {value:timingScore,weight:.10}
  ]));
  const hs:any[]=[
    ["3M",weighted([{value:e.score,weight:.23,available:e.available},{value:streetChange,weight:.18,available:a.available},{value:catalysts,weight:.17},{value:technical,weight:.24},{value:100-risk,weight:.18}]),"Earnings, fresh Street changes, catalysts and market structure dominate the near term."],
    ["6M",weighted([{value:forward,weight:.32},{value:e.score,weight:.18,available:e.available},{value:streetChange,weight:.12,available:a.available},{value:valuation,weight:.10,available:valuationModel.available},{value:technical,weight:.10},{value:companyScore,weight:.18}]),"Forward evidence and earnings follow-through matter more than daily price action."],
    ["1Y",weighted([{value:forward,weight:.34},{value:companyScore,weight:.24},{value:financial,weight:.14},{value:e.score,weight:.08,available:e.available},{value:valuation,weight:.12,available:valuationModel.available},{value:durability,weight:.08}]),"Business quality, forward growth, cash economics and valuation dominate the one-year case."],
    ["2Y",weighted([{value:companyScore,weight:.30},{value:durability,weight:.24},{value:forward,weight:.25},{value:financial,weight:.13},{value:growth,weight:.08}]),"Durability, forward economics and company quality dominate the two-year case."],
    ["3Y",weighted([{value:companyScore,weight:.34},{value:durability,weight:.28},{value:growth,weight:.18},{value:financial,weight:.14},{value:forward,weight:.06}]),"Long-duration compounding depends on durable economics, growth runway and financial strength." ]
  ];
  const horizons:HorizonOutlook[]=hs.map(([key,score,reason])=>({key,score:Math.round(score),label:ol(score),reason}));
  const bestHorizon=[...horizons].sort((x,y)=>y.score-x.score)[0]?.key||"1Y";

  const notes:string[]=[];
  if(thesisLabel==="BULLISH"&&forward<50)notes.push("Bullish thesis requires at least neutral forward evidence.");
  if(thesisLabel==="BEARISH"&&thesisState==="Strengthening")notes.push("Weak thesis with improving evidence must be labelled Recovering, not Strengthening.");
  if(vetoes.length&&thesisLabel==="BULLISH")notes.push("A hard risk veto cannot coexist with a Bullish headline.");
  if(horizons.filter(h=>h.label.includes("BULLISH")).length>=4&&thesisLabel==="BEARISH")notes.push("Long-horizon outputs conflict with the bearish fundamental thesis.");
  const consistency={ok:notes.length===0,notes};

  const pos=position&&px>0&&position.avgCost>0?{shares:position.shares,avgCost:position.avgCost,pnlPct:(px/position.avgCost-1)*100,belowCost:px<position.avgCost,weightPct:position.weightPct??null}:null;
  let action:InvestorDecision["action"],actionReason:string;
  if(owns){
    if(thesisState==="Broken"||thesisScore<26||vetoes.length>=2){action="EXIT / REASSESS";actionReason="The forward investment case is materially impaired. Cost basis does not justify holding a broken thesis."}
    else if(thesisLabel==="BEARISH"&&thesisScore<=36&&forward<38){action="REDUCE";actionReason="Forward evidence is weak enough that capital preservation can outweigh waiting for breakeven."}
    else if(thesisState==="Weakening"&&thesisScore<54){action="HOLD / WATCH";actionReason="The thesis is weakening, but the evidence has not crossed the fundamental exit threshold."}
    else if(thesisScore>=70&&opportunityScore>=68&&timingLabel==="ATTRACTIVE"){action="ADD";actionReason="The company thesis remains strong and current price/timing supports staged additional capital."}
    else if(valuationLabel==="Expensive"&&thesisScore<68&&extension>=75){action="TRIM";actionReason="Valuation and extension are elevated while conviction is not high enough to justify full exposure."}
    else{action="HOLD";actionReason="The position remains investable. Average cost affects your P/L, not the independent company thesis."}
  }else{
    if(thesisState==="Broken"||thesisScore<29||vetoes.length>=2){action="AVOID";actionReason="The fundamental/forward evidence is too weak for new capital."}
    else if(thesisLabel==="BEARISH"){action="AVOID";actionReason="A weak fundamental thesis cannot be rescued by an oversold technical setup."}
    else if(timingLabel==="OVEREXTENDED"){action="WAIT";actionReason="The investment thesis may be attractive, but price is extended. Do not chase."}
    else if(thesisScore>=82&&opportunityScore>=76&&companyScore>=72&&timingLabel==="ATTRACTIVE"){action="STRONG BUY";actionReason="Business quality, forward thesis, valuation and entry timing are unusually well aligned."}
    else if(thesisScore>=68&&opportunityScore>=62&&(timingLabel==="ATTRACTIVE"||timingLabel==="SELECTIVE")){action="ACCUMULATE";actionReason="The long-term thesis is constructive and current timing is acceptable for staged buying."}
    else{action="WAIT";actionReason=thesisLabel==="BULLISH"?"The business/thesis is attractive, but valuation or timing does not justify aggressive new capital today.":"The evidence is not strong enough to establish a durable edge for new capital."}
  }
  if(!consistency.ok){action=owns?"HOLD / WATCH":"WAIT";actionReason=`Decision withheld because evidence conflicts: ${consistency.notes[0]}`}

  const drivers=uniq([
    companyScore>=72?"Business quality and multi-year evidence are strong.":"",
    growth>=68?"Revenue/profit growth evidence is strong relative to the company's history.":"",
    financial>=68?"Cash generation, margins and balance-sheet evidence are supportive.":"",
    forward>=68?"Forward evidence is improving across growth, earnings and recent revisions.":"",
    e.score>=67?"Recent earnings execution is supportive.":"",
    instEnabled&&inst>=65?"Reported institutional ownership is constructive, with reporting-lag caveats.":"",
    a.available&&a.trend>4?"Sell-side opinion has improved recently; NIVORA treats changes as more useful than raw Buy ratings.":""
  ]).slice(0,5);
  const risks=uniq([
    financial<45?"Financial quality is a weak link in the investment case.":"",
    growth<42?"Growth evidence is weak or deteriorating.":"",
    forward<45?"Forward evidence is not confirming a strong future thesis.":"",
    company?.filingRisk?"Financing/dilution-related filing risk requires review.":"",
    valuationLabel==="Expensive"?"Valuation leaves limited room for execution mistakes.":"",
    risk>=72?"Volatility/downside pressure is high even if the fundamental thesis survives.":"",
    extension>=75?"Price is technically overextended and vulnerable to mean reversion.":""
  ]).slice(0,5);
  const breakers=uniq([
    kind==="hypergrowth"||kind==="ai_infrastructure"?"Forward revenue/contracted-capacity growth and unit economics deteriorate for multiple reporting periods.":"",
    kind==="pre_scale"?"Commercial milestones, launch/deployment execution, regulatory progress or cash runway deteriorate enough to impair the scale-up case.":"",
    kind==="compounder"?"Free-cash-flow conversion or operating margins structurally deteriorate despite continued growth.":"",
    kind==="cyclical"||kind==="miner"?"Cycle economics weaken while balance-sheet stress rises enough to impair through-cycle value.":"",
    kind==="bank"||kind==="insurer"?"Capital adequacy, credit/underwriting quality or sustainable returns deteriorate materially.":"",
    kind==="biotech"?"Clinical probability, regulatory path or cash runway deteriorates enough to impair the asset value.":"",
    "Management guidance / forward estimates deteriorate for more than one cycle rather than a single noisy quarter.",
    "Cash generation, margins or balance-sheet quality deteriorate enough to reduce long-term expected returns.",
    company?.filingRisk?"Financing or dilution changes shareholder economics enough to invalidate the expected-return case.":""
  ]).slice(0,4);
  const materialHeadline=String(context?.latestEarningsNews?.title||context?.latestEarningsNews?.headline||context?.news?.[0]?.title||context?.news?.[0]?.headline||"").trim();
  const changed=uniq([
    e.trend>=7?"Recent earnings evidence improved.":e.trend<=-7?"Recent earnings evidence weakened.":"",
    a.trend>=6?"Street opinion improved versus the prior period.":a.trend<=-6?"Street opinion deteriorated versus the prior period.":"",
    news==="positive"?(materialHeadline?`Supportive material news: ${materialHeadline}`:"Recent material news is supportive."):news==="negative"?(materialHeadline?`Material news headwind: ${materialHeadline}`:"Recent material news is a headwind."):""
  ]);

  const streetView:InvestorDecision["streetView"]=!a.available?{label:"Unavailable",score:null,note:"No usable analyst recommendation set is available."}:a.score>=68?{label:"Positive",score:a.score,note:"Street consensus is positive, but NIVORA does not use the raw rating level as valuation or as a dominant thesis input."}:a.score<40?{label:"Cautious",score:a.score,note:"Street consensus is cautious; changes and estimate direction matter more than the raw level."}:{label:"Mixed",score:a.score,note:"Street opinion is mixed."};
  const streetDisagreementActive=(streetView.label==="Positive"&&thesisLabel==="BEARISH")||(streetView.label==="Cautious"&&thesisLabel==="BULLISH");
  const streetDisagreement=streetDisagreementActive?{active:true,headline:`NIVORA ${thesisLabel.toLowerCase()} while Wall Street is ${streetView.label.toLowerCase()}`,reasons:uniq([
    financial<45?"Financial strength is below NIVORA's long-horizon threshold.":"",
    forward<50?"Forward evidence is not strong enough to confirm the Street view.":"",
    valuationLabel==="Expensive"?"NIVORA's independent valuation is demanding relative to modeled growth.":"",
    risk>=72?"Risk pressure remains elevated.":"",
    company?.filingRisk?"Financing/dilution evidence adds a hard risk constraint.":""
  ]).slice(0,4)}:{active:false,headline:"",reasons:[]};

  const evidence=[market?1:0,company?.fundamentalSignal?1:0,company?.fiveYearRecord?1:0,context?.enabled?1:0,e.available?1:0,a.available?1:0,instEnabled?1:0,valuationModel.available?1:0];
  const dataCompleteness=Math.round(evidence.reduce((x,y)=>x+y,0)/evidence.length*100);
  const valuationSanity=checkValuationSanity(px,fairRange);
  const decisionGradeEvidence=Math.max(0,Math.min(100,dataCompleteness-(valuationModel.available&&!valuationValidity.fairValueAllowed?12:0)-(valuationSanity.status==="WARN"?6:valuationSanity.status==="FAIL"?15:0)));
  const factorMap={business:companyScore,financial:Math.round(financial),growth:Math.round(growth),durability:Math.round(durability),forward:Math.round(forward),earnings:e.available?e.score:null,streetChange:a.available?Math.round(streetChange):null,institutional:instEnabled?Math.round(inst):null,catalysts:Math.round(catalysts),valuation:valuationModel.available?Math.round(valuation):null,timing:timingScore,risk:Math.round(risk)};
  const technicalReality=technicalRealityFromCandles(market);
  const decisionReality=buildDecisionReality({price:px,valuationRange:fairRange,archetype:kind,timingScore,timingLabel,technical:technicalReality,factors:factorMap,newsTone:news||null,thesisScore,opportunityScore,filingRisk:Boolean(company?.filingRisk),vetoCount:vetoes.length});
  const zones=consolidateEntryZones(buildZones(market,thesisLabel,timingScore,valuationValidity.zonesAllowed,fairRange)).map(z=>roundPriceZone(z,z.confidence,px));
  const longH=[...horizons].filter(h=>h.key==="1Y"||h.key==="2Y"||h.key==="3Y");
  const longTermScore=Math.round(longH.reduce((sum,h)=>sum+h.score,0)/Math.max(1,longH.length));
  const longTermLabel:NonNullable<InvestorDecision["longTermThesis"]>["label"]=longTermScore>=75?"STRONG":longTermScore>=62?"CONSTRUCTIVE":longTermScore>=48?"MIXED":"WEAK";
  const nearTerm=`3M ${horizons.find(h=>h.key==="3M")?.label||"NEUTRAL"}; timing ${timingLabel.toLowerCase()}.`;
  const longTerm=`1–3Y evidence is ${longTermLabel.toLowerCase()} (${longTermScore}/100), driven primarily by business quality, forward evidence, durability and financial strength.`;
  const longTermThesis={label:longTermLabel,score:longTermScore,summary:longTermLabel==="STRONG"?"The long-duration business case is strong even if near-term price action is noisy.":longTermLabel==="CONSTRUCTIVE"?"The long-duration business case is constructive, but execution and valuation still matter.":longTermLabel==="MIXED"?"The long-duration case has meaningful positives and unresolved weaknesses.":"Long-duration evidence is not strong enough to justify conviction.",nearTerm,longTerm};
  const expectationRaw=(forward-50)*.55+(e.available?(e.score-50)*.20:0)+(a.available?(streetChange-50)*.15:0)+(catalysts-50)*.10;
  const expectationGap={label:!context?.enabled?"UNKNOWN" as const:expectationRaw>=8?"POSITIVE" as const:expectationRaw<=-8?"NEGATIVE" as const:"BALANCED" as const,score:context?.enabled?Math.round(clamp(50+expectationRaw)):null,reason:!context?.enabled?"Forward expectation evidence is unavailable.":expectationRaw>=8?"Forward growth, execution/revisions and catalysts are improving faster than the neutral baseline.":expectationRaw<=-8?"Forward evidence is deteriorating and expectations may still be too high.":"Forward evidence is broadly balanced; NIVORA does not see a large expectation mismatch yet."};
  const oneLine=thesisLabel==="BULLISH"?`The ${companyLabel.toLowerCase()} business profile and forward evidence support a constructive long-term thesis; ${timingLabel==="OVEREXTENDED"?"price is too extended to chase":timingLabel==="WEAK"?"price has not stabilized yet":"entry quality still matters"}.`:thesisLabel==="BEARISH"?"The fundamental/forward evidence is weak enough that technical strength alone should not justify new capital.":"The investment case is mixed: there is not yet enough aligned evidence to call the long-term thesis strongly bullish or bearish.";

  const rawToday=deriveTodayAction({thesisScore,opportunityScore,companyScore,thesisLabel,thesisState,timing:{score:timingScore,label:timingLabel},valuationLabel,vetoes,consistency},owns);
  const today=applyRealityGuardToToday(rawToday,owns,decisionReality) as TodayDecision;
  const actionTriggers=buildActionTriggers({action:today.action,owns,thesisScore,opportunityScore,companyScore,timingScore,timingLabel,thesisState,valuationLabel});
  const adversarialRisks=buildAdversarialRisks({archetype:kind,timingScore,factors:{financial:Math.round(financial),growth:Math.round(growth),forward:Math.round(forward),risk:Math.round(risk)},existingRisks:risks,breakers,valuationWarnings:valuationSanity.warnings});
  const proofBase={validationStatus:"UNVALIDATED" as const,sampleSize:0};
  const metricProofs:Record<string,MetricProof>={
    thesis:buildMetricProof({metric:"thesis",value:thesisScore,status:"AVAILABLE",formulaVersion:WEIGHTS_VERSION,sources:["Company fundamentals","Forward evidence","Earnings/catalysts"],freshness:"Mixed slow/forward evidence",...proofBase,contributors:decisionReality.scoreAttribution.map(x=>({label:x.label,impact:x.impactPoints??0}))}),
    business:buildMetricProof({metric:"business",value:companyScore,status:"AVAILABLE",formulaVersion:ENGINE_VERSION,sources:["Company fundamentals","SEC filings","Multi-year record"],freshness:"Primarily filing-driven",...proofBase}),
    opportunity:buildMetricProof({metric:"opportunity",value:opportunityScore,status:"AVAILABLE",formulaVersion:ENGINE_VERSION,sources:["Thesis","Timing","Risk","Valuation when available"],freshness:"Market + filing driven",...proofBase}),
    timing:buildMetricProof({metric:"timing",value:timingScore,status:"AVAILABLE",formulaVersion:ENGINE_VERSION,sources:["Price/volume history","Benchmark-relative trend"],freshness:"Daily market-data driven",...proofBase}),
    valuation:buildMetricProof({metric:"valuation",value:valuationModel.available?Math.round(valuation):null,status:valuationModel.available?"AVAILABLE":"UNAVAILABLE",formulaVersion:VALUATION_VERSION,sources:["Fundamentals","Archetype valuation inputs"],freshness:"Price + filing driven",...proofBase}),
    reliability:buildMetricProof({metric:"reliability",value:null,status:"COLLECTING",formulaVersion:ENGINE_VERSION,sources:["Backtest","Out-of-sample","Forward paper outcomes"],freshness:"Updates as outcomes mature",...proofBase})
  };
  return{
    companyScore,thesisScore,opportunityScore,confidence:dataCompleteness,companyLabel,thesisLabel,thesisState,valuationLabel,action,actionReason,today,
    horizon:bestHorizon,oneLine,drivers,risks,breakers,changed,factors:factorMap,factorAvailability:{business:true,financial:true,growth:true,durability:true,forward:true,earnings:e.available,streetChange:a.available,institutional:instEnabled,catalysts:true,valuation:valuationModel.available,timing:true,risk:true},horizons,bestHorizon,
    streetTarget:hasStreet?{mean:Number(mean.toFixed(2)),low:finite(low)?Number(low.toFixed(2)):undefined,high:finite(high)?Number(high.toFixed(2)):undefined,upsidePct:Number((upside||0).toFixed(1))}:null,
    expectedReturn:{oneYearPct:null,threeYearCagrPct:null,source:"unavailable"},consistency,position:pos,archetype:kind,dataCompleteness,modelConfidenceLabel:"Uncalibrated",timing:{score:timingScore,label:timingLabel,reason:timingReason},streetView,streetDisagreement,zones,valuationBasis:valuationModel.basis,vetoes,valuationRange:fairRange,valuationValidity,valuationSanity,adversarialRisks,actionTriggers,decisionReality,metricProofs,decisionGradeEvidence,expectedCagr,longTermThesis,expectationGap
  };
}
