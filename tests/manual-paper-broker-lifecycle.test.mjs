import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function brokerHarness(responses){
 const requests=[];const exports={};
 const source=ts.transpileModule(fs.readFileSync('lib/alpaca-paper.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,require:()=>({ALPACA_PAPER_BASE_URL:'https://paper-api.alpaca.markets',authorizeBrokerExecution:()=>({mayTransmit:true})}),AbortSignal,fetch:async(url,init)=>{requests.push({url,init});const response=responses.shift();if(response instanceof Error)throw response;return response;}});
 return {requests,broker:new exports.AlpacaPaperBroker('test-key','test-secret')};
}
test('client ID recovery uses encoded read-only paper endpoint and normalizes fills',async()=>{
 const h=brokerHarness([Response.json({id:'broker-1',client_order_id:'auryn_manual_1',symbol:'IREN',side:'buy',status:'filled',qty:'10',filled_qty:'10',filled_avg_price:'24.95'})]);
 const result=await h.broker.getOrderByClientOrderId('auryn_manual_1&bad');assert.equal(result.filledQty,10);assert.equal(result.filledAvgPrice,24.95);assert.equal(h.requests[0].url,'https://paper-api.alpaca.markets/v2/orders:by_client_order_id?client_order_id=auryn_manual_1%26bad');assert.equal(h.requests[0].init.method,undefined);assert.ok(h.requests[0].init.signal);assert.equal(h.requests.length,1);
});
test('only a definitive broker 404 is not found; transport and auth failures stay errors',async()=>{
 const absent=brokerHarness([Response.json({message:'not found'},{status:404})]);assert.equal(await absent.broker.getOrderByClientOrderId('id'),null);
 for(const response of [Response.json({message:'denied'},{status:401}),Response.json({message:'unavailable'},{status:503}),Error('network')]){const h=brokerHarness([response]);await assert.rejects(()=>h.broker.getOrderByClientOrderId('id'));assert.equal(h.requests.length,1)}
});
test('cancel sends one encoded DELETE and accepts an empty 204 without claiming a fill',async()=>{
 const h=brokerHarness([new Response(null,{status:204})]);assert.equal(await h.broker.cancelOrder('broker/1'),undefined);assert.equal(h.requests[0].url,'https://paper-api.alpaca.markets/v2/orders/broker%2F1');assert.equal(h.requests[0].init.method,'DELETE');assert.equal(h.requests.length,1);
});
test('an ambiguous cancel transport error never retries the mutation',async()=>{
 const h=brokerHarness([Error('timeout')]);await assert.rejects(()=>h.broker.cancelOrder('broker-1'));assert.equal(h.requests.length,1);
});
test('order reads share the caller deadline instead of renewing an eight-second timeout per batch',async()=>{
 const signal=AbortSignal.abort();const h=brokerHarness([Response.json({id:'broker-1'}),Response.json({id:'broker-1'})]);await h.broker.getOrder('broker-1',signal);await h.broker.getOrderByClientOrderId('manual-1',signal);assert.equal(h.requests[0].init.signal,signal);assert.equal(h.requests[1].init.signal,signal);assert.equal(h.requests[1].init.signal.aborted,true);
});
