import {NextResponse} from 'next/server';
import {sharedJson} from '@/lib/shared-cache';
import {providerMarketHint} from '@/lib/auryn/v82/security-master';
import {CHART_HISTORY_VERSION,chartHistoryConfig,chartHistoryError,normalizeChartHistory} from '@/lib/chart-history';
export async function GET(req:Request,{params}:{params:Promise<{symbol:string}>}){
 const {symbol:raw}=await params,symbol=decodeURIComponent(raw).toUpperCase(),requested=new URL(req.url).searchParams.get('range')?.toUpperCase()||'3M';
 if(!/^[A-Z0-9][A-Z0-9./-]{0,29}$/.test(symbol))return NextResponse.json({error:'Invalid investment symbol.'},{status:400});
 const key=process.env.TWELVE_DATA_API_KEY;if(!key)return NextResponse.json({error:'Market history provider is not configured.'},{status:503});
 const config=chartHistoryConfig(symbol,requested),hint=providerMarketHint(symbol);
 const query=new URLSearchParams({symbol,interval:config.interval,outputsize:String(config.size),timezone:'UTC',prepost:'false',apikey:key});
 if(!config.crypto&&hint.exchange)query.set('exchange',hint.exchange);
 try{
  const data=await sharedJson('https://api.twelvedata.com/time_series?'+query,['twelve',CHART_HISTORY_VERSION,symbol,config.range],config.intraday?60:900,8000,undefined,payload=>{normalizeChartHistory(payload,config);});
  const candles=normalizeChartHistory(data,config);
  return NextResponse.json({symbol,range:config.range,interval:config.interval,candles,source:'Twelve Data',timeZone:config.intraday?'UTC':data?.meta?.exchange_timezone||'Exchange dates',session:config.crypto?'24/7':'Regular session',coverage:config.range==='1D'?(config.crypto?'Last 24 hours':'Latest available trading session'):config.range==='1W'?(config.crypto?'Last 7 days':'Latest 5 trading sessions'):'Daily history'},{headers:{'Cache-Control':'private, max-age=30'}});
 }catch(error:any){
  const message=String(error?.message||''),upstream=message.match(/^Upstream (\d+)/);
  const safe=upstream?chartHistoryError(Number(upstream[1])):error?.name==='AbortError'?'Chart request timed out. Please retry.':/^(Chart |This chart |No chart |No valid chart )/.test(message)?message:chartHistoryError();
  return NextResponse.json({error:safe},{status:503});
 }
}
