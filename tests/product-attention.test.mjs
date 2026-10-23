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

test('Home moves change with observed quotes and rank by estimated holding impact, combining lots',async()=>{
 const {homePriceMoves}=await import('../lib/product-attention.ts');
 assert.equal(typeof homePriceMoves,'function');
 const p=(symbol,quantity)=>({symbol,quantity,cost:10,currency:'USD',assetType:'stock'});
 const quote=(price,changePct)=>({price,changePct,currency:'USD',asOf:'2026-10-22T20:00:00Z',stale:true});
 const positions=[p('AAA',5),p('AAA',5),p('BBB',10)];
 const qs={AAA:quote(110,10),BBB:quote(20,-20)};
 const rows=homePriceMoves(positions,qs,'2026-10-23T12:00:00Z');
 assert.equal(rows[0].symbol,'AAA');assert.equal(rows[0].quantity,10);assert.ok(Math.abs(rows[0].impact-100)<1e-8);assert.equal(rows[1].impact,-50);assert.equal(rows[0].older,true);
 const revised=homePriceMoves(positions,{...qs,BBB:quote(20,-50)},'2026-10-23T12:00:00Z');
 assert.equal(revised[0].symbol,'BBB');assert.equal(revised[0].impact,-200);
});

test('Home moves reject missing, future, expired and mismatched observations rather than inventing daily P&L',async()=>{
 const {homePriceMoves}=await import('../lib/product-attention.ts');
 const symbols=['MISSING','FUTURE','OLD','FOREIGN','INVALID'];
 const positions=symbols.map(symbol=>({symbol,quantity:10,cost:1,currency:'USD',assetType:'stock'}));
 const base={price:10,changePct:5,currency:'USD',asOf:'2026-10-22T20:00:00Z'};
 const quotes={FUTURE:{...base,asOf:'2026-10-24'},OLD:{...base,asOf:'2026-10-01'},FOREIGN:{...base,currency:'EUR'},INVALID:{...base,changePct:-100}};
 assert.deepEqual(homePriceMoves(positions,quotes,'2026-10-23T12:00:00Z'),[]);
});
