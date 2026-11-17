const count=value=>Number.isInteger(value)&&value>=0?value:null;
export function formatDiscoverCounts(value={}){const returned=count(value.returnedCount)??0,matched=count(value.matchedCount),universe=count(value.totalUniverseCount),rejected=count(value.rejectedCount)??0,parts=[`Showing ${returned} accepted result${returned===1?'':'s'}`,matched===null?'provider matched count unavailable':`provider matched ${matched}`];if(universe!==null)parts.push(`total universe ${universe}`);if(rejected)parts.push(`${rejected} locally rejected or deduplicated`);if(value.truncated===true)parts.push('capped by request limit');return parts.join(' · ')}

const text=value=>typeof value==='string'&&value.trim()?value.trim():null;
export function buildDiscoverMap(result={},controls={}){
  if(!['live','preview','available'].includes(result?.status)||!Array.isArray(result.results))return{status:'unavailable',reason:result?.reason??result?.note??'Verified provider results are unavailable.',results:[],exchanges:[]};
  const rows=result.results.filter(row=>text(row?.symbol)&&text(row?.exchange)).map(row=>({symbol:text(row.symbol),name:text(row.name),exchange:text(row.exchange)}));
  const exchanges=[...new Set(rows.map(row=>row.exchange))].sort((a,b)=>a.localeCompare(b));
  const query=String(controls.query??'').trim().toLowerCase(),exchange=text(controls.exchange)??'ALL';
  const results=rows.filter(row=>(exchange==='ALL'||row.exchange===exchange)&&(!query||`${row.symbol} ${row.name??''}`.toLowerCase().includes(query))).sort((a,b)=>a.symbol.localeCompare(b.symbol)||(a.name??'').localeCompare(b.name??''));
  return{status:'available',access:result.access??result.status,source:text(result.source)??'Unknown source',asOf:text(result.asOf),results,exchanges,query:controls.query??'',exchange,order:'alphabetical-identity',counts:{...result,returnedCount:count(result.returnedCount)??rows.length}};
}

export function renderDiscoverMap(value,escape=input=>String(input)){
  if(value?.status!=='available')return`<header><small>OPPORTUNITY MAP · IDENTITY VIEW</small><span class="tag warn">UNAVAILABLE</span></header><div class="structure-empty"><strong>Unavailable</strong><p>${escape(value?.reason??'Verified provider results are unavailable.')}</p></div>`;
  const metrics=['Quality','Value','Change','Pace'];
  return`<header><small>OPPORTUNITY MAP · IDENTITY VIEW</small><span class="tag">${escape(value.access)}</span></header><p><small>${escape(value.source)} · ${escape(value.asOf??'As-of unavailable')} · <span data-discover-counts>${escape(formatDiscoverCounts(value.counts))}</span></small></p><div class="toolbar discover-controls"><label>Filter companies<input data-discover-query value="${escape(value.query)}" autocomplete="off"></label><label>Exchange<select data-discover-exchange><option value="ALL">All verified exchanges</option>${value.exchanges.map(exchange=>`<option value="${escape(exchange)}"${value.exchange===exchange?' selected':''}>${escape(exchange)}</option>`).join('')}</select></label></div><div class="control-strip" aria-label="Unavailable screener dimensions">${metrics.map(metric=>`<button disabled title="Requires a verified screener field catalog">${metric}</button>`).join('')}</div><p>Alphabetical identity map · not a ranking. Unsupported quality, value, change and Pace scores are not inferred.</p><div class="discover-identity-grid" data-discover-results>${renderDiscoverResults(value,escape)}</div>`;
}

export function renderDiscoverResults(value,escape=input=>String(input)){return value.results.length?value.results.map(row=>`<button data-discover-symbol="${escape(row.symbol)}"><b>${escape(row.symbol)}</b><span>${escape(row.name??'Name unavailable')}</span><small>${escape(row.exchange)}</small></button>`).join(''):'<div class="structure-empty"><strong>No matching verified identities</strong><p>Change the local company or exchange filter.</p></div>'}

export function mountDiscoverMap(container,result,{escape=input=>String(input),onSelect=()=>{}}={}){
  if(!container)return()=>{};
  const state={query:'',exchange:'ALL'};
  const bindResults=()=>container.querySelectorAll('[data-discover-symbol]').forEach(button=>button.onclick=()=>onSelect(button.dataset.discoverSymbol));
  const refresh=()=>{const value=buildDiscoverMap(result,state),grid=container.querySelector('[data-discover-results]'),counts=container.querySelector('[data-discover-counts]');if(grid)grid.innerHTML=renderDiscoverResults(value,escape);if(counts)counts.textContent=formatDiscoverCounts(value.counts);bindResults();return value};
  const draw=()=>{const value=buildDiscoverMap(result,state);container.innerHTML=renderDiscoverMap(value,escape);const query=container.querySelector('[data-discover-query]'),exchange=container.querySelector('[data-discover-exchange]');if(query)query.oninput=()=>{state.query=query.value;refresh()};if(exchange)exchange.onchange=()=>{state.exchange=exchange.value;refresh()};bindResults();return value};
  draw();return refresh;
}
