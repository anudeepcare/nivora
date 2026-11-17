import {SHARED_PROVIDER_SCHEDULERS} from '../quota-scheduler.js';
import {validateProviderPayload} from '../provider-schemas.js';
import {SENTISENSE_BY_ID} from '../sentisense-catalog.js';

const qs=o=>{const p=new URLSearchParams();for(const[k,v]of Object.entries(o||{}))if(v!==undefined&&v!==null&&v!=='')p.set(k,String(v));return p.toString()};
const headerNumber=(h,k)=>{const v=h?.get?.(k);return v===null||v===undefined?null:Number(v)};
const retrySeconds=h=>{const raw=h?.get?.('retry-after');if(raw==null)return 60;const numeric=Number(raw);if(Number.isFinite(numeric)&&numeric>=0)return numeric;const at=Date.parse(raw);return Number.isFinite(at)?Math.max(0,Math.ceil((at-Date.now())/1000)):60};

export class SentiSenseProvider{
  constructor({token,fetcher=fetch,baseUrl='https://app.sentisense.ai',scheduler=SHARED_PROVIDER_SCHEDULERS.sentisense}){this.token=token;this.fetcher=fetcher;this.baseUrl=baseUrl.replace(/\/$/,'');this.scheduler=scheduler}
  supportedTicker(t){return typeof t==='string'&&/^[A-Z0-9._-]{1,15}$/i.test(t)?t.toUpperCase():null}
  unsupportedMarket(){return Promise.resolve({status:'unsupported-market',source:'SentiSense Pro',data:null,reason:'This canonical security has no verified SentiSense symbol mapping.',entitlement:'unknown'})}
  catalog(id,{path={},query={},body={}}={}){const endpoint=SENTISENSE_BY_ID.get(id);if(!endpoint)return Promise.resolve({status:'invalid-request',source:'SentiSense Pro',data:null,reason:'Unknown documented endpoint id',entitlement:'unknown'});let resolved=endpoint.path;for(const name of resolved.matchAll(/\{([^}]+)\}/g)){const value=path[name[1]];if(value===undefined||value===null||value==='')return Promise.resolve({status:'invalid-request',source:'SentiSense Pro',data:null,reason:`Missing path parameter ${name[1]}`,entitlement:'unknown'});resolved=resolved.replace(name[0],encodeURIComponent(String(value)))}return this.request(resolved,endpoint.method==='POST'?body:query,{method:endpoint.method,schema:endpoint.schema})}
  async request(path,params={},options={}){
    if(!this.token)return{status:'unavailable',source:'SentiSense Pro',data:null,reason:'SENTISENSE_API_KEY is not configured',entitlement:'unknown'};
    const query=options.method==='POST'?'':qs(params),url=`${this.baseUrl}${path}${query?'?'+query:''}`,baseOptions={method:options.method||'GET',headers:{'X-SentiSense-API-Key':this.token,Accept:'application/json',...(options.method==='POST'?{'Content-Type':'application/json'}:{})}};if(options.method==='POST')baseOptions.body=JSON.stringify(params);
    const scheduled=await this.scheduler.schedule(async signal=>{const response=await this.fetcher(url,{...baseOptions,signal});try{return{response,body:await response.json(),parseError:false}}catch{return{response,body:{},parseError:true}}},{weight:options.weight||1});
    if(['timeout','network-error','invalid-request','busy'].includes(scheduled?.status))return{...scheduled,source:'SentiSense Pro'};
    const{response:r,body,parseError}=scheduled,safeBody=body&&typeof body==='object'?body:{},rateLimit={remaining:headerNumber(r.headers,'x-ratelimit-remaining'),limit:headerNumber(r.headers,'x-ratelimit-limit'),resetAt:r.headers?.get?.('x-ratelimit-reset')??null},base={source:'SentiSense Pro',httpStatus:r.status,rateLimit,data:null,errorCode:safeBody.error||null};
    if(r.status===401)return{...base,status:'unauthorized',reason:safeBody.message||'API key rejected',entitlement:'unverified'};
    if(r.status===403)return{...base,status:'restricted',reason:safeBody.message||'Endpoint not included in plan',entitlement:'restricted'};
    if(r.status===404)return{...base,status:['no_coverage','entity_not_found','ticker_is_etf','ticker_is_index'].includes(safeBody.error)?'no-coverage':'not-found',reason:safeBody.coverage?.message||safeBody.message||'No data',entitlement:'unknown'};
    if(r.status===429){const seconds=retrySeconds(r.headers);this.scheduler.deferFor?.(seconds*1000);return{...base,status:'rate-limited',retryAfterSeconds:seconds,entitlement:'unknown'}}
    if(!r.ok)return{...base,status:'error',reason:safeBody.message||`HTTP ${r.status}`,entitlement:'unknown'};
    if(['error','failed','failure'].includes(String(safeBody.status||'').toLowerCase())||safeBody.success===false)return{...base,status:'error',reason:safeBody.message||safeBody.error||'Provider returned an error envelope',entitlement:'unknown'};
    if(parseError||body===null||typeof body!=='object')return{...base,status:'malformed-response',schema:options.schema||null,entitlement:'unknown'};
    const data=Object.hasOwn(body,'data')?body.data:body,validation=validateProviderPayload(options.schema,data);if(validation.status==='invalid')return{...base,status:'malformed-response',schema:options.schema,data:null,reason:validation.reason,entitlement:'unknown'};if(options.schema==='sentisense.options'&&data===null)return{...base,status:'no-coverage',data:null,reason:'No options snapshot is available for this ticker.',entitlement:'unknown',isPreview:!!body.isPreview,previewReason:body.previewReason||null};return{...base,status:body.isPreview?'preview':'live',data,isPreview:!!body.isPreview,previewReason:body.previewReason||null,sampleCompany:body.sampleCompany??null,asOf:body.updatedAt||body.asOf||data?.asOf||new Date().toISOString(),entitlement:body.isPreview?'preview':'verified'}
  }
  price(t){return this.request('/api/v1/stocks/price',{ticker:t.toUpperCase()},{schema:'sentisense.price'})}
  profile(t){return this.request(`/api/v1/stocks/${t.toUpperCase()}/profile`,{},{schema:'sentisense.object'})}
  rating(t){const s=this.supportedTicker(t);return s?this.request(`/api/v1/rating/${s}`,{},{schema:'sentisense.rating'}):this.unsupportedMarket()}
  analystRatings(t){const s=this.supportedTicker(t);return s?this.request(`/api/v1/analyst/${s}/consensus`,{},{schema:'sentisense.analyst'}):this.unsupportedMarket()}
  analystEstimates(t){const s=this.supportedTicker(t);return s?this.request(`/api/v1/analyst/${s}/estimates`,{},{schema:'sentisense.estimates'}):this.unsupportedMarket()}
  documents(t,p={}){const s=this.supportedTicker(t);return s?this.request(`/api/v1/documents/ticker/${s}`,p,{schema:'sentisense.documents'}):this.unsupportedMarket()}
  earnings(t,{limit=4}={}){const s=this.supportedTicker(t);return s?this.request(`/api/v1/stocks/${s}/earnings-summaries`,{limit},{schema:'sentisense.list'}):this.unsupportedMarket()}
  earningsReactions(t){return this.request(`/api/v1/stocks/${t.toUpperCase()}/earnings/reactions`,{},{schema:'sentisense.object'})}
  whatChanged(t){return this.request(`/api/v1/stocks/${t.toUpperCase()}/what-changed`,{},{schema:'sentisense.list'})}
  kpis(t){return this.request(`/api/v1/stocks/${t.toUpperCase()}/kpis`,{},{schema:'sentisense.object'})}
  fundamentalsCurrent(t){return this.request('/api/v1/stocks/fundamentals/current',{ticker:t.toUpperCase()},{schema:'sentisense.object'})}
  insiders(t,{lookbackDays=90}={}){const s=this.supportedTicker(t);return s?this.request(`/api/v1/insider/trades/${s}`,{lookbackDays},{schema:'sentisense.list'}):this.unsupportedMarket()}
  politicians(t,{lookbackDays=90}={}){const s=this.supportedTicker(t);return s?this.request(`/api/v1/politicians/filings/${s}`,{lookbackDays},{schema:'sentisense.list'}):this.unsupportedMarket()}
  institutionalHolders(t){const s=this.supportedTicker(t);return s?this.request(`/api/v1/institutional/holders/${s}`,{},{schema:'sentisense.holders'}):this.unsupportedMarket()}
  optionsSummary(t){const s=this.supportedTicker(t);return s?this.request(`/api/v1/stocks/${s}/options/summary`,{},{schema:'sentisense.options'}):this.unsupportedMarket()}
  insights(t){return this.request(`/api/v1/insights/stock/${t.toUpperCase()}`,{},{schema:'sentisense.list'})}
  calendar(p={}){return this.request('/api/v1/calendar/earnings',p,{schema:'sentisense.list'})}
  screener(p={}){return this.request('/api/v1/screener/execute',p,{method:'POST',schema:'sentisense.screener'})}
  screenerFields(){return this.request('/api/v1/screener/fields',{},{schema:'sentisense.object'})}
  sentiment(t){return this.rating(t)}
}
