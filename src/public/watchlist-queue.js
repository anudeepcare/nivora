const day=86_400_000;
const finite=value=>(typeof value==='number'||typeof value==='string'&&value.trim()!=='')&&Number.isFinite(Number(value));
const dateOnly=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'));
const ageDays=(value,now)=>Math.floor((now.getTime()-Date.parse(value+'T00:00:00Z'))/day);
const canonical=value=>{const symbol=String(value??'').trim().toUpperCase();return /^[A-Z0-9_-]{1,15}$/.test(symbol)?`${symbol}.US`:symbol};
let snapshotSummaries=()=>new Map();
export function bindWatchlistSnapshotSummaries(provider){snapshotSummaries=typeof provider==='function'?provider:()=>new Map()}

export class WatchlistEvidenceRequests{
  constructor(){this.versions=new Map()}
  next(symbol){const version=(this.versions.get(symbol)||0)+1;this.versions.set(symbol,version);return version}
  invalidate(symbol){this.versions.set(symbol,(this.versions.get(symbol)||0)+1)}
  isCurrent(symbol,version){return this.versions.get(symbol)===version}
}

export function normalizeWatchlistEvidence(symbol,response,{now=new Date(),maxPriceAgeDays=7,maxScenarioAgeDays=200}={}){
  const expected=canonical(symbol),actual=canonical(response?.identity?.canonical??response?.symbol);
  if(!actual||actual!==expected)return{status:'unavailable',symbol:expected,reason:'identity-mismatch'};
  const pace=response?.analytics?.pace,scenarios=response?.analytics?.scenarios;
  if(pace?.status!=='available'||scenarios?.status!=='available')return{status:'unavailable',symbol:expected,reason:'model-unavailable'};
  if(pace.currency!=='USD'||scenarios.currency!=='USD'||pace.currency!==scenarios.currency)return{status:'unavailable',symbol:expected,reason:'currency-mismatch'};
  const priceAsOf=pace.provenance?.currentPrice?.asOf??pace.explanation?.period?.end,scenarioAsOf=scenarios.asOf;
  if(!dateOnly(priceAsOf)||!dateOnly(scenarioAsOf))return{status:'unavailable',symbol:expected,reason:'missing-evidence-date'};
  const priceAge=ageDays(priceAsOf,now),scenarioAge=ageDays(scenarioAsOf,now);
  if(priceAge<0||scenarioAge<0)return{status:'unavailable',symbol:expected,reason:'future-evidence'};
  if(priceAge>maxPriceAgeDays)return{status:'unavailable',symbol:expected,reason:'stale-price'};
  if(scenarioAge>maxScenarioAgeDays)return{status:'unavailable',symbol:expected,reason:'stale-fundamentals'};
  const rawValues=[pace.currentPrice,scenarios.bear?.price,scenarios.base?.price,scenarios.bull?.price];
  if(!rawValues.every(finite))return{status:'unavailable',symbol:expected,reason:'invalid-model-values'};
  const[currentPrice,bear,base,bull]=rawValues.map(Number);
  if(currentPrice<=0||bear<0||base<0||bull<0)return{status:'unavailable',symbol:expected,reason:'invalid-model-values'};
  const baseGapPercent=(base/currentPrice-1)*100;
  if(!finite(baseGapPercent))return{status:'unavailable',symbol:expected,reason:'invalid-model-values'};
  return{status:'available',symbol:expected,currency:'USD',zone:String(pace.zone??'Unknown'),currentPrice,bear,base,bull,baseGapPercent,priceAsOf,scenarioAsOf};
}

const reasonText=reason=>({
  'identity-mismatch':'Provider identity did not match this security.',
  'currency-mismatch':'Comparable USD evidence is unavailable.',
  'stale-price':'Latest price evidence is stale.',
  'stale-fundamentals':'Fundamental evidence is stale.',
  'future-evidence':'Evidence date is invalid.',
  'missing-evidence-date':'Evidence date is unavailable.',
  'invalid-model-values':'Model evidence is invalid.',
  'model-unavailable':'Pace or scenarios are unavailable.'
}[reason]??'Provider evidence is unavailable.');

export function renderWatchlistQueue(symbols,evidence,escape=value=>String(value),snapshots=snapshotSummaries()){
  if(!symbols.length)return'<div class="structure-empty"><strong>No saved symbols</strong><p>Add a canonical security identifier. Evidence loads only when requested.</p></div>';
  return symbols.map(symbol=>{
    const safe=escape(symbol),item=evidence.get(symbol);
    if(item?.status==='available'){const history=snapshots.get(canonical(symbol)),change=history?.status==='changed'?`Price ${history.change.priceDelta>=0?'+':''}$${history.change.priceDelta.toFixed(2)} (${history.change.priceDeltaPercent>=0?'+':''}${history.change.priceDeltaPercent.toFixed(1)}%)<br><small>Base gap ${history.change.baseGapDelta>=0?'+':''}${history.change.baseGapDelta.toFixed(1)}pp · ${escape(history.change.zoneFrom)} → ${escape(history.change.zoneTo)}</small>`:history?.status==='baseline'?'Baseline captured; refresh later to compare.':'No saved comparison snapshot.',review=history?.nextReview?`Next review by ${escape(history.nextReview)}`:'Review date unavailable';return `<div class="queue-row"><b>${safe}<br><small>${escape(item.zone)} · $${item.currentPrice.toFixed(2)} USD</small></b><span>${change}</span><span>Base $${item.base.toFixed(2)} · ${item.baseGapPercent>=0?'+':''}${item.baseGapPercent.toFixed(1)}%<br><small>Bear $${item.bear.toFixed(2)} · Bull $${item.bull.toFixed(2)}</small></span><span>${review}<br><small>Price ${escape(item.priceAsOf)} · fundamentals ${escape(item.scenarioAsOf)}</small><br><button data-watchlist-refresh="${safe}">Refresh evidence</button> <button data-watchlist-research="${safe}">Research</button> <button data-watchlist-remove="${safe}">Remove</button></span></div>`}
    const message=item?.status==='loading'?'Loading provider evidence…':item?.status==='unavailable'?reasonText(item.reason):'Evidence not loaded.';
    return `<div class="queue-row"><b>${safe}</b><span>${escape(message)}</span><span>Not ranked · no decision inferred</span><span><button data-watchlist-refresh="${safe}">${item?.status==='unavailable'?'Retry':'Load evidence'}</button> <button data-watchlist-research="${safe}">Research</button> <button data-watchlist-remove="${safe}">Remove</button></span></div>`;
  }).join('');
}
