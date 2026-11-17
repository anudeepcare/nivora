const finite=v=>typeof v==='number'&&Number.isFinite(v);const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));const hasKnown=(x,keys)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&keys.some(k=>Object.hasOwn(x,k));
const validators={
  'sentisense.rating':x=>typeof x?.rated==='boolean'&&(!x.rated||(finite(x.score)&&['A','B','C','D','F'].includes(x.letter)))&&date(x.asOf),
  'sentisense.price':x=>finite(x?.currentPrice??x?.price),
  'sentisense.analyst':x=>hasKnown(x,['ticker','targetMean','consensusLabel','estimates','history','actions','firms'])&&(!('targetMean'in x)||finite(x.targetMean)),
  'sentisense.list':x=>Array.isArray(x)||Array.isArray(x?.results)||Array.isArray(x?.data),
  'sentisense.object':x=>hasKnown(x,['ticker','data','results','market','calendars','screens','fields','estimates','kpis','currentPrice','trackerId','indexId','status','name','items','holdings','summary']),
  'sentisense.documents':x=>Array.isArray(x?.documents)&&Number.isInteger(x?.totalCount),
  'sentisense.estimates':x=>typeof x?.ticker==='string'&&Array.isArray(x?.estimates)&&Array.isArray(x?.surprises),
  'sentisense.holders':x=>typeof x?.ticker==='string'&&Array.isArray(x?.holders),
  'sentisense.options':x=>x===null||(x!==null&&typeof x==='object'&&!Array.isArray(x)&&date(x.asOf)&&(!Object.hasOwn(x,'sentiment')||(finite(x.sentiment)&&x.sentiment>=-1&&x.sentiment<=1))&&hasKnown(x,['latest','context','oiWalls','unusual','pcVol','atmIv','expectedMove1d','ivRank1y','pcVolPctl1y','maxPain'])),
  'sentisense.screener':x=>Array.isArray(x)||Array.isArray(x?.results)||Array.isArray(x?.items),
  'sentisense.catalog':x=>(Array.isArray(x)||hasKnown(x,['ticker','data','results','market','documents','stories','totalCount','indexes','trackers','calendars','screens','fields','estimates','kpis','currentPrice','trackerId','indexId','name','items','holdings','summary','count','activity','institutions','quarters','members']))&&!['error','failed','failure'].includes(String(x?.status||'').toLowerCase()),
  'eodhd.quote':x=>finite(Number(x?.close))&&Number(x.close)>0,
  'eodhd.history':x=>Array.isArray(x)&&x.length>0&&x.every(r=>{const raw=r?.adjusted_close??r?.close;if(typeof raw==='string'&&raw.trim()==='')return false;const value=typeof raw==='number'?raw:Number(raw);return date(r?.date)&&finite(value)&&value>0}),
  'eodhd.fundamentals':x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&typeof x.General==='object',
  'eodhd.dividends':x=>Array.isArray(x)&&x.every(r=>date(r?.date)&&finite(r?.value)&&finite(r?.unadjustedValue)&&typeof r?.currency==='string'&&r.currency.trim().length>0&&['declarationDate','recordDate','paymentDate'].every(key=>r[key]==null||date(r[key]))&&(r.period==null||typeof r.period==='string')),
  'eodhd.list':x=>Array.isArray(x),
  'eodhd.catalog':x=>Array.isArray(x)||hasKnown(x,['code','name','data','meta','earnings','sentiment','General','usage','apiRequests','exchanges','results','type','date','components','links','attributes']),
  'eodhd.object':x=>hasKnown(x,['code','name','data','earnings','sentiment','General','usage','apiRequests','exchanges','results','type','date','components'])
};
export function validateProviderPayload(schema,payload){if(!schema)return{status:'valid',data:payload};const ok=validators[schema]?.(payload)??false;return ok?{status:'valid',data:payload}:{status:'invalid',data:null,reason:`Payload failed ${schema} contract`}}
