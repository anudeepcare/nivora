import test from 'node:test';import assert from 'node:assert/strict';import {groupedLedgerRows,ledgerRows} from '../lib/portfolio-ledger.ts';
const lot=(id,quantity,cost,currency='USD',extra={})=>({id,symbol:'TEST',assetType:'stock',quantity,cost,currency,...extra});
const quotes={TEST:{price:20,currency:'USD',stale:false}};
test('lots stay intact while unequal fractional quantities form one weighted holding',()=>{
 const lots=[lot('a',1.5,10),lot('b',3,15)];const before=JSON.stringify(lots);const [r]=groupedLedgerRows(lots,quotes,90);
 assert.equal(r.quantity,4.5);assert.equal(r.avgCost,60/4.5);assert.equal(r.value,90);assert.equal(r.pnl,30);assert.equal(r.returnPct,50);assert.equal(r.weight,100);assert.deepEqual(r.lots,lots);assert.equal(JSON.stringify(lots),before);assert.equal(ledgerRows(lots,quotes,90).length,2);
});
test('mixed or missing currency remains one holding, never partial cost or P/L',()=>{
 for(const [currency,state] of [['EUR','mixed'],[undefined,'unknown']]){const b=lot('b',3,15);b.currency=currency;const [r]=groupedLedgerRows([lot('a',1,10),b],quotes,80);assert.equal(r.quantity,4);assert.equal(r.value,80);assert.equal(r.avgCost,null);assert.equal(r.pnl,null);assert.equal(r.returnPct,null);assert.equal(r.costState,state);assert.equal(r.caution,true);}
});
test('average is independent of quotes and zero cost never creates infinite return',()=>{
 let [r]=groupedLedgerRows([lot('a',2,10),lot('b',1,40)],{},0);assert.equal(r.avgCost,20);assert.equal(r.value,null);assert.equal(r.price,null);assert.equal(r.pnl,null);
 [r]=groupedLedgerRows([lot('a',2,0)],quotes,40);assert.equal(r.avgCost,0);assert.equal(r.pnl,40);assert.equal(r.returnPct,null);
 [r]=groupedLedgerRows([lot('a',2,10,'EUR')],quotes,40);assert.equal(r.avgCost,10);assert.equal(r.costCurrency,'EUR');assert.equal(r.pnl,null);
});
test('exact canonical symbols and asset classes do not cross merge; cash lots stay separate',()=>{
 const rows=groupedLedgerRows([lot('a',1,10),lot('b',1,10,'USD',{assetType:'crypto'}),lot('c',1,10,'USD',{symbol:'OTHER'}),lot('d',5,1,'USD',{symbol:'USD',assetType:'cash'}),lot('e',2,1,'USD',{symbol:'USD',assetType:'cash'})],quotes,20);assert.equal(rows.length,5);assert.equal(new Set(rows.map(r=>r.groupKey)).size,5);
});
test('invalid quantities, basis overflow and valuation overflow fail closed without partial P/L',()=>{
 for(const lots of [[lot('a',Infinity,1)],[lot('a',-1,1)],[lot('a',1e308,1),lot('b',1e308,1)]]){const [r]=groupedLedgerRows(lots,quotes,100);assert.equal(r.quantity,null);assert.equal(r.value,null);assert.equal(r.avgCost,null);assert.equal(r.pnl,null);}
 for(const cost of [NaN,-1,Infinity,1e308]){const [r]=groupedLedgerRows([lot('a',2,cost)],quotes,40);assert.equal(r.avgCost,null);assert.equal(r.pnl,null);}
 const [r]=groupedLedgerRows([lot('a',1e308,0)],quotes,100);assert.equal(r.value,null);assert.equal(r.weight,null);assert.equal(r.pnl,null);
});
test('compact notes prioritize unknown basis and group IDs survive unrelated row order',()=>{
 const positions=[lot('a',1,10),lot('b',2,20,undefined),lot('cash',5,1,'USD',{symbol:'USD',assetType:'cash'})];positions[1].currency=undefined;
 const rows=groupedLedgerRows(positions,{TEST:{price:20,currency:'USD',stale:true}},65,new Set(['TEST']));assert.equal(rows[0].note,'Cost basis incomplete');assert.equal(rows[1].groupKey,groupedLedgerRows([...positions].reverse(),quotes,65).find(r=>r.position.id==='cash').groupKey);
});
test('a group with invalid numeric basis cannot use a denominator that excluded one of its lots',async()=>{
 const {workspaceOverview}=await import('../lib/approved-workspace.ts');const lots=[lot('a',1,10),lot('b',1,NaN)];const overview=workspaceOverview(lots,{TEST:{quote:quotes.TEST}});assert.equal(overview.invested,20);
 const [r]=groupedLedgerRows(lots,quotes,overview.invested);assert.equal(r.value,40);assert.equal(r.weight,null);assert.equal(r.pnl,null);
});
