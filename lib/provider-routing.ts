export type MarketSource = "twelve" | "eodhd";
export function preferredMarketSources(
  dataset: "quote" | "intraday" | "daily",
  configured: { twelve: boolean; eodhd: boolean },
): MarketSource[] {
  const order: MarketSource[] =
    dataset === "daily" ? ["eodhd", "twelve"] : ["twelve", "eodhd"];
  return order.filter((p) => configured[p]);
}
/** Select one complete result. Never splice providers' bars or financial periods. */
export async function readPreferred<T>(
  sources: MarketSource[],
  read: (source: MarketSource) => Promise<T>,
): Promise<{ value: T; provider: MarketSource; fallback: boolean }> {
  let failure: unknown = new Error("No market-data provider is configured.");
  for (let i = 0; i < sources.length; i++) {
    try {
      return {
        value: await read(sources[i]),
        provider: sources[i],
        fallback: i > 0,
      };
    } catch (e) {
      failure = e;
    }
  }
  throw failure;
}

/** Server data cache durations, separate from rendered-page/account caching. */
export function providerCacheSeconds(
  endpoint: string,
  params: Record<string, string>,
) {
  if (endpoint === "quote") return 30;
  if (endpoint === "profile" || endpoint === "logo") return 86400;
  if (endpoint === "symbol_search") return 3600;
  if (endpoint === "time_series") return params.interval === "1day" ? 3600 : 60;
  return 60;
}

/** A dated stale price must not suppress a usable backup quote. */
export async function readFreshQuote<T extends {quote:{price:number|null;asOf:string|null;stale:boolean}}>(sources:MarketSource[],read:(source:MarketSource)=>Promise<T>){
 let retained:{value:T;provider:MarketSource;fallback:boolean}|null=null;
 let failure:unknown=new Error('No market-data provider is configured.');
 for(let i=0;i<sources.length;i++){
  try{const value=await read(sources[i]);if(value.quote.price==null||!Number.isFinite(value.quote.price)||value.quote.price<=0)throw new Error('The quote source returned no usable price.');
   const result={value,provider:sources[i],fallback:i>0};
   if(!value.quote.stale)return result;
   if(!retained||(Date.parse(value.quote.asOf||'')||0)>(Date.parse(retained.value.quote.asOf||'')||0))retained=result;
  }catch(e){failure=e;}
 }
 if(retained)return retained;
 throw failure;
}
