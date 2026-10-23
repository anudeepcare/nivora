import test from "node:test";
import assert from "node:assert/strict";

test('home focus combines lots and retains older usable prices with an explicit label',async()=>{
 const {homeFocus}=await import('../lib/product-attention.ts');
 const p=(symbol,quantity,cost=10)=>({symbol,quantity,cost,currency:'USD',assetType:'stock'});
 const q={AAA:{price:20,currency:'USD',stale:true},BBB:{price:30,currency:'USD',stale:false}};
 const rows=homeFocus([p('AAA',5),p('AAA',5),p('BBB',5)],q);
 assert.equal(rows[0].symbol,'AAA');assert.equal(rows[0].value,200);assert.ok(Math.abs(rows[0].weight-200/350*100)<1e-8);assert.equal(rows[0].older,true);
 assert.equal(homeFocus([p('BAD',10)],{}).length,0);
});
test('home focus excludes invalid and foreign currency positions and does not turn missing quotes into losses',async()=>{
 const {homeFocus}=await import('../lib/product-attention.ts');
 const rows=homeFocus([{symbol:'EUR',quantity:10,cost:2,currency:'EUR',assetType:'stock'},{symbol:'BAD',quantity:NaN,cost:2,currency:'USD',assetType:'stock'}],{EUR:{price:5,currency:'USD'},BAD:{price:5,currency:'USD'}});
 assert.deepEqual(rows,[]);
});
test('Home company batches make every holding reachable without requesting all data at once',async()=>{
 const {companyFeedPage}=await import('../lib/product-attention.ts');
 const symbols=Array.from({length:71},(_,i)=>`STK${i}`);
 const first=companyFeedPage(symbols,0),last=companyFeedPage([...symbols,'STK1','BTC/USD'],2);
 assert.equal(first.symbols.length,30);assert.equal(last.symbols.length,11);assert.equal(last.total,71);assert.equal(last.pageCount,3);assert.equal(last.start,61);assert.equal(last.end,71);assert.equal(companyFeedPage(symbols,99).page,2);assert.equal(companyFeedPage([],0).page,0);
});
