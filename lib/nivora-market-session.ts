export type MarketSession="PRE_MARKET"|"REGULAR"|"AFTER_HOURS"|"OVERNIGHT"|"CLOSED";
export type QuoteFreshness="LIVE"|"STALE"|"LAST_TRADE";
export type MarketCalendarState="OPEN"|"CLOSED"|"HOLIDAY"|"EARLY_CLOSE";

function nyParts(at:Date){
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",weekday:"short",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(at);
  const get=(type:string)=>parts.find(p=>p.type===type)?.value||"";
  return{weekday:get("weekday"),year:Number(get("year")),month:Number(get("month")),day:Number(get("day")),hour:Number(get("hour")),minute:Number(get("minute"))};
}

const iso=(y:number,m:number,d:number)=>`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const dow=(y:number,m:number,d:number)=>new Date(Date.UTC(y,m-1,d)).getUTCDay();
function nthWeekday(y:number,m:number,weekday:number,n:number){let d=1;while(dow(y,m,d)!==weekday)d++;return d+(n-1)*7;}
function lastWeekday(y:number,m:number,weekday:number){let d=new Date(Date.UTC(y,m,0)).getUTCDate();while(dow(y,m,d)!==weekday)d--;return d;}
function observedFixed(y:number,m:number,d:number){const w=dow(y,m,d);if(w===6){const dt=new Date(Date.UTC(y,m-1,d-1));return iso(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate());}if(w===0){const dt=new Date(Date.UTC(y,m-1,d+1));return iso(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate());}return iso(y,m,d);}
function easterSunday(y:number){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(Date.UTC(y,month-1,day));
}
function goodFriday(y:number){const d=easterSunday(y);d.setUTCDate(d.getUTCDate()-2);return iso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());}
function holidayDatesForYear(y:number){
  const set=new Set<string>();
  set.add(observedFixed(y,1,1));
  set.add(iso(y,1,nthWeekday(y,1,1,3))); // MLK
  set.add(iso(y,2,nthWeekday(y,2,1,3))); // Presidents
  set.add(goodFriday(y));
  set.add(iso(y,5,lastWeekday(y,5,1))); // Memorial
  set.add(observedFixed(y,6,19)); // Juneteenth
  set.add(observedFixed(y,7,4));
  set.add(iso(y,9,nthWeekday(y,9,1,1))); // Labor
  set.add(iso(y,11,nthWeekday(y,11,4,4))); // Thanksgiving
  set.add(observedFixed(y,12,25));
  // New Year's Day for the following year can be observed on Dec 31.
  set.add(observedFixed(y+1,1,1));
  return set;
}
function isEarlyCloseDate(y:number,m:number,d:number){
  const key=iso(y,m,d);
  // Day after Thanksgiving.
  const thanksgiving=nthWeekday(y,11,4,4);
  if(key===iso(y,11,thanksgiving+1))return true;
  // Christmas Eve when it is a weekday/trading day.
  if(m===12&&d===24&&dow(y,m,d)>=1&&dow(y,m,d)<=5)return true;
  // Typical July 3 early close when it is itself a trading day.
  if(m===7&&d===3&&dow(y,m,d)>=1&&dow(y,m,d)<=5&&!holidayDatesForYear(y).has(key))return true;
  return false;
}

export function marketCalendarAt(at=new Date()){
  const p=nyParts(at),key=iso(p.year,p.month,p.day),weekend=p.weekday==="Sat"||p.weekday==="Sun";
  const holiday=!weekend&&holidayDatesForYear(p.year).has(key);
  const isTradingDay=!weekend&&!holiday;
  const early=isTradingDay&&isEarlyCloseDate(p.year,p.month,p.day);
  const closeMinutes=early?13*60:16*60;
  const mins=p.hour*60+p.minute;
  let session:MarketSession="CLOSED";
  if(isTradingDay){
    if(mins>=4*60&&mins<9*60+30)session="PRE_MARKET";
    else if(mins>=9*60+30&&mins<closeMinutes)session="REGULAR";
    else if(mins>=closeMinutes&&mins<20*60)session="AFTER_HOURS";
  }
  const calendarState:MarketCalendarState=weekend?"CLOSED":holiday?"HOLIDAY":early?"EARLY_CLOSE":"OPEN";
  return{...p,date:key,session,calendarState,isTradingDay,regularCloseMinutes:closeMinutes};
}


export function lastCompletedRegularSessionDate(at=new Date()):string|null{
  const p=nyParts(at),cal=marketCalendarAt(at),mins=p.hour*60+p.minute;
  if(cal.isTradingDay&&mins>=cal.regularCloseMinutes)return cal.date;
  const cursor=new Date(Date.UTC(p.year,p.month-1,p.day));
  for(let i=0;i<14;i++){
    cursor.setUTCDate(cursor.getUTCDate()-1);
    const y=cursor.getUTCFullYear(),m=cursor.getUTCMonth()+1,d=cursor.getUTCDate(),key=iso(y,m,d),w=dow(y,m,d);
    if(w!==0&&w!==6&&!holidayDatesForYear(y).has(key))return key;
  }
  return null;
}

function nyLocalToUtcIso(y:number,m:number,d:number,hour:number,minute=0){
  const target=Date.UTC(y,m-1,d,hour,minute);
  let guess=target;
  for(let i=0;i<3;i++){
    const p=nyParts(new Date(guess));
    const represented=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute);
    const delta=target-represented;
    guess+=delta;
    if(delta===0)break;
  }
  return new Date(guess).toISOString();
}

export function lastCompletedRegularSessionCloseTimestamp(at=new Date()):string|null{
  const date=lastCompletedRegularSessionDate(at);
  if(!date)return null;
  const [y,m,d]=date.split("-").map(Number);
  const hour=isEarlyCloseDate(y,m,d)?13:16;
  return nyLocalToUtcIso(y,m,d,hour,0);
}

export function marketSessionAt(at=new Date()):MarketSession{return marketCalendarAt(at).session;}

export function quoteFreshness(ageSeconds:number,session:MarketSession):QuoteFreshness{
  if(session==="CLOSED"||session==="OVERNIGHT")return "LAST_TRADE";
  const maxAge=session==="REGULAR"?90:180;
  return Number.isFinite(ageSeconds)&&ageSeconds<=maxAge?"LIVE":"STALE";
}

export function marketSessionLabel(session:MarketSession){
  return session==="PRE_MARKET"?"PRE-MARKET":session==="AFTER_HOURS"?"AFTER-HOURS":session;
}
