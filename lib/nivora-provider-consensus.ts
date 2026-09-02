
import type {ExecutionQuote} from "./nivora-execution-quote";

export type QuoteIntegrityState=
  |"LIVE_VERIFIED"
  |"LIVE_SINGLE_SOURCE"
  |"DELAYED"
  |"STALE"
  |"DISAGREEMENT"
  |"MARKET_CLOSED";

export type QuoteIntegrity={
  state:QuoteIntegrityState;
  tradable:boolean;
  reason:string;
  chosen:ExecutionQuote|null;
  primary:ExecutionQuote|null;
  secondary:ExecutionQuote|null;
  disagreementPct:number|null;
};

const pctDiff=(a:number,b:number)=>{
  const mid=(Math.abs(a)+Math.abs(b))/2;
  return mid>0?Math.abs(a-b)/mid*100:null;
};

export function assessQuoteIntegrity(
  primary:ExecutionQuote|null|undefined,
  secondary:ExecutionQuote|null|undefined,
  maxDisagreementPct=.75
):QuoteIntegrity{
  const p=primary??null,s=secondary??null;
  const any=p||s;
  if(!any)return{state:"STALE",tradable:false,reason:"No quote provider returned usable market data.",chosen:null,primary:p,secondary:s,disagreementPct:null};

  if(any.session==="CLOSED"||any.session==="OVERNIGHT"){
    const chosen=p??s;
    return{state:"MARKET_CLOSED",tradable:false,reason:"The U.S. market session is closed; the last trade is context only.",chosen,primary:p,secondary:s,disagreementPct:p&&s?pctDiff(p.price,s.price):null};
  }

  const pLive=!!p&&p.freshness==="LIVE"&&p.ageSeconds!=null&&p.price>0;
  const sLive=!!s&&s.freshness==="LIVE"&&s.ageSeconds!=null&&s.price>0;
  const disagreement=p&&s&&p.price>0&&s.price>0?pctDiff(p.price,s.price):null;

  if(pLive&&sLive){
    if(disagreement!=null&&disagreement>maxDisagreementPct){
      const chosen=(p.ageSeconds??Infinity)<=(s.ageSeconds??Infinity)?p:s;
      return{state:"DISAGREEMENT",tradable:false,reason:`Live providers disagree by ${disagreement.toFixed(2)}%, above the ${maxDisagreementPct.toFixed(2)}% integrity limit.`,chosen,primary:p,secondary:s,disagreementPct:+disagreement.toFixed(4)};
    }
    const chosen=(p.ageSeconds??Infinity)<=(s.ageSeconds??Infinity)?p:s;
    return{state:"LIVE_VERIFIED",tradable:true,reason:"Independent live providers agree within the configured integrity tolerance.",chosen,primary:p,secondary:s,disagreementPct:disagreement==null?null:+disagreement.toFixed(4)};
  }

  if(pLive||sLive){
    const chosen=pLive?p:s!;
    return{state:"LIVE_SINGLE_SOURCE",tradable:true,reason:`${chosen.provider} is fresh; the secondary provider is unavailable or stale, so quote confidence is reduced.`,chosen,primary:p,secondary:s,disagreementPct:disagreement==null?null:+disagreement.toFixed(4)};
  }

  const freshest=[p,s].filter(Boolean).sort((a,b)=>(a!.ageSeconds??Infinity)-(b!.ageSeconds??Infinity))[0]??null;
  const hasTimestamp=!!freshest&&freshest.ageSeconds!=null;
  return{
    state:hasTimestamp?"STALE":"DELAYED",
    tradable:false,
    reason:hasTimestamp?"All available quotes are older than the tradable freshness policy.":"Provider timestamps are unavailable, so NIVORA cannot verify quote freshness.",
    chosen:freshest,
    primary:p,
    secondary:s,
    disagreementPct:disagreement==null?null:+disagreement.toFixed(4)
  };
}


export function validateQuoteIdentity(expectedSymbol:string,quote:{symbol?:string|null;provider?:string|null}){
 const expected=String(expectedSymbol||"").trim().toUpperCase();
 const actual=String(quote?.symbol||"").trim().toUpperCase();
 if(!expected||!actual)return{ok:false,reason:"Quote symbol identity is unavailable."};
 if(expected!==actual)return{ok:false,reason:`Quote symbol mismatch: requested ${expected}, provider returned ${actual}.`};
 return{ok:true,reason:"Quote symbol matches the requested ticker."};
}
