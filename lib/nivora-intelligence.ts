import {marketRegime,confidenceCalibration,clamp as coreClamp} from "@/lib/nivora-core";
export type NivoraMode="now"|"swing"|"long"|"own";

const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n));
const n=(x:any,f=50)=>Number.isFinite(Number(x))?Number(x):f;
const uniq=(xs:string[])=>[...new Set(xs.filter(Boolean))];

export function buildNivoraIntelligence({
  market,company,context,options,institutional,mode="now"
}:{market:any,company:any,context:any,options?:any,institutional?:any,mode?:NivoraMode}){
  if(!market)return null;
  const regime=marketRegime(market);

  const business=n(company?.fundamentalSignal?.score,
    company?.fundamentalSignal?.label==="Strong"?78:company?.fundamentalSignal?.label?.includes("Weak")?38:52);
  const valuation=(()=>{
    const pe=Number(company?.metrics?.peRatio??company?.peRatio);
    const growth=Number(company?.metrics?.revenueGrowth??company?.revenueGrowth);
    if(Number.isFinite(pe)&&pe>0){
      let v=pe<15?78:pe<25?68:pe<40?56:pe<65?44:34;
      if(Number.isFinite(growth)&&growth>20)v+=8;
      return clamp(v);
    }
    return 52;
  })();
  const timing=n(market?.scores?.entry,50);
  const trend=n(market?.scores?.trend,50);
  const momentum=n(market?.scores?.momentum,50);
  const flow=n(market?.scores?.flow,50);
  const risk=n(market?.scores?.risk,60);
  const structure=n(market?.scores?.structure,50);
  const extension=n(market?.scores?.extension,50);

  const newsTone=context?.summary?.tone;
  const newsScore=newsTone==="positive"?68:newsTone==="negative"?35:50;
  const earningsSoon=(()=>{
    const d=context?.earnings?.date;if(!d)return false;
    const days=(new Date(d).getTime()-Date.now())/86400000;
    return days>=0&&days<=14;
  })();
  const filingRisk=!!company?.filingRisk;

  let catalystScore=50;
  catalystScore += newsTone==="positive"?12:newsTone==="negative"?-12:0;
  catalystScore += filingRisk?-18:0;
  catalystScore += earningsSoon?-6:0;
  catalystScore=clamp(catalystScore);

  let derivativeScore=50;
  if(options?.enabled){
    if(options.gammaProxy?.startsWith("Positive"))derivativeScore+=8;
    if(options.gammaProxy?.startsWith("Negative"))derivativeScore-=8;
    if(options.putCallOI!=null){
      if(options.putCallOI>1.35)derivativeScore-=7;
      else if(options.putCallOI<0.70)derivativeScore+=5;
    }
  }
  derivativeScore=clamp(derivativeScore);

  const institutionalEnabled=!!institutional?.enabled;
  const institutionalScore=institutionalEnabled
    ? clamp(n(institutional?.institutional?.institutionalScore,50))
    : 50;

  const latestRecommendation=Array.isArray(context?.recommendations)?context.recommendations[0]:null;
  const analystTotal=latestRecommendation
    ? n(latestRecommendation.strongBuy,0)+n(latestRecommendation.buy,0)+n(latestRecommendation.hold,0)+n(latestRecommendation.sell,0)+n(latestRecommendation.strongSell,0)
    : 0;
  const analystScore=analystTotal>0
    ? clamp((n(latestRecommendation.strongBuy,0)*100+n(latestRecommendation.buy,0)*80+n(latestRecommendation.hold,0)*50+n(latestRecommendation.sell,0)*20)/analystTotal)
    : 50;

  const weights=mode==="long"
    ?{business:.30,trend:.15,timing:.09,momentum:.08,flow:.05,catalyst:.05,deriv:.03,safety:.10,inst:.07,analyst:.08}
    :mode==="own"
      ?{business:.25,trend:.14,timing:.08,momentum:.07,flow:.05,catalyst:.07,deriv:.03,safety:.19,inst:.06,analyst:.06}
      :mode==="swing"
        ?{business:.10,trend:.21,timing:.19,momentum:.14,flow:.10,catalyst:.05,deriv:.05,safety:.07,inst:.04,analyst:.05}
        :{business:.10,trend:.17,timing:.24,momentum:.14,flow:.10,catalyst:.06,deriv:.05,safety:.07,inst:.03,analyst:.04};

  const baseComposite=
    business*weights.business+trend*weights.trend+timing*weights.timing+
    momentum*weights.momentum+flow*weights.flow+catalystScore*weights.catalyst+
    derivativeScore*weights.deriv+(100-risk)*weights.safety+institutionalScore*weights.inst+analystScore*weights.analyst;
  const valuationAdj=mode==="long"?(valuation-50)*.08:(valuation-50)*.025;
  const regimeAdj=(regime.score-50)*(mode==="now"?.08:mode==="swing"?.07:.035);
  const composite=clamp(baseComposite+valuationAdj+regimeAdj);

  const positives:string[]=[];
  const concerns:string[]=[];
  if(business>=70)positives.push("Business evidence is strong.");
  else if(business<45)concerns.push("Business quality is a weak link in the thesis.");
  if(trend>=65)positives.push("Price trend is constructive.");
  else if(trend<40)concerns.push("Price trend is still weak.");
  if(timing>=65)positives.push("Entry quality is attractive.");
  else if(timing<48)concerns.push("Today's entry quality is poor.");
  if(momentum>=65)positives.push("Momentum is confirming the move.");
  else if(momentum<42)concerns.push("Momentum confirmation is weak.");
  if(flow>=62)positives.push("Volume/flow is confirming.");
  else if(flow<42)concerns.push("Participation/flow is not confirming strongly.");
  if(extension>=70)concerns.push("Price is extended; chase risk is elevated.");
  if(risk>=72)concerns.push("Downside/volatility risk is high.");
  if(newsTone==="positive")positives.push("Recent material news is supportive.");
  if(newsTone==="negative")concerns.push("Recent news flow is cautious.");
  if(filingRisk)concerns.push("A financing/dilution-related filing needs review.");
  if(earningsSoon)concerns.push("Earnings are close enough to create event risk.");
  if(options?.enabled&&options.gammaProxy?.startsWith("Positive"))positives.push("Options positioning proxy is relatively supportive.");
  if(options?.enabled&&options.gammaProxy?.startsWith("Negative"))concerns.push("Options positioning proxy is a short-term headwind.");
  if(institutionalEnabled&&institutionalScore>=65)positives.push("Reported institutional holdings are broadly constructive versus the prior filing period.");
  if(institutionalEnabled&&institutionalScore<42)concerns.push("Reported institutional holdings show a meaningful reduction versus the prior filing period.");
  if(analystTotal>=3&&analystScore>=68)positives.push("Wall Street analyst consensus is broadly constructive.");
  if(analystTotal>=3&&analystScore<38)concerns.push("Wall Street analyst consensus is cautious.");

  const contradictions:string[]=[];
  if(business>=70&&timing<48)contradictions.push("Great business, poor entry: fundamentals and timing disagree.");
  if(trend>=70&&extension>=70)contradictions.push("Strong trend, stretched price: strength is real but chase risk is elevated.");
  if(trend>=65&&flow<42)contradictions.push("Trend is strong, but volume/flow confirmation is weak.");
  if(newsTone==="positive"&&risk>=72)contradictions.push("Positive news is not enough to offset high technical risk.");
  if(business<45&&trend>=70)contradictions.push("Price strength is outrunning weak business evidence.");
  if(options?.enabled&&options.gammaProxy?.startsWith("Negative")&&trend>=65)contradictions.push("Underlying trend and options-positioning proxy are sending different signals.");
  if(institutionalEnabled&&institutionalScore<42&&trend>=65)contradictions.push("Price trend is strong while delayed institutional filings show net reduction.");

  const evidenceCount=[
    market?1:0,company?.fundamentalSignal?1:0,company?.fiveYearRecord?1:0,
    context?.enabled?1:0,context?.earnings?1:0,analystTotal>0?1:0,options?.enabled?1:0,institutionalEnabled?1:0
  ].reduce((a,b)=>a+b,0);
  const rawConfidence=clamp(45+evidenceCount*8);
  const evidenceQuality=clamp(42+evidenceCount*9-(filingRisk?2:0));
  const confidence=confidenceCalibration(rawConfidence,evidenceQuality,contradictions.length);
  const confidenceLabel=confidence>=80?"High":confidence>=62?"Good":confidence>=45?"Moderate":"Limited";

  const thesisLabel=
    composite>=78&&risk<70?"High-conviction watch":
    composite>=68?"Constructive":
    composite>=56?"Selective":
    composite>=45?"Mixed":"Weak";

  const action=
    timing>=68&&risk<70&&extension<72?"BUY ZONE / SELECTIVE":
    timing>=58&&trend>=55?"START SMALL / WAIT":
    trend>=65&&extension>=70?"DON'T CHASE":
    trend<40?"WAIT FOR STABILITY":"WAIT / WATCH";

  const bullTriggers=uniq([
    market?.levels?.breakout!=null?`Strong close/retest above $${market.levels.breakout}`:"",
    flow<60?"Volume/flow improves above normal participation":"",
    momentum<60?"Momentum moves into confirming territory":"",
    business<70?"Business quality/fundamental trend improves":"",
    newsTone==="negative"?"Material news tone improves":""
  ]).slice(0,4);
  const bearTriggers=uniq([
    market?.levels?.support!=null?`Loss of support near $${market.levels.support}`:"",
    market?.levels?.invalidation!=null?`Technical thesis weakens below $${market.levels.invalidation}`:"",
    filingRisk?"Financing/dilution risk expands":"",
    earningsSoon?"Earnings/guidance breaks the current thesis":"",
    business<50?"Fundamentals deteriorate further":""
  ]).slice(0,4);

  const bullTarget=market?.levels?.breakout??market?.levels?.resistance??market?.price;
  const bearLevel=market?.levels?.invalidation??market?.levels?.majorSupport??market?.price;
  const baseLevel=market?.levels?.support??market?.price;

  const scenarios=[
    {name:"Bull case",probability:clamp(Math.round(composite*.72+(100-risk)*.18+10),10,80),level:bullTarget,logic:bullTriggers[0]||"Trend, entry and catalysts align."},
    {name:"Base case",probability:clamp(Math.round(72-Math.abs(composite-58)*.45),15,70),level:baseLevel,logic:"Price digests while the market waits for cleaner confirmation."},
    {name:"Bear case",probability:clamp(Math.round(risk*.55+(100-business)*.18+(filingRisk?12:0)),10,75),level:bearLevel,logic:bearTriggers[0]||"Support fails and risk expands."}
  ];
  const total=scenarios.reduce((a,x)=>a+x.probability,0)||1;
  for(const x of scenarios)x.probability=Math.round(x.probability/total*100);

  const biggestPositive=positives[0]||"No single positive dominates the evidence.";
  const biggestRisk=concerns[0]||"No major risk dominates the current evidence.";
  const nextDecision=bullTriggers[0]||bearTriggers[0]||"Wait for new price, fundamental or catalyst evidence.";

  const optionsUsable=!!options?.enabled && Number(options?.liquidityQuality??60)>=45;
  const bestExpression=!optionsUsable
    ?{type:"Shares / no leverage",label:"Options not preferred",reason:"Options evidence or liquidity is not strong enough to justify leverage."}
    :risk>=75
      ?{type:"Shares",label:"Reduce leverage",reason:"Current risk is too high for NIVORA to prefer leveraged exposure."}
      :mode==="long"&&business>=68
        ?{type:"Shares or LEAPS",label:"Long-duration expression",reason:"The thesis is long-duration; avoid paying excessive short-dated theta."}
        :timing>=65&&trend>=60
          ?{type:"Shares / balanced calls",label:"Selective leverage",reason:"Timing and trend are aligned enough to consider measured leverage."}
          :{type:"Shares",label:"Wait on leverage",reason:"Underlying thesis may be valid, but options timing is not sufficiently aligned."};

  return {
    score:Math.round(composite),thesisLabel,action,confidence:Math.round(confidence),confidenceLabel,
    regime,valuation:Math.round(valuation),evidenceQuality:Math.round(evidenceQuality),bestExpression,
    dimensions:{
      business:Math.round(business),valuation:Math.round(valuation),timing:Math.round(timing),trend:Math.round(trend),
      momentum:Math.round(momentum),flow:Math.round(flow),catalysts:Math.round(catalystScore),
      institutional:Math.round(institutionalScore),analyst:Math.round(analystScore),derivatives:Math.round(derivativeScore),risk:Math.round(risk)
    },
    positives:uniq(positives).slice(0,6),concerns:uniq(concerns).slice(0,6),
    contradictions:uniq(contradictions).slice(0,5),
    biggestPositive,biggestRisk,nextDecision,bullTriggers,bearTriggers,scenarios,
    missing:[
      !company?.fundamentalSignal?"standardized fundamentals":"",
      !company?.fiveYearRecord?"multi-year financial history":"",
      !context?.enabled?"live news/earnings context":"",
      !institutionalEnabled&&market?.assetType!=="crypto"?"reported institutional holdings":"",
      !options?.enabled?"options positioning":""
    ].filter(Boolean),
    explanation:`NIVORA's thesis score synthesizes business quality, trend, entry quality, momentum, flow, catalysts, analyst consensus, delayed institutional holdings, derivatives context and downside risk with different weights for ${mode==="long"?"long-term":mode==="own"?"owned-position":mode==="swing"?"swing":"current-entry"} analysis.`
  };
}
