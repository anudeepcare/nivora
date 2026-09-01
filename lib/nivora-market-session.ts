export type MarketSession="PRE_MARKET"|"REGULAR"|"AFTER_HOURS"|"OVERNIGHT"|"CLOSED";
export type QuoteFreshness="LIVE"|"STALE"|"LAST_TRADE";

function nyParts(at:Date){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",weekday:"short",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(at);
  const get=(type:string)=>parts.find(p=>p.type===type)?.value||"";
  return{weekday:get("weekday"),hour:Number(get("hour")),minute:Number(get("minute"))};
}

export function marketSessionAt(at=new Date()):MarketSession{
  const {weekday,hour,minute}=nyParts(at);
  if(weekday==="Sat"||weekday==="Sun")return "CLOSED";
  const mins=hour*60+minute;
  if(mins>=4*60&&mins<9*60+30)return "PRE_MARKET";
  if(mins>=9*60+30&&mins<16*60)return "REGULAR";
  if(mins>=16*60&&mins<20*60)return "AFTER_HOURS";
  return "CLOSED";
}

export function quoteFreshness(ageSeconds:number,session:MarketSession):QuoteFreshness{
  if(session==="CLOSED"||session==="OVERNIGHT")return "LAST_TRADE";
  const maxAge=session==="REGULAR"?90:180;
  return Number.isFinite(ageSeconds)&&ageSeconds<=maxAge?"LIVE":"STALE";
}

export function marketSessionLabel(session:MarketSession){
  return session==="PRE_MARKET"?"PRE-MARKET":session==="AFTER_HOURS"?"AFTER-HOURS":session;
}
