import type {Quote} from './types';
/** Re-evaluate age on display; an old cached flag never proves freshness. */
export function quoteHealth(q:Quote|undefined,now=Date.now()):Quote|undefined{
 if(!q)return q;
 const stamp=Date.parse(q.asOf||''),parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),part=(k:string)=>parts.find(p=>p.type===k)?.value||'',minute=Number(part('hour'))*60+Number(part('minute'));
 const regular=!['Sat','Sun'].includes(part('weekday'))&&minute>=570&&minute<960;
 const continuous=/continuous/i.test(q.session),live=/^Live/.test(q.session),delayed=/delayed|indicative/i.test(q.session+' '+q.source);
 const window=live?120000:continuous?180000:delayed&&regular?45*60000:regular||/Market open|1-minute|premarket|after-hours/i.test(q.session)?180000:4*86400000;
 const badPrice=q.price!=null&&(!Number.isFinite(q.price)||q.price<=0);
 const stale=q.stale||badPrice||!Number.isFinite(stamp)||stamp>now+60000||now-stamp>window;
 return stale===q.stale&&!badPrice?q:{...q,stale,price:badPrice?null:q.price};
}
