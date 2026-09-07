import{scoreLabel}from"./score-label";
import{classifySecurity}from"./classification";
export type Factor={score:number|null;label:string;coverage:number;reason:string};
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const finite=(x:any)=>x!==null&&x!==undefined&&x!==""&&typeof x!=="boolean"&&Number.isFinite(Number(x));
const renormal=(xs:{value:number;weight:number;available?:boolean}[])=>{const a=xs.filter(x=>x.available!==false&&finite(x.value));const w=a.reduce((s,x)=>s+x.weight,0);return w?clamp(a.reduce((s,x)=>s+x.value*x.weight,0)/w):null};
const factor=(score:number|null,coverage:number,reason:string):Factor=>score==null?{score:null,label:"N/A",coverage,reason}:{score:Math.round(score),label:scoreLabel(score),coverage,reason};

export function buildCanonicalFactors({market,company,context,institutional}:any){
 const raw=company?.rawMetrics||{}, cls=classifySecurity({assetType:market?.assetType||company?.assetType,name:company?.name,description:context?.profile?.description,industry:context?.profile?.finnhubIndustry,profile:context?.profile,profitable:finite(raw?.netIncome)?Number(raw.netIncome)>0:undefined});
 const latestQuarter=company?.latestQuarter||null, guidance=context?.guidance||company?.guidance||null;
 if(cls.assetClass==="ETF"){
  const trend=finite(market?.scores?.trend)?Number(market.scores.trend):null, timing=finite(market?.scores?.timing)?Number(market.scores.timing):null;
  return{...cls,business:factor(null,0,"Company-level business quality is not applicable to an ETF."),financial:factor(null,0,"Company financial quality is not applicable to an ETF."),growth:factor(null,0,"Use constituent/index growth rather than issuer company growth."),earnings:factor(null,0,"Use constituent earnings trend rather than issuer earnings."),future:factor(renormal([{value:trend??0,weight:.5,available:trend!=null},{value:timing??0,weight:.5,available:timing!=null}]),trend!=null||timing!=null?50:0,"ETF future evidence uses index/market evidence; unavailable constituent evidence is not replaced with 50."),coverage:trend!=null||timing!=null?50:0};
 }
 const current=finite(company?.fundamentalSignal?.currentScore)?Number(company.fundamentalSignal.currentScore):null;
 const record=finite(company?.fiveYearRecord?.score)?Number(company.fiveYearRecord.score):null;
 const rev=finite(raw.revGrowth)?Number(raw.revGrowth):null, op=finite(raw.opMargin)?Number(raw.opMargin):null, fcf=finite(raw.fcf)?Number(raw.fcf):null, lev=finite(raw.leverage)?Number(raw.leverage):null;
 const qGrowth=finite(latestQuarter?.revenueGrowth)?Number(latestQuarter.revenueGrowth):null;
 const qMargin=finite(latestQuarter?.opMargin)?Number(latestQuarter.opMargin):null;
 const growthNow=renormal([{value:rev==null?0:clamp(50+rev*.7),weight:.45,available:rev!=null},{value:qGrowth==null?0:clamp(50+qGrowth*.55),weight:.55,available:qGrowth!=null}]);
 const financialNow=renormal([{value:op==null?0:clamp(50+(op-8)*.8),weight:.3,available:op!=null},{value:fcf==null?0:fcf>0?72:35,weight:.3,available:fcf!=null},{value:lev==null?0:lev<60?70:lev>85?30:52,weight:.2,available:lev!=null},{value:qMargin==null?0:clamp(50+(qMargin-8)*.8),weight:.2,available:qMargin!=null}]);
 const business=renormal([{value:current??0,weight:.30,available:current!=null},{value:record??0,weight:.25,available:record!=null},{value:financialNow??0,weight:.25,available:financialNow!=null},{value:growthNow??0,weight:.20,available:growthNow!=null}]);
 const surprises=Array.isArray(context?.surprises)?context.surprises:[];
 const surpriseVals=surprises.slice(0,3).map((x:any)=>finite(x?.surprisePercent)?clamp(50+Number(x.surprisePercent)*.8):null).filter((x:any)=>x!=null);
 const earningsScore=renormal([{value:surpriseVals[0]??0,weight:.55,available:surpriseVals.length>0},{value:surpriseVals[1]??0,weight:.3,available:surpriseVals.length>1},{value:surpriseVals[2]??0,weight:.15,available:surpriseVals.length>2},{value:qMargin==null?0:clamp(50+(qMargin-8)*.8),weight:.25,available:qMargin!=null}]);
 const guideScore=finite(guidance?.score)?Number(guidance.score):null;
 const future=renormal([{value:growthNow??0,weight:.40,available:growthNow!=null},{value:earningsScore??0,weight:.25,available:earningsScore!=null},{value:guideScore??0,weight:.25,available:guideScore!=null},{value:record??0,weight:.10,available:record!=null}]);
 const available=[current,record,growthNow,financialNow,earningsScore,guideScore].filter(x=>x!=null).length;
 return{...cls,business:factor(business,Math.round(available/6*100),"Current fundamentals, latest-quarter evidence and multi-year durability are combined without inventing missing inputs."),financial:factor(financialNow,Math.round([op,fcf,lev,qMargin].filter(x=>x!=null).length/4*100),"Cash economics, margins and balance-sheet evidence."),growth:factor(growthNow,rev!=null&&qGrowth!=null?100:rev!=null||qGrowth!=null?50:0,"Annual and latest-quarter growth are separated and then renormalized over available evidence."),earnings:factor(earningsScore,surpriseVals.length||qMargin!=null?70:0,"Latest earnings execution; missing surprise/guidance evidence remains unavailable."),future:factor(future,guideScore!=null?90:60,"Forward runway combines growth, earnings execution and explicit guidance when available."),coverage:Math.round(available/6*100)};
}
