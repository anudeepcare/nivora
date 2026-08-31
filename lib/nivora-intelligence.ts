import {buildInvestorDecision} from "@/lib/nivora-investor";
import {marketRegime} from "@/lib/nivora-core";
export type NivoraMode="now"|"swing"|"long"|"own";
const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n));

/**
 * V54 compatibility adapter.
 * There is one canonical investment engine: buildInvestorDecision().
 * Legacy research panels consume this adapter so the UI cannot silently run a second scoring brain.
 */
export function buildNivoraIntelligence({market,company,context,options,institutional,mode="now"}:{market:any,company:any,context:any,options?:any,institutional?:any,mode?:NivoraMode}){
  const d=buildInvestorDecision({market,company,context,institutional,owns:mode==="own",position:null});
  if(!d)return null;
  const trend=Number(market?.scores?.trend??50),momentum=Number(market?.scores?.momentum??50),flow=Number(market?.scores?.flow??50),risk=Number(market?.scores?.risk??60);
  let derivativeScore=50;
  if(options?.enabled){if(String(options?.gammaProxy||"").startsWith("Positive"))derivativeScore+=7;if(String(options?.gammaProxy||"").startsWith("Negative"))derivativeScore-=7;const pc=Number(options?.putCallOI);if(Number.isFinite(pc)){if(pc>1.35)derivativeScore-=6;else if(pc<.7)derivativeScore+=4}}
  derivativeScore=clamp(derivativeScore);
  const contradictions=[...d.consistency.notes];
  if(d.thesisLabel==="BULLISH"&&d.timing.label==="OVEREXTENDED")contradictions.push("Long-term thesis is bullish while current price is overextended.");
  if(d.streetView.label==="Positive"&&d.thesisLabel==="BEARISH")contradictions.push("Wall Street is positive while NIVORA's fundamental thesis is bearish; review the reasons rather than averaging the disagreement away.");
  const positives=d.drivers;
  const concerns=d.risks;
  const nextDecision=d.breakers[0]||d.timing.reason;
  return{
    score:d.thesisScore,thesisLabel:d.thesisLabel==="BULLISH"?"Constructive":d.thesisLabel==="BEARISH"?"Weak":"Mixed",action:d.action,
    confidence:d.dataCompleteness,confidenceLabel:d.dataCompleteness>=80?"High coverage":d.dataCompleteness>=60?"Good coverage":"Limited coverage",
    regime:marketRegime(market),valuation:d.factors.valuation,evidenceQuality:d.dataCompleteness,
    bestExpression:{type:"Shares / no leverage",label:"Leverage not part of thesis",reason:"V54 treats options as supporting short-horizon positioning evidence, never as a long-term thesis generator."},
    dimensions:{business:d.companyScore,valuation:d.factors.valuation,timing:d.factors.timing,trend:Math.round(trend),momentum:Math.round(momentum),flow:Math.round(flow),catalysts:d.factors.catalysts,institutional:d.factors.institutional,analyst:d.streetView.score??50,derivatives:Math.round(derivativeScore),risk:Math.round(risk)},
    positives,concerns,contradictions,biggestPositive:positives[0]||"No single positive dominates the evidence.",biggestRisk:concerns[0]||"No single risk dominates the evidence.",nextDecision,
    bullTriggers:d.zones.filter(z=>z.kind==="starter"||z.kind==="accumulate").map(z=>z.low&&z.high?`${z.label}: $${z.low.toFixed(2)}–$${z.high.toFixed(2)}`:z.label).slice(0,3),
    bearTriggers:d.breakers.slice(0,3),scenarios:[],missing:[],explanation:"V54 uses the same canonical thesis engine for the stock page, deep research and compatibility panels. Technicals influence timing; they do not create the fundamental thesis."
  };
}
