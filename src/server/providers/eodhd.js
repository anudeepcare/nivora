import {SHARED_PROVIDER_SCHEDULERS} from '../quota-scheduler.js';
import {validateProviderPayload} from '../provider-schemas.js';
import {EODHD_BY_ID} from '../eodhd-catalog.js';
const clean=s=>s.toUpperCase().includes('.')?s.toUpperCase():`${s.toUpperCase()}.US`;
const qs=o=>{const p=new URLSearchParams();for(const[k,v]of Object.entries(o||{}))if(v!==undefined&&v!==null&&v!=='')p.set(k,String(v));return p};
const hn=(h,k)=>{const v=h?.get?.(k);return v==null?null:Number(v)};
const retrySeconds=h=>{const raw=h?.get?.('retry-after');if(raw==null)return 60;const numeric=Number(raw);if(Number.isFinite(numeric)&&numeric>=0)return numeric;const at=Date.parse(raw);return Number.isFinite(at)?Math.max(0,Math.ceil((at-Date.now())/1000)):60};
export class EodhdProvider{
  constructor({token,fetcher=fetch,baseUrl='https://eodhd.com',scheduler=SHARED_PROVIDER_SCHEDULERS.eodhd}){this.token=token;this.fetcher=fetcher;this.baseUrl=baseUrl.replace(/\/$/,'');this.scheduler=scheduler}
  catalog(id,{path={},query={},body={}}={}){const endpoint=EODHD_BY_ID.get(id);if(!endpoint)return Promise.resolve({status:'invalid-request',source:'EODHD',data:null,reason:'Unknown documented endpoint id',entitlement:'unknown'});let resolved=endpoint.path;for(const name of resolved.matchAll(/\{([^}]+)\}/g)){const value=path[name[1]];if(value===undefined||value===null||value==='')return Promise.resolve({status:'invalid-request',source:'EODHD',data:null,reason:`Missing path parameter ${name[1]}`,entitlement:'unknown'});resolved=resolved.replace(name[0],encodeURIComponent(String(value)))}return this.request(resolved,query,endpoint.schema,{weight:endpoint.weight,method:endpoint.method,requestBody:body})}
  async request(path,params={},schema,{weight=1,method='GET',requestBody={}}={}){
    if(!this.token)return{status:'unavailable',source:'EODHD',data:null,reason:'EODHD_API_TOKEN is not configured',entitlement:'unknown'};
    const p=qs({...params,api_token:this.token,fmt:'json'}),scheduled=await this.scheduler.schedule(async signal=>{const options={signal,method,headers:{Accept:'application/json'}};if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify(requestBody)}const response=await this.fetcher(`${this.baseUrl}${path}?${p}`,options);try{return{response,body:await response.json(),parseError:false}}catch{return{response,body:{},parseError:true}}},{weight});
    if(['timeout','network-error','invalid-request','busy'].includes(scheduled?.status))return{...scheduled,source:'EODHD'};
    const{response:r,body,parseError}=scheduled,rateLimit={remaining:hn(r.headers,'x-ratelimit-remaining'),limit:hn(r.headers,'x-ratelimit-limit')},base={source:'EODHD',httpStatus:r.status,rateLimit,data:null};
    if(r.status===401)return{...base,status:'unauthorized',entitlement:'unverified'};
    if(r.status===403)return{...base,status:'restricted',entitlement:'restricted'};
    if(r.status===404)return{...base,status:'no-coverage',entitlement:'unknown'};
    if(r.status===429){const seconds=retrySeconds(r.headers);this.scheduler.deferFor?.(seconds*1000);return{...base,status:'rate-limited',retryAfterSeconds:seconds,entitlement:'unknown'}}
    if(!r.ok)return{...base,status:'error',entitlement:'unknown'};
    if(parseError)return{...base,status:'malformed-response',schema,entitlement:'unknown'};
    const v=validateProviderPayload(schema,body);if(v.status==='invalid')return{...base,status:'malformed-response',schema,data:null,reason:v.reason,entitlement:'unknown'};return{...base,status:'live',data:body,asOf:new Date().toISOString(),entitlement:'verified'}
  }
  async quote(s){const requested=clean(s),x=await this.request(`/api/real-time/${requested}`,{},'eodhd.quote');if(x.status!=='live')return x;const returned=String(x.data.code??'').toUpperCase();if(returned!==requested)return{...x,status:'malformed-response',data:null,reason:`Quote identity mismatch for ${requested}`,entitlement:'unknown'};const timestamp=Number(x.data.timestamp),date=new Date(timestamp*1000),asOf=Number.isFinite(timestamp)&&timestamp>0&&Number.isFinite(date.getTime())?date.toISOString():null,optional=value=>value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;return{...x,asOf,data:{symbol:returned,price:Number(x.data.close),currency:typeof x.data.currency==='string'?x.data.currency.toUpperCase():null,change:optional(x.data.change),changePercent:optional(x.data.change_p)}}}
  history(s,p={}){return this.request(`/api/eod/${clean(s)}`,{period:'d',order:'a',...p},'eodhd.history')}
  intraday(s,p={}){return this.request(`/api/intraday/${clean(s)}`,p,'eodhd.list')}
  fundamentals(s){return this.request(`/api/v1.1/fundamentals/${clean(s)}`,{},'eodhd.fundamentals',{weight:10})}
  news(s,p={}){return this.request('/api/news',{s:clean(s),limit:50,...p},'eodhd.list')}
  sentiment(s,p={}){return this.request('/api/sentiments',{s:clean(s),...p},'eodhd.object')}
  earnings(p={}){return this.request('/api/calendar/earnings',p,'eodhd.object')}
  dividends(s,p={}){return this.request(`/api/div/${clean(s)}`,p,'eodhd.dividends')}
  splits(s,p={}){return this.request(`/api/splits/${clean(s)}`,p,'eodhd.list')}
  technical(s,p={}){return this.request(`/api/technical/${clean(s)}`,p,'eodhd.list')}
  insiderTransactions(s,p={}){return this.request('/api/insider-transactions',{code:clean(s),...p},'eodhd.list')}
  search(q,{limit=10}={}){return this.request(`/api/search/${encodeURIComponent(q)}`,{limit},'eodhd.list')}
  exchangeSymbols(ex){return this.request(`/api/exchange-symbol-list/${encodeURIComponent(ex)}`,{},'eodhd.list')}
  exchanges(){return this.request('/api/exchanges-list',{},'eodhd.list')}
  account(){return this.request('/api/user',{},'eodhd.object')}
}
