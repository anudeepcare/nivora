const normalize=value=>String(value??'').trim().toUpperCase();
const valid=value=>/^[A-Z0-9._-]{1,15}$/.test(value);
const canonical=value=>{const symbol=normalize(value);if(!valid(symbol))return null;return symbol.includes('.')?symbol:`${symbol}.US`};

export function buildCompareCandidates(symbols=[]){
  const unique=[...new Set((Array.isArray(symbols)?symbols:[]).map(canonical).filter(Boolean))].sort();
  return unique.length?{status:'available',symbols:unique}:{status:'unavailable',symbols:[]};
}

export function placeCompareCandidate(slots,symbol){
  const values=Array.isArray(slots)?slots.slice(0,3).map(value=>normalize(value)):[],candidate=canonical(symbol);
  while(values.length<3)values.push('');
  if(!candidate)return{status:'invalid',slots:values};
  if(values.some(value=>canonical(value)===candidate))return{status:'duplicate',slots:values};
  const empty=values.findIndex(value=>!value);if(empty<0)return{status:'full',slots:values};
  values[empty]=candidate;return{status:'placed',slots:values};
}

export function renderCompareCandidates(value,escape=input=>String(input)){
  if(value?.status!=='available')return'<p data-compare-candidate-message>Add companies to the browser-local Watchlist for quick fill, or enter three identifiers manually.</p>';
  return `<section class="compare-candidates"><small>SAVED LOCALLY · QUICK FILL ONLY · ALPHABETICAL</small><div>${value.symbols.map(symbol=>`<button type="button" data-compare-candidate="${escape(symbol)}">${escape(symbol)}</button>`).join('')}</div><p data-compare-candidate-message>Select a saved company to fill the first empty comparison slot. Comparison does not run until submitted.</p></section>`;
}
