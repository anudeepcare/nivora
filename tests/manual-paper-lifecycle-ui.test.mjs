import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const id='11111111-1111-4111-8111-111111111111';
const row={id,symbol:'IREN',side:'BUY',quantity:10,limit_price:25,status:'partially_filled',filled_quantity:4,filled_avg_price:24.9,created_at:'2026-10-15T14:00:00Z',broker_checked_at:'2026-10-15T14:01:00Z',broker_order_id:'broker-1',canCancel:true,reconciliation:'verified',reconciliationNote:'Verified against Alpaca Paper.'};
function harness({pending=false,missing=false}={}){
 let cursor=0,mounted=false,canceled=false,submitted=0;const states=[],effects=[],requests=[],storage=new Map();
 const ticket={userId:'admin',requestId:id,symbol:'IREN',side:'BUY',quantity:10,limitPrice:25,notional:250,quoteAsOf:'2026-10-15T14:00:00Z'};
 if(pending)storage.set('auryn-pending-paper-request:admin',JSON.stringify(ticket));
 const hooks={useState(initial){const index=cursor++;if(!(index in states))states[index]=initial;return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value}]},useCallback:fn=>fn,useEffect:fn=>{if(!mounted)effects.push(fn)}};
 const exports={};const source=ts.transpileModule(fs.readFileSync('components/ManualPaperTicket.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const jsx=(type,props)=>({type,props});
 vm.runInNewContext(source,{exports,require:n=>n==='react'?hooks:n==='react/jsx-runtime'?{jsx,jsxs:jsx}:n==='@/lib/supabase'?{supabaseBrowser:()=>({auth:{getSession:async()=>({data:{session:{access_token:'token',user:{id:'admin'}}}})}})}:undefined,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:async(url,init)=>{requests.push({url,...init});if(init.method==='DELETE'){canceled=true;return Response.json({message:'Cancellation requested. The order may still fill until Alpaca confirms it is canceled.'},{status:202})}return Response.json({items:missing?[]:[{...row,...(canceled?{status:'canceled',canCancel:false,cancel_status:'REQUESTED',cancel_requested_at:'2026-10-15T14:02:00Z'}:{})}]})},Date,JSON,Number,Error,crypto});
 const render=()=>{cursor=0;const tree=exports.default({connected:true,onSubmitted:()=>{submitted++}});mounted=true;return tree};
 const flatten=node=>node==null?[]:Array.isArray(node)?node.flatMap(flatten):typeof node==='object'?[node,...flatten(node.props?.children)]:[String(node)];
 const label=node=>flatten(node.props?.children).filter(x=>typeof x==='string').join('');
 const button=(tree,text)=>flatten(tree).find(node=>node?.type==='button'&&label(node)===text);
 return {requests,storage,render,button,text:tree=>flatten(tree).filter(x=>typeof x==='string').join(' '),get submitted(){return submitted},async mount(){render();effects.forEach(fn=>fn());for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));return render()}};
}
test('manual history exposes verified fills and requires a separate cancellation review before DELETE',async()=>{
 const h=harness();let tree=await h.mount();assert.match(h.text(tree),/4 \/ 10/);assert.match(h.text(tree),/24\.90/);const review=h.button(tree,'Review cancellation');assert.ok(review);await review.props.onClick();tree=h.render();assert.ok(h.button(tree,'Confirm cancellation'));assert.equal(h.requests.filter(x=>x.method==='DELETE').length,0);assert.match(h.text(tree),/does not reverse/i);await h.button(tree,'Confirm cancellation').props.onClick();tree=h.render();const cancel=h.requests.filter(x=>x.method==='DELETE');assert.equal(cancel.length,1);assert.deepEqual(JSON.parse(cancel[0].body),{requestId:id,confirmed:true});assert.equal(h.requests.filter(x=>x.method==='POST').length,0);assert.match(h.text(tree),/canceled/);assert.equal(h.submitted,1);
});
test('an unknown submission reconciles only its original request and clears the lock after broker verification',async()=>{
 const h=harness({pending:true});let tree=await h.mount();assert.ok(h.button(tree,'Reconcile order status'));await h.button(tree,'Reconcile order status').props.onClick();tree=h.render();assert.ok(h.requests.some(x=>x.url===`/api/trading-lab/manual?requestId=${id}`));assert.equal(h.requests.filter(x=>x.method==='POST'||x.method==='DELETE').length,0);assert.equal(h.storage.size,0);assert.ok(h.button(tree,'Review paper order'));
});
test('missing reconciliation retains the pending request instead of enabling a replacement',async()=>{
 const h=harness({pending:true,missing:true});let tree=await h.mount();await h.button(tree,'Reconcile order status').props.onClick();tree=h.render();assert.equal(h.storage.size,1);assert.equal(h.button(tree,'Confirm paper order').props.disabled,true);assert.equal(h.requests.filter(x=>x.method==='POST'||x.method==='DELETE').length,0);
});
