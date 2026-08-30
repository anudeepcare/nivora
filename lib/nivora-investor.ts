export type InvestorDecision={
  companyScore:number; thesisScore:number; opportunityScore:number; confidence:number;
  companyLabel:string; thesisLabel:"BULLISH"|"NEUTRAL"|"BEARISH"; thesisState:"Strengthening"|"Intact"|"Mixed"|"Weakening"|"Broken";
  valuationLabel:"Deeply attractive"|"Attractive"|"Fair"|"Expensive"|"Unclear";
  action:"STRONG BUY OPPORTUNITY"|"ACCUMULATE"|"HOLD"|"WATCH"|"REDUCE"|"EXIT / REASSESS";
  horizon:string; oneLine:string; drivers:string[]; risks:string[]; breakers:string[]; changed:string[];
  factors:Record<string,number>; streetTarget?:{mean:number;low?:number;high?:number;upsidePct:number}|null;
};
const clamp=(x:number,a=0,b=100)=>Math.max(a,Math.min(b,x));
const num=(x:any,f=50)=>Number.isFinite(Number(x))?Number(x):f;
const uniq=(xs:string[])=>[...new Set(xs.filter(Boolean))];

function analystEvidence(context:any){
  const recs=Array.isArray(context?.recommendations)?context.recommendations:[];
  const latest=recs[0];
  if(!latest)return {score:50,trend:0,total:0};
  const scoreOne=(r:any)=>{
    const sb=num(r?.strongBuy,0),b=num(r?.buy,0),h=num(r?.hold,0),s=num(r?.sell,0),ss=num(r?.strongSell,0),t=sb+b+h+s+ss;
    return t?clamp((sb*100+b*80+h*50+s*20+ss*5)/t):50;
  };
  const now=scoreOne(latest),prior=recs[1]?scoreOne(recs[1]):now;
  const total=num(latest.strongBuy,0)+num(latest.buy,0)+num(latest.hold,0)+num(latest.sell,0)+num(latest.strongSell,0);
  return {score:Math.round(now),trend:Math.round(now-prior),total};
}

function earningsEvidence(context:any){
  const xs=Array.isArray(context?.surprises)?context.surprises:[];
  if(!xs.length)return {score:50,detail:"Earnings history is limited."};
  let weighted=0,den=0;
  xs.slice(0,4).forEach((x:any,i:number)=>{
    const w=4-i; const actual=Number(x.actual),estimate=Number(x.estimate),surprise=Number(x.surprisePercent);
    let s=50;
    if(Number.isFinite(surprise))s=clamp(50+surprise*1.35,15,90);
    else if(Number.isFinite(actual)&&Number.isFinite(estimate)&&estimate!==0)s=clamp(50+((actual/estimate)-1)*100*1.2,15,90);
    weighted+=s*w;den+=w;
  });
  const score=Math.round(weighted/(den||1));
  return {score,detail:score>=65?"Recent earnings execution has been supportive.":score<42?"Recent earnings execution has been weak.":"Recent earnings execution is mixed."};
}

export function buildInvestorDecision({market,company,context,institutional,owns=false}:{market:any,company:any,context:any,institutional?:any,owns?:boolean}):InvestorDecision|null{
  if(!market)return null;
  const business=num(company?.fundamentalSignal?.score,50);
  const five=num(company?.fiveYearRecord?.score,business);
  const raw=company?.rawMetrics||{};
  const revGrowth=num(raw.revGrowth,0),niGrowth=num(raw.niGrowth,0),opMargin=Number(raw.opMargin),fcf=Number(raw.fcf),leverage=Number(raw.leverage);

  let financial=50;
  if(Number.isFinite(fcf))financial+=fcf>0?12:-12;
  if(Number.isFinite(opMargin))financial+=clamp((opMargin-8)*.65,-12,14);
  if(Number.isFinite(leverage))financial+=leverage<60?9:leverage>85?-12:0;
  financial=clamp(financial);

  let growth=50;
  growth+=clamp(revGrowth*.65,-24,28);
  growth+=clamp(niGrowth*.18,-12,14);
  if(company?.fiveYearRecord?.revenueTrend==="Strong")growth+=12;
  else if(company?.fiveYearRecord?.revenueTrend==="Weakening")growth-=14;
  growth=clamp(growth);

  const analyst=analystEvidence(context);
  const earnings=earningsEvidence(context);
  const instEnabled=!!institutional?.enabled;
  const inst=num(institutional?.institutional?.institutionalScore,50);
  const newsTone=context?.summary?.tone;
  const catalyst=clamp(50+(newsTone==="positive"?10:newsTone==="negative"?-10:0)+(company?.filingRisk?-16:0));

  // Company quality deliberately excludes current price and technical timing.
  const companyScore=Math.round(clamp(business*.38+five*.24+financial*.23+growth*.15));
  const companyLabel=companyScore>=82?"Exceptional":companyScore>=70?"Strong":companyScore>=55?"Average":"Weak";

  // Thesis is about the future. Price action is not allowed to dominate or rewrite it.
  const thesisScore=Math.round(clamp(companyScore*.34+growth*.22+earnings.score*.15+analyst.score*.12+(instEnabled?inst:50)*.08+catalyst*.09));
  const thesisLabel:InvestorDecision["thesisLabel"]=thesisScore>=68?"BULLISH":thesisScore<43?"BEARISH":"NEUTRAL";
  const forwardDelta=(growth-50)*.30+(earnings.score-50)*.28+analyst.trend*.85+(instEnabled?(inst-50)*.12:0)+(catalyst-50)*.20;
  const thesisState:InvestorDecision["thesisState"]=thesisScore<32?"Broken":forwardDelta>=8?"Strengthening":forwardDelta<=-9?"Weakening":thesisScore>=62?"Intact":"Mixed";

  // Valuation/opportunity is where price belongs. No fabricated intrinsic value from current price.
  const px=num(market?.price,0); const pt=context?.priceTarget||{}; const targetMean=Number(pt.targetMean),targetLow=Number(pt.targetLow),targetHigh=Number(pt.targetHigh);
  const hasStreet=px>0&&Number.isFinite(targetMean)&&targetMean>0;
  const upside=hasStreet?((targetMean/px)-1)*100:null;
  const valuationScore=hasStreet?clamp(50+(upside||0)*1.25,15,92):50;
  const valuationLabel:InvestorDecision["valuationLabel"]=!hasStreet?"Unclear":valuationScore>=78?"Deeply attractive":valuationScore>=64?"Attractive":valuationScore<38?"Expensive":"Fair";
  const drawdown=Math.abs(Math.min(0,num(market?.performance?.oneYearPct,0)));
  const priceDislocation=clamp(50+Math.min(26,drawdown*.55)+(num(market?.performance?.rangePositionPct,50)<35?10:0)-(num(market?.scores?.extension,50)>78?12:0));
  const safety=100-num(market?.scores?.risk,60);
  const technicalConfirmation=clamp(num(market?.scores?.trend,50)*.55+num(market?.scores?.momentum,50)*.25+num(market?.scores?.flow,50)*.20);
  const opportunityScore=Math.round(clamp(thesisScore*.45+valuationScore*.25+priceDislocation*.15+safety*.10+technicalConfirmation*.05));

  let action:InvestorDecision["action"];
  if(thesisState==="Broken"||thesisScore<34)action=owns?"EXIT / REASSESS":"WATCH";
  else if(thesisState==="Weakening"&&thesisScore<52)action=owns?"REDUCE":"WATCH";
  else if(thesisScore>=80&&opportunityScore>=80)action="STRONG BUY OPPORTUNITY";
  else if(thesisScore>=68&&opportunityScore>=68)action="ACCUMULATE";
  else if(owns&&thesisScore>=58)action="HOLD";
  else action="WATCH";

  const drivers:string[]=[]; const risks:string[]=[]; const breakers:string[]=[]; const changed:string[]=[];
  if(companyScore>=70)drivers.push(`${companyLabel} company quality (${companyScore}/100).`);
  if(growth>=65)drivers.push("Forward growth evidence is constructive.");
  if(earnings.score>=63)drivers.push("Recent earnings execution supports the thesis.");
  if(analyst.total>=3&&analyst.score>=65)drivers.push("Analyst consensus is constructive.");
  if(instEnabled&&inst>=62)drivers.push("Reported institutional ownership is supportive versus the prior filing period.");
  if(valuationLabel==="Attractive"||valuationLabel==="Deeply attractive")drivers.push(`Current valuation looks ${valuationLabel.toLowerCase()} versus the available external target evidence.`);
  if(financial<45)risks.push("Financial quality is a weak link.");
  if(growth<43)risks.push("Growth trajectory is weakening.");
  if(earnings.score<42)risks.push("Recent earnings execution is weak.");
  if(company?.filingRisk)risks.push(company.filingRisk.label||"Financing/dilution risk requires review.");
  if(instEnabled&&inst<40)risks.push("Delayed institutional filings show meaningful reduction.");
  if(num(market?.scores?.risk,60)>=75)risks.push("Near-term market/volatility risk is elevated, even if the long-term thesis is intact.");
  if(analyst.trend>=6)changed.push("Analyst stance improved versus the prior observation.");
  if(analyst.trend<=-6)changed.push("Analyst stance weakened versus the prior observation.");
  if(newsTone==="positive")changed.push("Recent material news is supportive.");
  if(newsTone==="negative")changed.push("Recent material news is a headwind.");
  if(Math.abs(num(market?.changePct,0))>=8)changed.push(`Price moved ${num(market?.changePct,0).toFixed(1)}% today; this changes valuation/timing, not company quality by itself.`);
  breakers.push("A material deterioration in revenue, margins, cash generation or balance-sheet quality.");
  breakers.push("Forward estimates/guidance fall enough to invalidate the growth case.");
  breakers.push("A major competitive, regulatory, financing or execution development changes the business economics.");

  const evidenceSources=[company?.fundamentalSignal,company?.fiveYearRecord,context?.enabled,analyst.total>0,context?.surprises?.length,instEnabled].filter(Boolean).length;
  const confidence=Math.round(clamp(42+evidenceSources*8-(company?.filingRisk?2:0)));
  const oneLine=thesisLabel==="BULLISH"
    ? `${companyLabel} business evidence with a ${thesisState.toLowerCase()} long-term thesis. ${valuationLabel==="Unclear"?"Valuation evidence is incomplete.":`Valuation is ${valuationLabel.toLowerCase()}.`}`
    : thesisLabel==="BEARISH"
      ? `The long-term thesis is ${thesisState.toLowerCase()}; a lower price alone is not enough to make this attractive.`
      : `The long-term evidence is mixed. NIVORA needs a clearer improvement in business/forward evidence before raising conviction.`;

  return {companyScore,thesisScore,opportunityScore,confidence,companyLabel,thesisLabel,thesisState,valuationLabel,action,horizon:"6–36 months",oneLine,
    drivers:uniq(drivers).slice(0,4),risks:uniq(risks).slice(0,4),breakers:uniq(breakers).slice(0,3),changed:uniq(changed).slice(0,4),
    factors:{quality:companyScore,growth:Math.round(growth),financial:Math.round(financial),earnings:Math.round(earnings.score),analysts:Math.round(analyst.score),institutions:Math.round(inst),catalysts:Math.round(catalyst),valuation:Math.round(valuationScore),technicalConfirmation:Math.round(technicalConfirmation),risk:Math.round(num(market?.scores?.risk,60))},
    streetTarget:hasStreet?{mean:Number(targetMean.toFixed(2)),low:Number.isFinite(targetLow)?Number(targetLow.toFixed(2)):undefined,high:Number.isFinite(targetHigh)?Number(targetHigh.toFixed(2)):undefined,upsidePct:Number((upside||0).toFixed(1))}:null
  };
}
