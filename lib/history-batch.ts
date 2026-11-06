/** Give every missing instrument a turn before retrying failed earlier reads. */
export function historyBatch(symbols:string[], available:ReadonlySet<string>, attempted:ReadonlySet<string>,size=10){
 const missing=symbols.filter(symbol=>!available.has(symbol));
 return [...missing.filter(symbol=>!attempted.has(symbol)),...missing.filter(symbol=>attempted.has(symbol))].slice(0,Math.max(0,size));
}
