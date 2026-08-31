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
  factors:Record<string,number>;horizons:HorizonOutlook[];bestHorizon:string;
  streetTarget?:{mean:number;low?:number;high?:number;upsidePct:number}|null;
  expectedReturn?:{oneYearPct:number|null;threeYearCagrPct:number|null;source:"street"|"unavailable"};
  consistency:{ok:boolean;notes:string[]};position?:{shares:number;avgCost:number;pnlPct:number;belowCost:boolean;weightPct?:number|null}|null;
  archetype:string;dataCompleteness:number;modelConfidenceLabel:"Uncalibrated"|"Calibrated";
  timing:{score:number;label:"ATTRACTIVE"|"SELECTIVE"|"WAIT"|"OVEREXTENDED"|"WEAK";reason:string};
  streetView:{label:"Positive"|"Mixed"|"Cautious"|"Unavailable";score:number|null;note:string};
  zones:PriceZone[];valuationBasis:string;vetoes:string[];
};

const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
const num=(x:any,f=50)=>Number.isFinite(Number(x))?Number(x):f;
const finite=(x:any)=>Number.isFinite(Number(x));
const uniq=(x:string[])=>[...new Set(x.filter(Boolean))];
const ol=(s:number):OutlookLabel=>s>=82?"STRONG BULLISH":s>=70?"BULLISH":s>=60?"CONSTRUCTIVE":s>=48?"NEUTRAL":s>=39?"CAUTIOUS":s>=28?"BEARISH":"STRONG BEARISH";
const range=(center:number|null,width:number|null)=>center!=null&&width!=null&&center>0&&width>0?{low:Math.max(.01,center-width),high:center+width}:null;

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

function archetype(context:any,raw:any,assetType:string){
  if(assetType==="crypto")return"crypto";
  const industry=String(context?.profile?.finnhubIndustry||"").toLowerCase();
  const op=Number(raw.opMargin),fcf=Number(raw.fcf),rev=num(raw.revGrowth,0);
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

function valuationScore(kind:string,context:any,raw:any){
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
  if(kind==="miner"||kind==="cyclical"){
    return{score:50,label:"Unclear" as const,basis:"Cyclical/miner valuation requires normalized cycle earnings or NAV evidence; trailing multiples are intentionally not treated as fair value.",available:false};
  }
  if(kind==="hypergrowth"){
    if(finite(ps)&&ps>0&&rev>0){const g=Math.max(5,rev);const ratio=ps/g*100;const s=clamp(82-ratio*1.8+(finite(op)&&op>10?5:0));return{score:Math.round(s),label:s>=72?"Deeply attractive" as const:s>=62?"Attractive" as const:s<38?"Expensive" as const:"Fair" as const,basis:"Growth-adjusted sales multiple (preliminary hypergrowth model).",available:true}}
    return{score:50,label:"Unclear" as const,basis:"Hypergrowth valuation needs a usable sales multiple and growth evidence.",available:false};
  }
  if(finite(pe)&&pe>0){
    const growthAdj=rev>0?Math.min(15,rev*.30):0;let s=pe<18?74:pe<28?64:pe<42?54:pe<65?43:31;s+=growthAdj;if(finite(fcf)&&fcf<0)s-=8;
    s=clamp(s);return{score:Math.round(s),label:s>=74?"Deeply attractive" as const:s>=62?"Attractive" as const:s<40?"Expensive" as const:"Fair" as const,basis:"Growth-adjusted earnings multiple used as a preliminary cross-check; not a full DCF.",available:true};
  }
  return{score:50,label:"Unclear" as const,basis:"Independent valuation is not established from the currently available evidence.",available:false};
}

function buildZones(market:any,thesisLabel:InvestorDecision["thesisLabel"],timingScore:number,valuationAvailable:boolean):PriceZone[]{
  const px=num(market?.price,0),lv=market?.levels||{},atr=Number(market?.volatility?.atr14),atrPct=Number(market?.volatility?.atrPct);
  const support=Number(lv.support),major=Number(lv.majorSupport),resistance=Number(lv.resistance),breakout=Number(lv.breakout);
  const width=finite(atr)&&atr>0?atr*.28:px>0&&finite(atrPct)?px*(atrPct/100)*.28:null;
  const z:PriceZone[]=[];
  if(finite(support)&&support>0){const r=range(support,width||Math.max(.01,Math.abs(px-support)*.15));if(r)z.push({label:"Starter / first support",...r,kind:"starter",confidence:timingScore>=58?"Medium":"Low",basis:"Nearest structural support with volatility-adjusted execution width."})}
  if(finite(major)&&major>0){const r=range(major,width||Math.max(.01,Math.abs(px-major)*.12));if(r)z.push({label:"Accumulate / major support",...r,kind:"accumulate",confidence:timingScore>=50?"Medium":"Low",basis:"Deeper structural support; thesis must remain intact."})}
  if(finite(major)&&finite(support)&&major>0&&support>major){const center=(major+support)/2;const r=range(center,width?width*.75:(support-major)*.18);if(r)z.push({label:"Strong accumulate only with intact thesis",...r,kind:"strong",confidence:valuationAvailable?"Medium":"Low",basis:valuationAvailable?"Valuation context plus technical support alignment.":"Technical confluence only; independent fair value is not yet established."})}
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
  const kind=archetype(context,raw,assetType);

  let financial=50+(finite(fcf)?fcf>0?13:-15:0)+(finite(margin)?clamp((margin-8)*.60,-13,14):0)+(finite(lev)?lev<60?9:lev>85?-15:0:0);
  if(finite(grossMargin)&&grossMargin>45)financial+=5;
  if(kind==="hypergrowth"&&finite(margin)&&margin<0)financial-=4;
  financial=clamp(financial);

  let growth=clamp(50+clamp(rev*.62,-27,28)+clamp(ni*.14,-12,12));
  if(company?.fiveYearRecord?.revenueTrend==="Strong")growth=clamp(growth+12);
  if(company?.fiveYearRecord?.revenueTrend==="Improving")growth=clamp(growth+6);
  if(company?.fiveYearRecord?.revenueTrend==="Weakening")growth=clamp(growth-16);

  const durability=clamp(five*.58+base*.24+financial*.18);
  const qualityWeights=kind==="hypergrowth"?{base:.25,financial:.18,durability:.22,growth:.35}:kind==="cyclical"||kind==="miner"?{base:.27,financial:.33,durability:.29,growth:.11}:kind==="bank"||kind==="insurer"?{base:.30,financial:.36,durability:.28,growth:.06}:{base:.31,financial:.27,durability:.27,growth:.15};
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
  const upside=hasStreet?(mean/px-1)*100:null;

  const risk=num(market?.scores?.risk,60),trend=num(market?.scores?.trend,50),momentum=num(market?.scores?.momentum,50),flow=num(market?.scores?.flow,50),entry=num(market?.scores?.entry,50),extension=num(market?.scores?.extension,50);
  const technical=clamp(trend*.42+momentum*.25+flow*.18+entry*.15);
  const timingScore=Math.round(clamp(entry*.38+trend*.23+momentum*.16+flow*.10+(100-extension)*.13));
  const timingLabel:InvestorDecision["timing"]["label"]=extension>=78&&trend>=60?"OVEREXTENDED":trend<38&&momentum<42?"WEAK":timingScore>=68?"ATTRACTIVE":timingScore>=55?"SELECTIVE":"WAIT";
  const timingReason=timingLabel==="OVEREXTENDED"?"The thesis may be valid, but price is stretched; avoid chasing.":timingLabel==="WEAK"?"Price has not stabilized enough to reward aggressive entry.":timingLabel==="ATTRACTIVE"?"Price structure, momentum and extension are aligned for staged entry.":timingLabel==="SELECTIVE"?"Entry is acceptable only with disciplined sizing and thesis confirmation.":"The current price setup does not provide enough timing edge.";

  const opportunityScore=Math.round(clamp(thesisScore*.55+valuation*.22+(100-risk)*.13+timingScore*.10));
  const hs:any[]=[
    ["3M",clamp(e.score*.23+streetChange*.18+catalysts*.17+technical*.24+(100-risk)*.18),"Earnings, fresh Street changes, catalysts and market structure dominate the near term."],
    ["6M",clamp(forward*.32+e.score*.18+streetChange*.12+valuation*.10+technical*.10+companyScore*.18),"Forward evidence and earnings follow-through matter more than daily price action."],
    ["1Y",clamp(forward*.34+companyScore*.24+financial*.14+e.score*.08+valuation*.12+durability*.08),"Business quality, forward growth, cash economics and valuation dominate the one-year case."],
    ["2Y",clamp(companyScore*.30+durability*.24+forward*.25+financial*.13+growth*.08),"Durability, forward economics and company quality dominate the two-year case."],
    ["3Y",clamp(companyScore*.34+durability*.28+growth*.18+financial*.14+forward*.06),"Long-duration compounding depends on durable economics, growth runway and financial strength." ]
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
    kind==="hypergrowth"?"Forward revenue growth and unit economics deteriorate for multiple reporting periods.":"",
    kind==="compounder"?"Free-cash-flow conversion or operating margins structurally deteriorate despite continued growth.":"",
    kind==="cyclical"||kind==="miner"?"Cycle economics weaken while balance-sheet stress rises enough to impair through-cycle value.":"",
    kind==="bank"||kind==="insurer"?"Capital adequacy, credit/underwriting quality or sustainable returns deteriorate materially.":"",
    kind==="biotech"?"Clinical probability, regulatory path or cash runway deteriorates enough to impair the asset value.":"",
    "Management guidance / forward estimates deteriorate for more than one cycle rather than a single noisy quarter.",
    "Cash generation, margins or balance-sheet quality deteriorate enough to reduce long-term expected returns.",
    company?.filingRisk?"Financing or dilution changes shareholder economics enough to invalidate the expected-return case.":""
  ]).slice(0,4);
  const changed=uniq([
    e.trend>=7?"Recent earnings evidence improved.":e.trend<=-7?"Recent earnings evidence weakened.":"",
    a.trend>=6?"Street opinion improved versus the prior period.":a.trend<=-6?"Street opinion deteriorated versus the prior period.":"",
    news==="positive"?"Recent material news is supportive.":news==="negative"?"Recent material news is a headwind.":""
  ]);

  const streetView:InvestorDecision["streetView"]=!a.available?{label:"Unavailable",score:null,note:"No usable analyst recommendation set is available."}:a.score>=68?{label:"Positive",score:a.score,note:"Street consensus is positive, but NIVORA does not use the raw rating level as valuation or as a dominant thesis input."}:a.score<40?{label:"Cautious",score:a.score,note:"Street consensus is cautious; changes and estimate direction matter more than the raw level."}:{label:"Mixed",score:a.score,note:"Street opinion is mixed."};

  const evidence=[market?1:0,company?.fundamentalSignal?1:0,company?.fiveYearRecord?1:0,context?.enabled?1:0,e.available?1:0,a.available?1:0,instEnabled?1:0,valuationModel.available?1:0];
  const dataCompleteness=Math.round(evidence.reduce((x,y)=>x+y,0)/evidence.length*100);
  const zones=buildZones(market,thesisLabel,timingScore,valuationModel.available);
  const oneLine=thesisLabel==="BULLISH"?`The ${companyLabel.toLowerCase()} business profile and forward evidence support a constructive long-term thesis; ${timingLabel==="OVEREXTENDED"?"price is too extended to chase":timingLabel==="WEAK"?"price has not stabilized yet":"entry quality still matters"}.`:thesisLabel==="BEARISH"?"The fundamental/forward evidence is weak enough that technical strength alone should not justify new capital.":"The investment case is mixed: there is not yet enough aligned evidence to call the long-term thesis strongly bullish or bearish.";

  return{
    companyScore,thesisScore,opportunityScore,confidence:dataCompleteness,companyLabel,thesisLabel,thesisState,valuationLabel,action,actionReason,
    horizon:bestHorizon,oneLine,drivers,risks,breakers,changed,factors:{business:companyScore,financial:Math.round(financial),growth:Math.round(growth),durability:Math.round(durability),forward:Math.round(forward),earnings:e.score,streetChange:Math.round(streetChange),institutional:Math.round(inst),catalysts:Math.round(catalysts),valuation:Math.round(valuation),timing:timingScore,risk:Math.round(risk)},horizons,bestHorizon,
    streetTarget:hasStreet?{mean:Number(mean.toFixed(2)),low:finite(low)?Number(low.toFixed(2)):undefined,high:finite(high)?Number(high.toFixed(2)):undefined,upsidePct:Number((upside||0).toFixed(1))}:null,
    expectedReturn:{oneYearPct:null,threeYearCagrPct:null,source:"unavailable"},consistency,position:pos,archetype:kind,dataCompleteness,modelConfidenceLabel:"Uncalibrated",timing:{score:timingScore,label:timingLabel,reason:timingReason},streetView,zones,valuationBasis:valuationModel.basis,vetoes
  };
}
