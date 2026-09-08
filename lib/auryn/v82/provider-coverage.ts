export type HistoryCoverageCode="OK"|"PROVIDER_COVERAGE_MISSING"|"PROVIDER_RATE_LIMITED"|"MARKET_HISTORY_UNAVAILABLE"|"INSUFFICIENT_HISTORY";
export type HistoryCoverage={
  symbol:string;
  code:HistoryCoverageCode;
  analysisAllowed:boolean;
  executionAllowed:boolean;
  bars:number;
  reason:string;
};

function messageOf(payload:any){
  return String(payload?.message??payload?.error??payload?.status??"").trim();
}

export function assessHistoryCoverage(symbol:string,payload:any,minBars=40):HistoryCoverage{
  const values=Array.isArray(payload?.values)?payload.values:[];
  const bars=values.length;
  const message=messageOf(payload);
  const lower=message.toLowerCase();
  const codeNum=Number(payload?.code??payload?.statusCode??payload?.status);
  if(codeNum===429||/\b429\b/.test(lower)||/too many requests|rate limit/.test(lower)){
    return{symbol,code:"PROVIDER_RATE_LIMITED",analysisAllowed:false,executionAllowed:false,bars,reason:message||"The configured market-history provider is temporarily rate-limited."};
  }
  if(codeNum===404||/\b404\b/.test(lower)||/not found|symbol.*unknown|symbol.*invalid|no such symbol/.test(lower)){
    return{symbol,code:"PROVIDER_COVERAGE_MISSING",analysisAllowed:false,executionAllowed:false,bars,reason:message||"The configured market-history provider does not cover this symbol."};
  }
  if(bars===0){
    return{symbol,code:"MARKET_HISTORY_UNAVAILABLE",analysisAllowed:false,executionAllowed:false,bars,reason:message||`No usable market history is available for ${symbol}.`};
  }
  if(bars<minBars){
    return{symbol,code:"INSUFFICIENT_HISTORY",analysisAllowed:false,executionAllowed:false,bars,reason:`Only ${bars} daily bars are available; at least ${minBars} are required for decision-grade technical analysis.`};
  }
  return{symbol,code:"OK",analysisAllowed:true,executionAllowed:false,bars,reason:"Adequate market history is available for research analysis."};
}
