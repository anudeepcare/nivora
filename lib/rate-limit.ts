type Hit={count:number;reset:number};
const g=globalThis as any;
if(!g.__nivoraRate)g.__nivoraRate=new Map<string,Hit>();
const store:Map<string,Hit>=g.__nivoraRate;
export function rateLimit(key:string,limit=90,windowMs=60_000){
 const now=Date.now();let h=store.get(key);
 if(!h||h.reset<=now){h={count:0,reset:now+windowMs};store.set(key,h)}
 h.count++;
 return {ok:h.count<=limit,remaining:Math.max(0,limit-h.count),reset:h.reset};
}
export function requestKey(req:Request){
 const f=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
 return f||req.headers.get("x-real-ip")||"anonymous";
}
