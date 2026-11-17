const VALID_SYMBOL=/^[A-Z0-9._-]{1,15}$/;
const normalize=value=>String(value??'').trim().toUpperCase();
const identity=value=>{const symbol=normalize(value);if(!VALID_SYMBOL.test(symbol))return null;return symbol.includes('.')?symbol:`${symbol}.US`};

export function buildResearchWatchlistAction(symbol,savedSymbols=[]){
  const normalized=normalize(symbol),canonical=identity(normalized);
  if(!canonical)return{status:'unavailable',reason:'invalid-security-identity'};
  const saved=Array.isArray(savedSymbols)&&savedSymbols.some(value=>identity(value)===canonical);
  return{status:'available',symbol:normalized,saved};
}

export function renderResearchWatchlistAction(action,escape=value=>String(value)){
  if(action?.status!=='available'||!identity(action.symbol))return'';
  const symbol=escape(normalize(action.symbol)),mode=action.saved?'remove':'add';
  return `<section class="research-watchlist-action" data-research-watchlist-action><div><small>LOCAL WATCHLIST</small><strong>${symbol}</strong><span>${action.saved?'Saved locally':'Not saved'}</span></div><button type="button" data-research-watchlist="${mode}" data-symbol="${symbol}">${action.saved?'Remove from Watchlist':'Add to Watchlist'}</button><p data-research-watchlist-message aria-live="polite"></p></section>`;
}
