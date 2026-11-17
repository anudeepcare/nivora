const finite=value=>typeof value==='number'&&Number.isFinite(value);
const nonnegative=value=>finite(value)&&value>=0;
const validDate=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(`${value}T00:00:00Z`);return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value};
const number=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(value);
const integer=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(value);
const percent=value=>`${number(value*100)}%`;
const percentile=value=>`${number(value)}%`;

export function normalizeOptionsEvidence(section){
  if(section?.status!=='available'||!Array.isArray(section.data))return{status:'unavailable',reason:'Verified options summary is unavailable.'};
  for(const envelope of section.data){
    const data=envelope?.data;
    if(!data||Array.isArray(data)||typeof data!=='object'||!validDate(data.asOf)||Object.hasOwn(data,'sentiment')&&(!finite(data.sentiment)||data.sentiment< -1||data.sentiment>1))continue;
    const latest=data.latest&&typeof data.latest==='object'?data.latest:data,context=data.context&&typeof data.context==='object'?data.context:data,walls=data.oiWalls&&typeof data.oiWalls==='object'?data.oiWalls:{maxPain:data.maxPain},metrics={};
    for(const key of['pcVol','atmIv','expectedMove1d','callVol','putVol','callOi','putOi'])if(nonnegative(latest[key]))metrics[key]=latest[key];
    const normalizedContext={};for(const key of['ivRank1y','pcVolPctl1y','pcVolPctl5y','pcOiPctl1y','skewPctl1y','observations1y'])if(nonnegative(context[key]))normalizedContext[key]=context[key];
    const oiWalls={};if(validDate(walls.expiry))oiWalls.expiry=walls.expiry;if(nonnegative(walls.maxPain))oiWalls.maxPain=walls.maxPain;for(const side of['callWalls','putWalls'])if(Array.isArray(walls[side]))oiWalls[side]=walls[side].filter(row=>nonnegative(row?.strike)&&nonnegative(row?.oi)).slice(0,3).map(row=>({strike:row.strike,oi:row.oi}));
    const unusual=Array.isArray(data.unusual)?data.unusual.filter(row=>typeof row?.contract==='string'&&['call','put'].includes(row.type)&&nonnegative(row.strike)&&validDate(row.expiry)).slice(0,5).map(row=>({contract:row.contract,type:row.type,strike:row.strike,expiry:row.expiry,volume:nonnegative(row.volume)?row.volume:null,oi:nonnegative(row.oi)?row.oi:null,volOiRatio:nonnegative(row.volOiRatio)?row.volOiRatio:null,premium:nonnegative(row.premium)?row.premium:null,oiConfirmation:typeof row.oiConfirmation==='string'&&/^[a-z][a-z0-9 -]{0,30}$/i.test(row.oiConfirmation)?row.oiConfirmation:null})):[],expiries=[...new Set(unusual.map(row=>row.expiry))].sort();
    return{status:'available',preview:envelope.status==='preview'||section.access==='preview',source:envelope.source??'SentiSense Pro',asOf:data.asOf,sentiment:finite(data.sentiment)?data.sentiment:null,metrics,context:normalizedContext,oiWalls,unusual,expiries};
  }
  return{status:'unavailable',reason:'Options payload did not contain an eligible dated summary.'};
}

const metricLabels={pcVol:['Put / call volume ratio',number],atmIv:['~30d ATM implied volatility',percent],expectedMove1d:['Calibrated 90% expected move · 1 session',percent],callVol:['Call volume',integer],putVol:['Put volume',integer],callOi:['Call open interest',integer],putOi:['Put open interest',integer]};
const contextLabels={ivRank1y:'IV rank · 1y',pcVolPctl1y:'Put/call volume percentile · 1y',pcVolPctl5y:'Put/call volume percentile · 5y',pcOiPctl1y:'Put/call OI percentile · 1y',skewPctl1y:'Skew percentile · 1y',observations1y:'Observations · 1y'};

export function renderOptionsEvidence(section,escape=value=>String(value)){
  const value=normalizeOptionsEvidence(section);
  if(value.status!=='available')return`<div class="heatmap-empty"><b>Unavailable</b><p>${escape(value.reason)}</p></div>`;
  const cards=Object.entries(value.metrics).map(([key,metric])=>`<article class="indicator-card"><small>${escape(metricLabels[key][0])}</small><strong>${escape(metricLabels[key][1](metric))}</strong><span>End-of-day provider reading</span></article>`).join('');
  const context=Object.entries(value.context).map(([key,metric])=>`<li><b>${escape(contextLabels[key])}</b><span>${escape(key==='observations1y'?integer(metric):percentile(metric))}</span></li>`).join('');
  const wallRows=['callWalls','putWalls'].flatMap(side=>(value.oiWalls[side]||[]).map(row=>`<li><b>${escape(side==='callWalls'?'Call wall':'Put wall')} · ${escape(row.strike.toFixed(2))}</b><span>${escape(integer(row.oi))} OI</span></li>`)).join('');
  const unusual=value.unusual.map(row=>{const details=[[row.volume,'volume'],[row.oi,'open interest'],[row.volOiRatio,'× volume / OI'],[row.premium,'estimated premium']].filter(([metric])=>nonnegative(metric)).map(([metric,label])=>`<span>${escape(label.startsWith('×')?number(metric):integer(metric))}${label.startsWith('×')?label:` ${label}`}</span>`).join(''),confirmation=row.oiConfirmation?`<span>OI confirmation ${escape(row.oiConfirmation)}</span>`:'';return`<li data-option-contract data-expiry="${escape(row.expiry)}"><details class="option-contract-detail"><summary>${escape(row.contract)}</summary><p>${escape(row.type)} · strike ${escape(row.strike.toFixed(2))} · expiry ${escape(row.expiry)}</p><div>${details}${confirmation}</div></details></li>`}).join('');
  const expiryFilter=value.expiries.length>1?`<label>Unusual-contract expiry <select data-option-expiry><option value="all">All returned expiries</option>${value.expiries.map(expiry=>`<option value="${escape(expiry)}">${escape(expiry)}</option>`).join('')}</select></label><p>Filters returned unusual-contract records only; it is not an option-chain selector.</p>`:'';
  const wallSummary=value.oiWalls.expiry?`Expiry ${escape(value.oiWalls.expiry)} · `:'',maxPain=nonnegative(value.oiWalls.maxPain)?`Max pain ${escape(value.oiWalls.maxPain.toFixed(2))}`:'No eligible walls returned.';
  return`<div class="options-summary"><header><b>Options-implied sentiment ${value.sentiment===null?'unavailable':escape(number(value.sentiment))}</b><span>${value.preview?'PREVIEW · ':''}as of ${escape(value.asOf)} · ${escape(value.source)}</span></header><div class="indicator-wall">${cards||'<p>No eligible headline readings returned.</p>'}</div>${context?`<section><small>TRAILING CONTEXT</small><ul>${context}</ul></section>`:''}<section><small>OPEN-INTEREST STRUCTURE</small><p>${wallSummary}${maxPain}</p>${wallRows?`<ul>${wallRows}</ul>`:''}</section>${unusual?`<section><small>UNUSUAL CONTRACTS · ESTIMATED MARK-BASED PREMIUM</small>${expiryFilter}<ul>${unusual}</ul></section>`:''}<p>End-of-day chain analytics are descriptive, not forecasts or trade recommendations.</p></div>`;
}
