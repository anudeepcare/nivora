import type {Bar} from "../../nivora-technical-engine";
import type {MarketSession} from "../../nivora-market-session";

export function completedDailyBars<T extends Bar>(rows:T[],calendar:{date:string;session:MarketSession}):T[]{
  if(!Array.isArray(rows)||rows.length===0)return[];
  const lastDay=String(rows.at(-1)?.datetime||'').slice(0,10);
  const partialPossible=calendar.session==='PRE_MARKET'||calendar.session==='REGULAR';
  return partialPossible&&lastDay===calendar.date?rows.slice(0,-1):rows.slice();
}
