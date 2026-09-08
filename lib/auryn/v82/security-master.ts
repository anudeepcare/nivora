export type SecurityKind=
  |"COMMON_STOCK"
  |"CLASS_SHARE"
  |"PREFERRED"
  |"WARRANT"
  |"RIGHT"
  |"UNIT"
  |"TEMPORARY"
  |"CRYPTO"
  |"UNKNOWN";

export type SecurityClassification={
  symbol:string;
  normalizedSymbol:string;
  kind:SecurityKind;
  confidence:"HIGH"|"MEDIUM"|"LOW";
  supportedForEquityAnalysis:boolean;
  reason:string;
};

const clean=(symbol:string)=>String(symbol||"").trim().toUpperCase();

export function classifySecuritySymbol(raw:string):SecurityClassification{
  const symbol=clean(raw);
  const base={symbol,normalizedSymbol:symbol};
  if(!symbol)return{...base,kind:"UNKNOWN",confidence:"LOW",supportedForEquityAnalysis:false,reason:"Empty security symbol."};
  if(symbol.includes("/"))return{...base,kind:"CRYPTO",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Slash-delimited crypto pair."};

  // Explicit exchange/vendor suffixes are the safest classifications and take precedence.
  if(/(?:\.PR\.[A-Z0-9]+|\.PREF\.[A-Z0-9]+)$/i.test(symbol))
    return{...base,kind:"PREFERRED",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Explicit preferred-share suffix."};
  if(/(?:\.WT|\.WS|-WT|-WS)$/i.test(symbol))
    return{...base,kind:"WARRANT",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Explicit warrant suffix."};
  if(/(?:\.RT|-RT|-RGT)$/i.test(symbol))
    return{...base,kind:"RIGHT",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Explicit rights suffix."};
  if(/(?:\.UN|\.U|-UN|-U)$/i.test(symbol))
    return{...base,kind:"UNIT",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Explicit unit suffix."};

  // Nasdaq-style fifth-letter security designators. Restrict to exactly five letters to avoid
  // treating ordinary longer company tickers as special instruments.
  if(/^[A-Z]{5}$/.test(symbol)){
    const suffix=symbol.at(-1)!;
    if(suffix==="W")return{...base,kind:"WARRANT",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Nasdaq fifth-letter warrant designator."};
    if(suffix==="R")return{...base,kind:"RIGHT",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Nasdaq fifth-letter rights designator."};
    if(suffix==="U")return{...base,kind:"UNIT",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Nasdaq fifth-letter unit designator."};
    if(suffix==="V")return{...base,kind:"TEMPORARY",confidence:"HIGH",supportedForEquityAnalysis:false,reason:"Nasdaq fifth-letter temporary/when-issued designator."};
  }

  // Dot class shares such as BRK.A / AKO.B remain ordinary equity analysis candidates.
  if(/^[A-Z]{1,6}\.[A-Z]$/.test(symbol))
    return{...base,kind:"CLASS_SHARE",confidence:"HIGH",supportedForEquityAnalysis:true,reason:"Equity class-share notation."};

  if(/^[A-Z][A-Z0-9.-]{0,11}$/.test(symbol))
    return{...base,kind:"COMMON_STOCK",confidence:"MEDIUM",supportedForEquityAnalysis:true,reason:"No special-instrument suffix detected; treat as equity candidate pending provider/security metadata."};

  return{...base,kind:"UNKNOWN",confidence:"LOW",supportedForEquityAnalysis:false,reason:"Symbol format is not recognized by the common-equity security master."};
}

export function isSupportedEquitySecurity(x:SecurityClassification){
  return x.supportedForEquityAnalysis&&(x.kind==="COMMON_STOCK"||x.kind==="CLASS_SHARE");
}

export type ProviderMarketHint={exchange?:string;currency?:string};
const PROVIDER_MARKET_HINTS:Record<string,ProviderMarketHint>={
  SAP:{exchange:"NYSE",currency:"USD"},
};
export function providerMarketHint(raw:string):ProviderMarketHint{
  return PROVIDER_MARKET_HINTS[clean(raw)]??{};
}
