const finite=value=>typeof value==='number'&&Number.isFinite(value);
const iso=value=>{if(typeof value!=='string'||!value)return null;const date=new Date(value);return Number.isFinite(date.getTime())?date.toISOString():null};
const labels=new Map([['SPY.US','S&P 500 ETF'],['QQQ.US','Nasdaq-100 ETF'],['DIA.US','Dow ETF']]);

export function normalizeMarketSnapshot(payload={},options={}){
  const now=options.now instanceof Date&&Number.isFinite(options.now.getTime())?options.now:new Date(),maxAgeMs=96*60*60*1000,futureToleranceMs=5*60*1000;
  const supplied=Array.isArray(payload.instruments)?payload.instruments:[],bySymbol=new Map(supplied.map(row=>[row?.symbol,row]));
  const instruments=[...labels].map(([symbol,label])=>{const row=bySymbol.get(symbol),asOf=iso(row?.asOf),age=asOf?now-new Date(asOf):NaN,reason=!asOf?'Timestamp unavailable':age< -futureToleranceMs?'Future-dated quote unavailable':age>maxAgeMs?'Stale quote unavailable':row?.reason??'Eligible USD benchmark quote unavailable',valid=row?.status==='live'&&row?.symbol===symbol&&finite(row.price)&&row.price>0&&row.currency==='USD'&&row.source==='EODHD'&&row.priceType==='delayed-indicative'&&asOf&&age>= -futureToleranceMs&&age<=maxAgeMs;if(!valid)return{status:'unavailable',symbol,label,price:null,changePercent:null,currency:row?.currency??null,asOf:null,source:'EODHD',priceType:'delayed-indicative',reason};return{status:'available',symbol,label,price:row.price,changePercent:finite(row.changePercent)?row.changePercent:null,currency:'USD',asOf,source:'EODHD',priceType:'delayed-indicative'}});
  const count=instruments.filter(row=>row.status==='available').length;
  return{status:count===instruments.length?'available':count?'partial':'unavailable',instruments,methodology:'Fixed benchmark ETFs; delayed/indicative quotes; descriptive evidence only.'};
}

export function renderMarketSnapshot(value,escape=input=>String(input)){
  const rows=value?.instruments??[];
  return `<div class="market-snapshot"><small>FIXED BENCHMARK ETFs · NOT A MARKET SCORE</small>${rows.map(row=>row.status==='available'?`<div class="evidence-row"><b>${escape(row.label)} · USD ${row.price.toFixed(2)}</b><span>${row.changePercent===null?'Change unavailable':`${row.changePercent>=0?'+':''}${row.changePercent.toFixed(2)}%`} · ${escape(row.asOf)} · DELAYED / INDICATIVE · ${escape(row.source)}</span></div>`:`<div class="evidence-row"><b>${escape(row.label)}</b><span>Unavailable · ${escape(row.reason??'Provider evidence unavailable')}</span></div>`).join('')}<p>These fixed ETFs are descriptive proxies only; no aggregate condition or recommendation is inferred.</p><button type="button" data-market-snapshot-retry>Refresh fixed snapshot</button></div>`;
}
