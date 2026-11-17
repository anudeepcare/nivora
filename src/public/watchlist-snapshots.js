export const WATCHLIST_SNAPSHOTS_KEY='auryn.watchlist.snapshots.v1';
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const date=value=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const parsed=new Date(value+'T00:00:00Z');return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value?parsed:null};
const canonical=value=>{if(typeof value!=='string'||!/^[A-Z0-9._-]{1,15}$/.test(value))return null;return value.includes('.')?value:`${value}.US`};
const addDays=(value,days)=>new Date(value.getTime()+days*86_400_000);
const round=(value,digits=2)=>Number(value.toFixed(digits));

function validSnapshot(value){return value&&canonical(value.symbol)&&value.currency==='USD'&&typeof value.zone==='string'&&finite(value.currentPrice)&&value.currentPrice>0&&finite(value.baseGapPercent)&&date(value.priceAsOf)&&date(value.scenarioAsOf)&&typeof value.observedAt==='string'&&Number.isFinite(Date.parse(value.observedAt))}
function summary(rows){
  if(!Array.isArray(rows)||!rows.length)return{status:'empty'};
  const current=rows.at(-1),nextReview=new Date(Math.min(addDays(date(current.priceAsOf),7),addDays(date(current.scenarioAsOf),200))).toISOString().slice(0,10);
  if(rows.length<2)return{status:'baseline',current,nextReview};
  const previous=rows.at(-2),priceDelta=current.currentPrice-previous.currentPrice,priceDeltaPercent=priceDelta/previous.currentPrice*100;
  return{status:'changed',current,previous,nextReview,change:{priceDelta:round(priceDelta),priceDeltaPercent:round(priceDeltaPercent,1),baseGapDelta:round(current.baseGapPercent-previous.baseGapPercent,1),zoneFrom:previous.zone,zoneTo:current.zone}}
}

export class WatchlistSnapshots{
  constructor(storage){this.storage=storage;this.rows={};this.status='available';const raw=storage.getItem(WATCHLIST_SNAPSHOTS_KEY);if(raw===null)return;try{const parsed=JSON.parse(raw);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object'||Object.entries(parsed).some(([symbol,rows])=>!canonical(symbol)||!Array.isArray(rows)||rows.length>2||rows.some(row=>!validSnapshot(row))))throw new Error('invalid');this.rows=parsed}catch{this.status='recovery-required';this.raw=raw}}
  record(evidence,{observedAt=new Date()}={}){if(this.status!=='available')return{status:this.status};const symbol=canonical(evidence?.symbol);if(evidence?.status!=='available'||!symbol||evidence.currency!=='USD'||typeof evidence.zone!=='string'||!finite(evidence.currentPrice)||evidence.currentPrice<=0||!finite(evidence.baseGapPercent)||!(observedAt instanceof Date)||!Number.isFinite(observedAt.getTime()))return{status:'invalid'};const price=date(evidence.priceAsOf),scenario=date(evidence.scenarioAsOf),today=new Date(observedAt.toISOString().slice(0,10)+'T00:00:00Z');if(!price||!scenario||price>today||scenario>today)return{status:'invalid'};const snapshot={symbol,currency:'USD',zone:evidence.zone,currentPrice:evidence.currentPrice,baseGapPercent:evidence.baseGapPercent,priceAsOf:evidence.priceAsOf,scenarioAsOf:evidence.scenarioAsOf,observedAt:observedAt.toISOString()},rows=[...(this.rows[symbol]??[]),snapshot].slice(-2);this.rows[symbol]=rows;try{this.storage.setItem(WATCHLIST_SNAPSHOTS_KEY,JSON.stringify(this.rows))}catch{this.persistenceError=true;return{...summary(rows),status:'storage-error',reason:'snapshot-persistence-failed'}}return summary(rows)}
  forSymbol(symbol){const key=canonical(symbol);return this.status==='available'?summary(key?this.rows[key]??[]:[]):{status:this.status}}
  summaries(){return new Map(Object.keys(this.rows).map(symbol=>[symbol,summary(this.rows[symbol])]))}
  clear(symbol){const key=canonical(symbol);if(this.status!=='available'||!key||!this.rows[key])return;delete this.rows[key];try{this.storage.setItem(WATCHLIST_SNAPSHOTS_KEY,JSON.stringify(this.rows))}catch{this.persistenceError=true}}
}
