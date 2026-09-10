import {NextResponse} from "next/server";
import {loadCanonicalMarketSnapshots} from "@/lib/auryn/market-data-gateway";
import {nowIso} from "@/lib/shared-cache";
const pct=(a:number,b:number)=>b?((a/b)-1)*100:0;const rnd=(n:number)=>Math.round(n*100)/100;
export async function GET(){
 const twelveKey=process.env.TWELVE_DATA_API_KEY||"",alpacaKey=process.env.ALPACA_PAPER_API_KEY||"",alpacaSecret=process.env.ALPACA_PAPER_API_SECRET||"";
 if(!twelveKey&&!alpacaKey)return NextResponse.json({items:[],regime:"Unavailable"});
 try{
  const symbols=['SPY','QQQ','IWM'];const results=await loadCanonicalMarketSnapshots(symbols.map(symbol=>({symbol,twelveKey,alpacaKey,alpacaSecret,asOf:new Date()})),3);
  const items=symbols.map(symbol=>{const s=results.get(symbol)?.snapshot;if(!s||s.displayPrice==null)return null;const base=s.regularClose??s.displayPrice;const move=pct(s.displayPrice,base);const trend=move>.2?'Strong':move<-.2?'Weak':'Mixed';return{symbol,price:rnd(s.displayPrice),changePct:rnd(move),trend,marketTruth:s,priceRole:s.priceUse,snapshotId:s.snapshotId};}).filter(Boolean);
  const strong=items.filter((x:any)=>x.trend==='Strong').length,weak=items.filter((x:any)=>x.trend==='Weak').length;const regime=strong>=2?'Risk-on':weak>=2?'Risk-off':'Mixed';
  return NextResponse.json({items,regime,freshness:{at:nowIso(),ttlSeconds:20},truth:'CANONICAL_MARKET_GATEWAY'},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
 }catch{return NextResponse.json({items:[],regime:"Unavailable"},{status:503})}
}
