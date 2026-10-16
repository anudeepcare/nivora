export const CHART_HISTORY_VERSION='chart-history-v3';
const dailySizes:Record<string,number>={'1M':32,'3M':75,'6M':150,'1Y':270,'3Y':800,'5Y':1350};
const cryptoSizes:Record<string,number>={'1M':32,'3M':95,'6M':190,'1Y':370,'3Y':1100,'5Y':1840};
export function chartHistoryConfig(symbol:string,requested:string){
 const range=['1D','1W',...Object.keys(dailySizes)].includes(requested)?requested:'3M';
 const crypto=symbol.includes('/'),intraday=range==='1D'||range==='1W';
 return {range,crypto,intraday,interval:range==='1D'?'15min':range==='1W'?'1h':'1day',size:range==='1D'?(crypto?97:64):range==='1W'?(crypto?169:80):(crypto?cryptoSizes:dailySizes)[range]};
}
export function chartHistoryError(code?:number){
 if(code===429)return 'Chart provider rate limit reached. Try again shortly.';
 if(code===401||code===403)return 'This chart interval is unavailable with the current data access.';
 if(code===400||code===404)return 'No chart history is available for this investment and period.';
 return 'Chart history could not be loaded. Please retry.';
}
export function normalizeChartHistory(data:any,config:ReturnType<typeof chartHistoryConfig>,now=Date.now()){
 if(data?.status==='error'||Number(data?.code)>=400)throw new Error(chartHistoryError(Number(data?.code)));
 if(!Array.isArray(data?.values)||!data.values.length)throw new Error('No chart history was returned for this period. Please retry.');
 const unique=new Map<string,any>();
 for(const row of data.values){
  const raw=String(row.datetime||'').trim().replace(' ','T');
  const ms=Date.parse(config.intraday?raw+(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)?'':'Z'):raw.slice(0,10)+'T00:00:00Z');
  const prices=[row.open,row.high,row.low,row.close].map(value=>value==null||value===''?NaN:Number(value));
  if(!Number.isFinite(ms)||ms>now||prices.some(value=>!Number.isFinite(value)||value<=0))continue;
  const [open,high,low,close]=prices;if(high<Math.max(open,close)||low>Math.min(open,close)||high<low)continue;
  const time=config.intraday?Math.floor(ms/1000):new Date(ms).toISOString().slice(0,10);
  unique.set(String(time),{time,open,high,low,close,...(row.volume!=null&&Number.isFinite(Number(row.volume))&&Number(row.volume)>=0?{volume:Number(row.volume)}:{})});
 }
 let candles=[...unique.values()].sort((a,b)=>config.intraday?a.time-b.time:String(a.time).localeCompare(String(b.time)));
 if(config.intraday&&config.crypto){const cutoff=now-(config.range==='1D'?24:168)*3600000;candles=candles.filter(bar=>bar.time*1000>=cutoff);}
 if(config.intraday&&!config.crypto&&candles.length){
  let formatter:Intl.DateTimeFormat;try{formatter=new Intl.DateTimeFormat('en-CA',{timeZone:data?.meta?.exchange_timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'});}catch{formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'});}
  const day=(bar:any)=>formatter.format(new Date(bar.time*1000));
  const days=[...new Set(candles.map(day))].slice(config.range==='1D'?-1:-5);candles=candles.filter(bar=>days.includes(day(bar)));
 }
 if(!candles.length)throw new Error('No valid chart observations are available in this period. Please retry.');
 return candles;
}
