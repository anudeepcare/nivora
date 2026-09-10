import type {Bar} from '../../nivora-technical-engine';
import type {StructuralLevelEvidence,StructuralPriceMap,StructuralZone,AurynTimeframe} from './domain';
import {computeAtr,smaN,emaN,typicalPriceVwap} from './indicators';

const rnd=(n:number,d=2)=>Math.round(n*10**d)/10**d;
const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));

type Candidate={price:number;side:'SUPPORT'|'RESISTANCE';weight:number;kind:string;timeframe:AurynTimeframe|'MULTI';note:string};

function pivots(rows:Bar[],left=3,right=3){
  const out:{i:number;price:number;side:'SUPPORT'|'RESISTANCE'}[]=[];
  for(let i=left;i<rows.length-right;i++){
    const w=rows.slice(i-left,i+right+1),r=rows[i];
    if(r.low===Math.min(...w.map(x=>x.low)))out.push({i,price:r.low,side:'SUPPORT'});
    if(r.high===Math.max(...w.map(x=>x.high)))out.push({i,price:r.high,side:'RESISTANCE'});
  }
  return out;
}
function add(c:Candidate[],price:number|null|undefined,side:Candidate['side'],weight:number,kind:string,timeframe:Candidate['timeframe'],note:string){if(price!=null&&Number.isFinite(price)&&price>0)c.push({price,side,weight,kind,timeframe,note});}
function candidateSet(rows:Bar[],tf:AurynTimeframe,price:number){
  const c:Candidate[]=[];const atr=computeAtr(rows)||price*.02;const ps=pivots(rows,3,3).slice(-36);
  for(const p of ps){const recency=1+Math.max(0,(p.i-(rows.length-80))/80);add(c,p.price,p.price<=price?'SUPPORT':'RESISTANCE',2.2*recency,'SWING_PIVOT',tf,`${tf} swing ${p.price<=price?'support':'resistance'} pivot.`)}
  const closes=rows.map(x=>x.close);
  for(const [kind,v,w] of [
    ['SMA20',smaN(closes,20),1.25],['EMA20',emaN(closes,20),1.35],['SMA50',smaN(closes,50),1.5],['EMA50',emaN(closes,50),1.55],['SMA100',smaN(closes,100),1.2],['EMA100',emaN(closes,100),1.2],['SMA200',smaN(closes,200),1.65],['EMA200',emaN(closes,200),1.65]
  ] as const){if(v!=null)add(c,v,v<=price?'SUPPORT':'RESISTANCE',w,kind,tf,`${kind} dynamic level.`)}
  const recent=rows.slice(-Math.min(80,rows.length));if(recent.length>=20){
    const hi=Math.max(...recent.map(x=>x.high)),lo=Math.min(...recent.map(x=>x.low)),range=hi-lo;
    for(const f of [.236,.382,.5,.618,.786]){const lv=hi-range*f;add(c,lv,lv<=price?'SUPPORT':'RESISTANCE',1.1,'FIBONACCI',tf,`${tf} ${Math.round(f*1000)/10}% retracement of recent range.`)}
    const lowIndex=rows.findIndex(x=>x.low===lo),highIndex=rows.findIndex(x=>x.high===hi);const avLow=typicalPriceVwap(rows,Math.max(0,lowIndex)),avHigh=typicalPriceVwap(rows,Math.max(0,highIndex));
    if(avLow)add(c,avLow,avLow<=price?'SUPPORT':'RESISTANCE',1.7,'ANCHORED_VWAP',tf,`${tf} volume-weighted price anchored near the recent range low.`);
    if(avHigh)add(c,avHigh,avHigh<=price?'SUPPORT':'RESISTANCE',1.45,'ANCHORED_VWAP',tf,`${tf} volume-weighted price anchored near the recent range high.`);
  }
  for(let i=Math.max(1,rows.length-100);i<rows.length;i++){
    const a=rows[i-1],b=rows[i];if(b.low>a.high){const mid=(b.low+a.high)/2;add(c,mid,mid<=price?'SUPPORT':'RESISTANCE',1.35,'GAP_EDGE',tf,`${tf} upside gap acceptance zone.`)}
    if(b.high<a.low){const mid=(b.high+a.low)/2;add(c,mid,mid<=price?'SUPPORT':'RESISTANCE',1.35,'GAP_EDGE',tf,`${tf} downside gap supply zone.`)}
  }
  const tol=atr*.32;for(const p of ps){const touches=rows.slice(-120).filter(r=>Math.min(Math.abs(r.low-p.price),Math.abs(r.high-p.price),Math.abs(r.close-p.price))<=tol).length;if(touches>=2)add(c,p.price,p.price<=price?'SUPPORT':'RESISTANCE',Math.min(2.5,.55*touches),'REPEATED_TOUCH',tf,`${touches} recent reactions clustered near this price.`)}
  return{candidates:c,atr};
}
function cluster(cands:Candidate[],atr:number,price:number):StructuralZone[]{
  const tol=Math.max(price*.0025,atr*.42);const sorted=cands.slice().sort((a,b)=>a.price-b.price);const groups:Candidate[][]=[];
  for(const c of sorted){const g=groups.at(-1);const mid=g?g.reduce((a,x)=>a+x.price*x.weight,0)/g.reduce((a,x)=>a+x.weight,0):null;if(!g||mid==null||Math.abs(c.price-mid)>tol||g[0].side!==c.side)groups.push([c]);else g.push(c)}
  return groups.map(g=>{const total=g.reduce((a,x)=>a+x.weight,0),mid=g.reduce((a,x)=>a+x.price*x.weight,0)/total;const width=Math.max(price*.0015,Math.min(atr*.28,tol*.7));const evidence:StructuralLevelEvidence[]=g.sort((a,b)=>b.weight-a.weight).slice(0,7).map(x=>({kind:x.kind,timeframe:x.timeframe,price:rnd(x.price),weight:rnd(x.weight,2),note:x.note}));const score=clamp(total*9+evidence.length*4,5,98);return{low:rnd(mid-width),high:rnd(mid+width),mid:rnd(mid),side:g[0].side,score:Math.round(score),confidence:score>=72?'HIGH':score>=46?'MEDIUM':'LOW',evidence} as StructuralZone}).sort((a,b)=>a.mid-b.mid);
}
function nearest(z:StructuralZone[],price:number,side:'SUPPORT'|'RESISTANCE'){const xs=z.filter(x=>x.side===side&&(side==='SUPPORT'?x.mid<price:x.mid>price));return side==='SUPPORT'?xs.sort((a,b)=>b.mid-a.mid):xs.sort((a,b)=>a.mid-b.mid)}

export function buildStructuralPriceMap(daily:Bar[],weekly:Bar[]=[]):StructuralPriceMap|null{
  if(!daily?.length||daily.length<40)return null;const price=daily.at(-1)!.close,asOf=String(daily.at(-1)!.datetime);const ds=candidateSet(daily,'1D',price);let cands=ds.candidates.slice(),atr=ds.atr;
  if(weekly.length>=20){const ws=candidateSet(weekly,'1W',price);cands=cands.concat(ws.candidates.map(x=>({...x,weight:x.weight*1.35,timeframe:'1W'})));atr=Math.max(atr,ws.atr/Math.sqrt(5));}
  const zones=cluster(cands,atr,price);let supports=nearest(zones,price,'SUPPORT'),res=nearest(zones,price,'RESISTANCE');
  if(!supports.length){const e:StructuralLevelEvidence[]=[{kind:'ATR_FALLBACK',timeframe:'1D',price:rnd(price-atr*1.4),weight:1,note:'ATR fallback used because no confluence support cluster was available.'}];supports=[{low:rnd(price-atr*1.6),high:rnd(price-atr*1.2),mid:rnd(price-atr*1.4),side:'SUPPORT',score:25,confidence:'LOW',evidence:e}]}
  if(!res.length){const e:StructuralLevelEvidence[]=[{kind:'ATR_FALLBACK',timeframe:'1D',price:rnd(price+atr*1.4),weight:1,note:'ATR fallback used because no confluence resistance cluster was available.'}];res=[{low:rnd(price+atr*1.2),high:rnd(price+atr*1.6),mid:rnd(price+atr*1.4),side:'RESISTANCE',score:25,confidence:'LOW',evidence:e}]}
  const supportZone=supports[0],major=supports[1]??supports[0],resistanceZone=res[0];const support=supportZone.mid,majorSupport=major.mid;
  let confirm=Math.max(resistanceZone.high,price+atr*.22);const t1=(res[1]?.mid??(confirm+atr*2.0)),t2=(res[2]?.mid??Math.max(t1+atr*1.4,confirm+atr*3.8));if(t1<=confirm)confirm=Math.min(confirm,t1-atr*.2);
  const invalidation=Math.min(majorSupport-atr*.55,support-atr*.9);const upper=Math.min(supportZone.high,price-atr*.08),lower=Math.max(majorSupport,supportZone.low-atr*.15);const low=Math.min(lower,upper),high=Math.max(lower,upper);
  return{preferredEntry:{low:rnd(low),high:rnd(high),confidence:supportZone.confidence,evidence:supportZone.evidence},confirm:rnd(confirm),support:rnd(support),majorSupport:rnd(majorSupport),invalidation:rnd(invalidation),t1:rnd(Math.max(t1,confirm+atr*.65)),t2:rnd(Math.max(t2,Math.max(t1,confirm+atr*.65)+atr*.8)),supportZone,resistanceZone,zones,asOf};
}
