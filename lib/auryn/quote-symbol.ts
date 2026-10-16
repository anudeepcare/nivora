/** Normalize explicit pairs without confusing the BTC equity ticker with bitcoin. */
export function normalizeQuoteSymbol(value:string,assetType?:string):string {
 const symbol=String(value||'').trim().toUpperCase().replace(/\s*([/-])\s*/g,'$1');
 if(/^[A-Z0-9]{2,15}[-/](USD|USDT|USDC|EUR|GBP)$/.test(symbol))return symbol.replace('-','/');
 return assetType==='CRYPTO'&&/^[A-Z0-9]{2,15}$/.test(symbol)?`${symbol}/USD`:symbol;
}
export function isCryptoQuoteSymbol(symbol:string){return /^[A-Z0-9]{2,15}\/(USD|USDT|USDC|EUR|GBP)$/.test(normalizeQuoteSymbol(symbol));}
