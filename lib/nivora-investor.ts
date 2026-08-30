export type ThesisState="Strengthening"|"Recovering"|"Intact"|"Mixed"|"Weakening"|"Broken";
export type OutlookLabel="STRONG BULLISH"|"BULLISH"|"CONSTRUCTIVE"|"NEUTRAL"|"CAUTIOUS"|"BEARISH"|"STRONG BEARISH";
export type HorizonOutlook={key:"3M"|"6M"|"1Y"|"2Y"|"3Y";score:number;label:OutlookLabel;reason:string};
export type PositionContext={shares:number;avgCost:number;marketValue?:number;weightPct?:number|null};
export type InvestorDecision={
  companyScore:number;thesisScore:number;opportunityScore:number;confidence:number;
  companyLabel:string;thesisLabel:"BULLISH"|"NEUTRAL"|"BEARISH";thesisState:ThesisState;
  valuationLabel:"Deeply attractive"|"Attractive"|"Fair"|"Expensive"|"Unclear";
  action:"STRONG BUY"|"ACCUMULATE"|"HOLD"|"HOLD / WATCH"|"WAIT"|"REDUCE"|"AVOID"|"EXIT / REASSESS";
  actionReason:string;horizon:string;oneLine:string;drivers:string[];risks:string[];breakers:string[];changed:string[];
  factors:Record<string,number>;horizons:HorizonOutlook[];bestHorizon:string;
  streetTarget?:{mean:number;low?:number;high?:number;upsidePct:number}|null;
  expectedReturn?:{oneYearPct:number|null;threeYearCagrPct:number|null;source:"street"|"unavailable"};
  consistency:{ok:boolean;notes:string[]};position?:{shares:number;avgCost:number;pnlPct:number;belowCost:boolean;weightPct?:number|null}|null;
};

const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
const num=(x:any,f=50)=>Number.isFinite(Number(x))?Number(x):f;
const uniq=(x:string[])=>[...new Set(x.filter(Boolean))];
const ol=(s:number):OutlookLabel=>s>=82?"STRONG BULLISH":s>=70?"BULLISH":s>=60?"CONSTRUCTIVE":s>=48?"NEUTRAL":s>=39?"CAUTIOUS":s>=28?"BEARISH":"STRONG BEARISH";

function analyst(c:any){
  const rs=Array.isArray(c?.recommendations)?c.recommendations:[];
  const score=(r:any)=>{if(!r)return 50;const sb=num(r.strongBuy,0),b=num(r.buy,0),h=num(r.hold,0),s=num(r.sell,0),ss=num(r.strongSell,0),t=sb+b+h+s+ss;return t?clamp((sb*100+b*80+h*50+s*20+ss*5)/t):50};
  const now=score(rs[0]),prior=score(rs[1]||rs[0]);
  return{score:Math.round(now),trend:Math.round(now-prior),total:rs[0]?num(rs[0].strongBuy,0)+num(rs[0].buy,0)+num(rs[0].hold,0)+num(rs[0].sell,0)+num(rs[0].strongSell,0):0};
}

function earnings(c:any){
  const xs=Array.isArray(c?.surprises)?c.surprises:[];
  if(!xs.length)return{score:50,trend:0};
  const f=(x:any)=>Number.isFinite(Number(x?.surprisePercent))?clamp(50+Number(x.surprisePercent)*1.1,12,90):50;
  const a=f(xs[0]),b=f(xs[1]),d=f(xs[2]);
  return{score:Math.round(a*.55+b*.3+d*.15),trend:Math.round(a-b)};
}

function archetype(context:any,raw:any){
  const industry=String(context?.profile?.finnhubIndustry||"").toLowerCase();
  const op=Number(raw.opMargin),fcf=Number(raw.fcf),rev=num(raw.revGrowth,0);
  if(industry.includes("bank")||industry.includes("insurance")||industry.includes("financial"))return"financial";
  if(industry.includes("biotech")||industry.includes("pharma"))return"biotech";
  if(industry.includes("energy")||industry.includes("mining")||industry.includes("metals"))return"cyclical";
  if(rev>=25&&(!Number.isFinite(op)||op<15))return"hypergrowth";
  if(Number.isFinite(fcf)&&fcf>0&&Number.isFinite(op)&&op>=15)return"compounder";
  return"general";
}

export function buildInvestorDecision({market,company,context,institutional,owns=false,position=null}:{market:any,company:any,context:any,institutional?:any,owns?:boolean,position?:PositionContext|null}):InvestorDecision|null{
  if(!market)return null;
  const raw=company?.rawMetrics||{};
  const base=num(company?.fundamentalSignal?.score,50),five=num(company?.fiveYearRecord?.score,base);
  const rev=num(raw.revGrowth,0),ni=num(raw.niGrowth,0),margin=Number(raw.opMargin),fcf=Number(raw.fcf),lev=Number(raw.leverage);
  const kind=archetype(context,raw);

  let financial=50+(Number.isFinite(fcf)?fcf>0?12:-14:0)+(Number.isFinite(margin)?clamp((margin-8)*.65,-14,14):0)+(Number.isFinite(lev)?lev<60?9:lev>85?-14:0:0);
  if(kind==="hypergrowth"&&Number.isFinite(margin)&&margin<0)financial-=5;
  financial=clamp(financial);

  let growth=clamp(50+clamp(rev*.65,-26,28)+clamp(ni*.18,-14,14));
  if(company?.fiveYearRecord?.revenueTrend==="Strong")growth=clamp(growth+12);
  if(company?.fiveYearRecord?.revenueTrend==="Weakening")growth=clamp(growth-16);

  const durability=clamp(five*.55+base*.25+financial*.20);
  const qualityWeights=kind==="hypergrowth"?{base:.28,financial:.20,durability:.22,growth:.30}:kind==="cyclical"?{base:.30,financial:.31,durability:.25,growth:.14}:{base:.34,financial:.28,durability:.24,growth:.14};
  const quality=clamp(base*qualityWeights.base+financial*qualityWeights.financial+durability*qualityWeights.durability+growth*qualityWeights.growth);

  const a=analyst(context),e=earnings(context),instEnabled=!!institutional?.enabled,inst=num(institutional?.institutional?.institutionalScore,50);
  const news=context?.summary?.tone;
  const catalysts=clamp(50+(news==="positive"?9:news==="negative"?-12:0)+(company?.filingRisk?-16:0));
  const revisions=clamp(50+a.trend*2.4+e.trend*.9);
  const forward=clamp(growth*.36+e.score*.24+revisions*.23+a.score*.17);
  const companyScore=Math.round(quality),companyLabel=companyScore>=82?"Exceptional":companyScore>=70?"Strong":companyScore>=55?"Average":"Weak";

  let tr=companyScore*.27+durability*.14+forward*.27+e.score*.11+a.score*.05+(instEnabled?inst:50)*.04+catalysts*.10;
  if(financial<35)tr-=12;if(forward<38)tr-=14;if(growth<32)tr-=10;if(financial<45&&growth<42)tr-=6;if(forward<45&&e.score<45)tr-=6;if(company?.filingRisk)tr-=5;if(financial>70&&forward>72&&growth>68)tr+=4;
  const thesisScore=Math.round(clamp(tr));
  const thesisLabel:InvestorDecision["thesisLabel"]=thesisScore>=74&&forward>=58&&companyScore>=58?"BULLISH":thesisScore<=42||forward<=35||financial<=30?"BEARISH":"NEUTRAL";

  const delta=(forward-50)*.38+e.trend*.55+a.trend+(instEnabled?(inst-50)*.06:0)+(catalysts-50)*.12;
  let thesisState:ThesisState=thesisScore<30?"Broken":delta<=-8?"Weakening":thesisScore>=61?"Intact":"Mixed";
  if(delta>=8)thesisState=thesisLabel==="BEARISH"?"Recovering":"Strengthening";

  const px=num(market.price,0),pt=context?.priceTarget||{},mean=Number(pt.targetMean),low=Number(pt.targetLow),high=Number(pt.targetHigh);
  const hasStreet=px>0&&Number.isFinite(mean)&&mean>0;
  const upside=hasStreet?(mean/px-1)*100:null;
  const valuation=hasStreet?clamp(50+(upside||0)*1.05,12,92):50;
  const valuationLabel:InvestorDecision["valuationLabel"]=!hasStreet?"Unclear":valuation>=78?"Deeply attractive":valuation>=64?"Attractive":valuation<38?"Expensive":"Fair";

  const risk=num(market?.scores?.risk,60),trend=num(market?.scores?.trend,50),momentum=num(market?.scores?.momentum,50),flow=num(market?.scores?.flow,50),technical=clamp(trend*.5+momentum*.25+flow*.25);
  const opportunityScore=Math.round(clamp(thesisScore*.53+valuation*.29+(100-risk)*.12+technical*.06));

  const hs:any[]=[
    ["3M",clamp(e.score*.20+revisions*.20+catalysts*.15+technical*.25+(100-risk)*.20),"Catalysts, revisions and near-term market structure."],
    ["6M",clamp(forward*.27+e.score*.18+revisions*.18+valuation*.14+technical*.10+companyScore*.13),"Forward estimates, earnings follow-through and valuation."],
    ["1Y",clamp(forward*.30+companyScore*.20+financial*.12+e.score*.10+revisions*.13+valuation*.15),"Forward growth, earnings power and valuation."],
    ["2Y",clamp(companyScore*.27+durability*.19+forward*.27+financial*.12+valuation*.10+catalysts*.05),"Business quality, durability and multi-year earnings."],
    ["3Y",clamp(companyScore*.31+durability*.24+growth*.20+financial*.13+forward*.12),"Durable economics, runway and compounding potential."]
  ];
  const horizons:HorizonOutlook[]=hs.map(([key,score,reason])=>({key,score:Math.round(score),label:ol(score),reason}));
  const bestHorizon=[...horizons].sort((x,y)=>y.score-x.score)[0]?.key||"1Y";

  const notes:string[]=[];
  if(thesisLabel==="BEARISH"&&thesisState==="Strengthening")notes.push("Bearish calls cannot be labelled Strengthening; use Recovering when evidence improves from a weak base.");
  if(thesisLabel==="BULLISH"&&forward<50)notes.push("Bullish headline requires forward evidence to be at least neutral.");
  if(thesisScore>=74&&companyScore<50)notes.push("High thesis conviction is capped when company quality is weak.");
  const consistency={ok:notes.length===0,notes};

  let action:InvestorDecision["action"];
  let actionReason="Thesis and timing are evaluated separately.";
  const pos=position&&px>0&&position.avgCost>0?{shares:position.shares,avgCost:position.avgCost,pnlPct:(px/position.avgCost-1)*100,belowCost:px<position.avgCost,weightPct:position.weightPct??null}:null;

  if(owns){
    if(thesisState==="Broken"||thesisScore<28){action="EXIT / REASSESS";actionReason="The thesis is materially impaired; cost basis should not anchor capital to a broken case."}
    else if(thesisLabel==="BEARISH"&&thesisScore<=35&&forward<38){action="REDUCE";actionReason="Forward evidence is weak enough that preserving capital can matter more than waiting for breakeven."}
    else if(pos?.belowCost&&thesisScore>=48){action=thesisState==="Weakening"?"HOLD / WATCH":"HOLD";actionReason="You are below cost, but the thesis is not broken. Do not realize a loss solely because price is weak."}
    else if(thesisState==="Weakening"&&thesisScore<55){action="HOLD / WATCH";actionReason="Evidence is weakening, but the sell threshold is not yet met. Watch the thesis breakers closely."}
    else if(thesisScore>=55){action="HOLD";actionReason=opportunityScore>=68?"The position remains investable; add only if valuation and timing also align.":"The thesis remains investable, but new capital does not have a strong enough edge here."}
    else{action="HOLD / WATCH";actionReason="Evidence is mixed. Avoid emotional selling until a fundamental sell condition is triggered."}
  }else{
    if(thesisState==="Broken"||thesisScore<30){action="AVOID";actionReason="The long-run evidence is too weak for new capital."}
    else if(thesisLabel==="BEARISH"||forward<36){action="AVOID";actionReason="Forward evidence is too weak even if the share price looks cheaper."}
    else if(thesisState==="Weakening"&&thesisScore<58){action="WAIT";actionReason="The thesis is weakening; wait for fundamental stabilization rather than buying a falling story."}
    else if(thesisScore>=82&&opportunityScore>=78&&companyScore>=74){action="STRONG BUY";actionReason="Business quality, forward thesis and current opportunity are unusually well aligned."}
    else if(thesisScore>=68&&opportunityScore>=64){action="ACCUMULATE";actionReason="The long-term thesis is constructive and the current opportunity is acceptable for staged buying."}
    else{action="WAIT";actionReason="The business may be investable, but valuation/timing does not provide a strong enough edge for new money."}
  }

  const drivers:string[]=[],risks:string[]=[],changed:string[]=[];
  if(companyScore>=70)drivers.push(`${companyLabel} business quality (${companyScore}/100).`);
  if(durability>=68)drivers.push("Multi-year evidence supports durable economics.");
  if(forward>=65)drivers.push("Forward growth, earnings and revisions are constructive.");
  if(e.score>=63)drivers.push("Recent earnings execution supports the thesis.");
  if(instEnabled&&inst>=62)drivers.push("Reported institutional ownership is supportive evidence.");
  if(financial<45)risks.push("Financial quality is a weak link.");
  if(forward<43)risks.push("Forward expectations are deteriorating.");
  if(company?.filingRisk)risks.push(company.filingRisk.label||"Financing/dilution risk requires review.");
  if(risk>=75)risks.push("Near-term market risk is elevated; this affects timing more than long-term quality.");
  if(valuationLabel==="Expensive")risks.push("Valuation leaves little room for execution mistakes.");
  if(a.trend>=6)changed.push("Analyst stance improved.");if(a.trend<=-6)changed.push("Analyst stance weakened.");
  if(e.trend>=6)changed.push("Earnings evidence improved.");if(e.trend<=-6)changed.push("Earnings evidence weakened.");
  if(Math.abs(num(market.changePct,0))>=8)changed.push(`Price moved ${num(market.changePct,0).toFixed(1)}%; opportunity changed, not company quality by itself.`);

  const breakers=[
    financial<45?"Cash generation, leverage or balance-sheet quality fails to improve enough to support the growth plan.":"Cash generation, margins or balance-sheet quality deteriorate materially from the current trajectory.",
    forward>=60?"Forward revenue/EPS expectations roll over for multiple revisions or management cuts guidance materially.":"Forward estimates and management guidance fail to confirm a durable growth case.",
    kind==="hypergrowth"?"Growth decelerates without enough margin/FCF improvement to justify the valuation.":kind==="cyclical"?"Cycle economics, utilization or realized pricing deteriorate enough to reset normalized earnings power.":"Competition, regulation, dilution or execution materially reduces long-run earnings power."
  ];

  const evidence=[company?.fundamentalSignal,company?.fiveYearRecord,context?.enabled,a.total>0,context?.surprises?.length,instEnabled].filter(Boolean).length;
  const confidence=Math.round(clamp(40+evidence*9-(company?.filingRisk?3:0)));
  const stateText=thesisState==="Recovering"?"recovering from a weak base":thesisState.toLowerCase();
  const oneLine=thesisLabel==="BULLISH"?`${companyLabel} business with a ${stateText} investment thesis. ${valuationLabel==="Unclear"?"Independent valuation evidence is incomplete.":`Today's valuation is ${valuationLabel.toLowerCase()}.`}`:thesisLabel==="BEARISH"?`The investment case is weak, although evidence may be ${stateText}. A cheaper price alone does not repair poor forward economics.`:`Evidence is mixed. NIVORA needs stronger business/forward confirmation or a better valuation before raising conviction.`;

  const expectedReturn={oneYearPct:hasStreet?Number((upside||0).toFixed(1)):null,threeYearCagrPct:null,source:hasStreet?"street" as const:"unavailable" as const};
  return{companyScore,thesisScore,opportunityScore,confidence,companyLabel,thesisLabel,thesisState,valuationLabel,action,actionReason,horizon:"3 months → 3 years",oneLine,drivers:uniq(drivers).slice(0,5),risks:uniq(risks).slice(0,5),breakers,changed:uniq(changed).slice(0,5),factors:{quality:companyScore,durability:Math.round(durability),growth:Math.round(growth),forward:Math.round(forward),financial:Math.round(financial),earnings:Math.round(e.score),revisions:Math.round(revisions),analysts:Math.round(a.score),institutions:Math.round(inst),catalysts:Math.round(catalysts),valuation:Math.round(valuation),technicalConfirmation:Math.round(technical),risk:Math.round(risk)},horizons,bestHorizon,streetTarget:hasStreet?{mean:Number(mean.toFixed(2)),low:Number.isFinite(low)?Number(low.toFixed(2)):undefined,high:Number.isFinite(high)?Number(high.toFixed(2)):undefined,upsidePct:Number((upside||0).toFixed(1))}:null,expectedReturn,consistency,position:pos};
}
