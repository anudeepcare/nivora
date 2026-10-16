import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as guards from '../lib/manual-paper.mjs';

const id='11111111-1111-4111-8111-111111111111';
const otherId='22222222-2222-4222-8222-222222222222';
const clientOrderId=`auryn_manual_${id.replaceAll('-','')}`;
const audit=(extra={})=>({id,user_id:'admin',symbol:'IREN',side:'BUY',quantity:10,limit_price:25,status:'UNKNOWN',broker_order_id:null,created_at:'2026-10-15T14:00:00Z',broker_checked_at:null,filled_quantity:null,filled_avg_price:null,cancel_requested_at:null,cancel_status:null,...extra});
const order=(extra={})=>({id:'broker-1',clientOrderId,symbol:'IREN',side:'buy',qty:10,status:'partially_filled',filledQty:4,filledAvgPrice:24.9,submittedAt:'2026-10-15T14:00:00Z',...extra});
function harness(options={}){
 const rows=new Map((options.rows||[audit()]).map(row=>[row.id,{...row}]));
 const events=[];let submits=0,cancels=0,brokerReads=0,dbReads=0;
 const database={from(){const filters=[];let fields=null;return {
  select(){return this},eq(k,v){filters.push([k,v]);return this},is(k,v){filters.push([k,v]);return this},order(){return this},limit(){return this},
  update(value){fields=value;return this},
  result(single=false){const matched=[...rows.values()].filter(row=>filters.every(([k,v])=>(row[k]??null)===v));
   if(!fields){dbReads++;return {data:single?(matched[0]?{...matched[0]}:null):matched.map(row=>({...row})),error:options.readError?Error('read'):null};}
   events.push(fields.cancel_status==='REQUESTING'?'claim-cancel':'audit');
   if(options.writeError||options.claimError&&fields.cancel_status==='REQUESTING')return {data:null,error:Error('write')};
   if(options.claimRace&&fields.cancel_status==='REQUESTING')return {data:null,error:null};
   matched.forEach(row=>Object.assign(row,fields));return {data:single?(matched[0]?{...matched[0]}:null):matched.map(row=>({...row})),error:null};
  },async maybeSingle(){return this.result(true)},then(resolve,reject){return Promise.resolve(this.result()).then(resolve,reject)}
 }}};
 class Broker{
  constructor(){events.push('broker-init')}
  async getOrder(orderId){brokerReads++;events.push(`get:${orderId}`);if(options.brokerError)throw Error('broker');return order(options.order)}
  async getOrderByClientOrderId(clientId){brokerReads++;events.push(`lookup:${clientId}`);if(options.brokerError)throw Error('broker');return options.notFound?null:order(options.order)}
  async cancelOrder(orderId){cancels++;events.push(`cancel:${orderId}`);if(options.cancelError)throw Error('transport')}
  async submitOrder(){submits++;throw Error('GET/DELETE must never submit')}
 }
 const imports={'next/server':{NextResponse:{json:(data,init)=>Response.json(data,init)}},'@supabase/supabase-js':{createClient:()=>database},'@/lib/server/authorization':{authorizeRequest:async(req,adminOnly)=>{assert.equal(adminOnly,true);events.push('auth');return options.unauthorized?{response:Response.json({error:'Denied'},{status:403})}:{user:{id:'admin'}}}},'@/lib/alpaca-paper':{AlpacaPaperBroker:Broker},'@/lib/auryn/market-data-gateway':{},'@/lib/manual-paper.mjs':guards,'@/lib/rate-limit':{rateLimitDistributed:async()=>({ok:!options.rateLimited}),requestKey:()=>''}};
 const exports={};
 const source=ts.transpileModule(fs.readFileSync('app/api/trading-lab/manual/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,require:n=>imports[n],process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'test',ALPACA_PAPER_API_KEY:options.unconfigured?'':'test',ALPACA_PAPER_API_SECRET:'test',TRADING_LAB_PAPER_ENABLED:options.disabled?'false':'true'}},Date,Request,Response,URL,AbortSignal});
 const request=(method,body,search='')=>new Request(`https://example.invalid/api/trading-lab/manual${search}`,{method,...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
 return {rows,events,get submits(){return submits},get cancels(){return cancels},get brokerReads(){return brokerReads},get dbReads(){return dbReads},get:search=>exports.GET(request('GET',null,search)),cancel:body=>exports.DELETE(request('DELETE',{requestId:id,confirmed:true,...body}))};
}

test('GET reconciles an unknown owned submission by client ID and records partial fills without submitting',async()=>{
 const h=harness();const r=await h.get();assert.equal(r.status,200);const {items}=await r.json();assert.equal(items[0].status,'partially_filled');assert.equal(items[0].filled_quantity,4);assert.equal(items[0].filled_avg_price,24.9);assert.equal(items[0].reconciliation,'verified');assert.equal(items[0].canCancel,true);assert.equal(h.rows.get(id).broker_order_id,'broker-1');assert.ok(h.rows.get(id).broker_checked_at);assert.equal(h.submits,0);assert.equal(h.cancels,0);assert.ok(h.events.includes(`lookup:${clientOrderId}`));
});
test('filled status and fill price are reconciled without offering cancellation',async()=>{
 const h=harness({rows:[audit({status:'accepted',broker_order_id:'broker-1'})],order:{status:'filled',filledQty:10,filledAvgPrice:24.95}});const {items}=await(await h.get()).json();assert.equal(items[0].status,'filled');assert.equal(items[0].filled_quantity,10);assert.equal(items[0].canCancel,false);assert.ok(h.events.includes('get:broker-1'));
});
test('unknown not found, unavailable broker and mismatched identity stay unresolved and never retry',async()=>{
 for(const options of [{notFound:true},{brokerError:true},{order:{clientOrderId:'someone-else'}},{order:{symbol:'AAPL'}},{order:{qty:9}},{order:{filledQty:11}},{order:{filledQty:4,filledAvgPrice:null}}]){
  const h=harness(options);const {items}=await(await h.get()).json();assert.equal(items[0].status,'UNKNOWN');assert.equal(items[0].canCancel,false);assert.notEqual(items[0].reconciliation,'verified');assert.equal(h.submits,0);assert.equal(h.cancels,0);assert.equal(h.rows.get(id).broker_order_id,null);
 }
});
test('GET and cancellation reject non-admin before storage or broker access',async()=>{
 for(const action of ['get','cancel']){const h=harness({unauthorized:true});assert.equal((await h[action]()).status,403);assert.equal(h.dbReads,0);assert.equal(h.brokerReads,0);assert.equal(h.cancels,0)}
});
test('history and targeted reconciliation never access another user order',async()=>{
 const h=harness({rows:[audit({user_id:'another-user'})]});const {items}=await(await h.get()).json();assert.deepEqual(items,[]);const response=await h.get(`?requestId=${id}`);assert.equal(response.status,404);assert.equal(h.brokerReads,0);assert.equal(h.submits,0);
});
test('targeted reconciliation finds an owned request outside recent history',async()=>{
 const h=harness({rows:[audit(),audit({id:otherId,user_id:'another-user'})]});const {items}=await(await h.get(`?requestId=${id}`)).json();assert.equal(items.length,1);assert.equal(items[0].id,id);assert.equal(h.brokerReads,1);
});
test('read failure, missing broker credentials and rate limits do not reach broker',async()=>{
 for(const options of [{readError:true},{unconfigured:true},{rateLimited:true}]){const h=harness(options);await h.get();assert.equal(h.brokerReads,0);assert.equal(h.submits,0)}
});
test('unrecordable broker result cannot enable cancellation',async()=>{
 const h=harness({writeError:true});const {items}=await(await h.get()).json();assert.equal(items[0].canCancel,false);assert.notEqual(items[0].reconciliation,'verified');assert.equal(h.rows.get(id).status,'UNKNOWN');
});
test('cancellation requires explicit confirmation and owned audited request before broker access',async()=>{
 for(const body of [{confirmed:false},{requestId:otherId},{requestId:'bad'}]){const h=harness();assert.ok((await h.cancel(body)).status>=400);assert.equal(h.brokerReads,0);assert.equal(h.cancels,0)}
 const h=harness({rows:[audit({user_id:'another-user'})]});assert.equal((await h.cancel()).status,404);assert.equal(h.brokerReads,0);assert.equal(h.cancels,0);
});
test('cancellation verifies broker identity and persists a claim before exactly one cancellation',async()=>{
 const h=harness();const r=await h.cancel();assert.equal(r.status,202);assert.equal(h.cancels,1);assert.equal(h.submits,0);assert.equal(h.rows.get(id).cancel_status,'REQUESTED');assert.ok(h.rows.get(id).cancel_requested_at);assert.ok(h.events.indexOf('claim-cancel')<h.events.indexOf('cancel:broker-1'));await h.cancel();assert.equal(h.cancels,1);
});
test('audit failure, concurrent cancellation claim and terminal broker order prevent cancellation',async()=>{
 for(const options of [{writeError:true},{claimError:true},{claimRace:true},{order:{status:'filled',filledQty:10}},{order:{clientOrderId:'another-order'}},{order:{status:'pending_cancel'}},{notFound:true},{brokerError:true}]){const h=harness(options);assert.ok((await h.cancel()).status>=400);assert.equal(h.cancels,0);assert.equal(h.submits,0)}
});
test('ambiguous cancellation is persisted and refresh never cancels again',async()=>{
 const h=harness({cancelError:true});assert.equal((await h.cancel()).status,502);assert.equal(h.rows.get(id).cancel_status,'UNKNOWN');assert.equal(h.cancels,1);await h.get();await h.cancel();assert.equal(h.cancels,1);assert.equal(h.submits,0);
});
test('cancellation can reduce exposure when new paper submissions are disabled',async()=>{
 const h=harness({disabled:true});assert.equal((await h.cancel()).status,202);assert.equal(h.cancels,1);
});
test('a canceled order preserves any partial fill and makes no further cancellation request',async()=>{
 const h=harness({rows:[audit({broker_order_id:'broker-1',cancel_status:'REQUESTED',cancel_requested_at:'2026-10-15T14:01:00Z'})],order:{status:'canceled',filledQty:4}});const {items}=await(await h.get()).json();assert.equal(items[0].status,'canceled');assert.equal(items[0].filled_quantity,4);assert.equal(items[0].canCancel,false);assert.equal(h.cancels,0);
});
test('done_for_day remains reconcilable and can advance to a final expired order',async()=>{
 const h=harness({rows:[audit({status:'done_for_day',broker_order_id:'broker-1',broker_checked_at:'2026-10-15T20:00:00Z',filled_quantity:4,filled_avg_price:24.9})],order:{status:'expired',filledQty:4}});const {items}=await(await h.get()).json();assert.equal(h.brokerReads,1);assert.equal(items[0].status,'expired');assert.equal(items[0].filled_quantity,4);assert.equal(items[0].reconciliation,'verified');assert.equal(items[0].canCancel,false);
});
