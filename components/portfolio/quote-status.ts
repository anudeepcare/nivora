import {lastCompletedRegularSessionCloseTimestamp,marketSessionAt} from '../../lib/nivora-market-session';
import {positivePrice} from './valuation';

export function quoteStatus(market:any,now=Date.now()){
 const state=String(market?.priceState||''),session=String(market?.session||''),price=positivePrice(market?.displayPrice);
 const stamp=state==='OFFICIAL_CLOSE'?market?.regularCloseAsOf:(market?.liveMarketPriceAsOf||market?.decisionPriceAsOf);
 const time=typeof stamp==='string'&&stamp.trim()?Date.parse(stamp):NaN;
 const valid=Number.isFinite(time)&&time>0&&time<=now,ageSeconds=valid?(now-time)/1000:null;
 if(market?.currency&&String(market.currency).toUpperCase()!=='USD')return{label:'USD price unavailable · quote currency differs',timestamp:valid?stamp:null,ageSeconds,current:false,stale:false,missing:true};
 if(price==null)return{label:'Quote unavailable',timestamp:valid?stamp:null,ageSeconds,current:false,stale:false,missing:true};
 if(!valid)return{label:'Price unverified · timestamp unavailable',timestamp:null,ageSeconds:null,current:false,stale:false,missing:false};
 if(state==='OFFICIAL_CLOSE'){
  const close=lastCompletedRegularSessionCloseTimestamp(new Date(now)),latest=close!=null&&time>=Date.parse(close);
  const closed=['CLOSED','OVERNIGHT'].includes(marketSessionAt(new Date(now)));
  return{label:latest?(closed?'Market closed · official close':'Official close · live quote unavailable'):'Stale official close',timestamp:stamp,ageSeconds,current:latest&&closed,stale:!latest||!closed,missing:false};
 }
 const maxAge=session==='CRYPTO_24X7'?300:session==='REGULAR'?90:180;
 const currentSession=session==='CRYPTO_24X7'||marketSessionAt(new Date(now))===session;
 const live=state.startsWith('LIVE_')&&ageSeconds!<=maxAge&&currentSession;
 const label=live?(session==='CRYPTO_24X7'?'24/7 · live · single source':state.replaceAll('_',' ')):(state.startsWith('LIVE_')||state==='STALE'?'Stale price · refresh pending':'Price unverified');
 return{label,timestamp:stamp,ageSeconds,current:live,stale:!live,missing:false};
}

export function quoteCoverage(rows:any[],quotes:Record<string,any>,now=Date.now()){
 const result={total:0,priced:0,current:0,stale:0,missing:0};
 for(const row of rows){if(row.asset_type==='CASH')continue;result.total++;const status=quoteStatus(quotes[row.symbol]?.market,now);if(status.missing)result.missing++;else{result.priced++;if(status.current)result.current++;else result.stale++;}}
 return result;
}

/** Closed equities do not need repeated polling; crypto has no closing session. */
export function nextQuoteRefresh(symbols:string[],quotes:Record<string,any>,cursor:number,now=Date.now(),limit=6){
 const selected:string[]=[];let examined=0;
 while(examined<symbols.length&&selected.length<limit){
  const symbol=symbols[(cursor+examined)%symbols.length],market=quotes[symbol]?.market;examined++;
  if(market?.priceState==='OFFICIAL_CLOSE'&&quoteStatus(market,now).current)continue;
  selected.push(symbol);
 }
 return{symbols:selected,cursor:symbols.length?(cursor+examined)%symbols.length:0};
}
