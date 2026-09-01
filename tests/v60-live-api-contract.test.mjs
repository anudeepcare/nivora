import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
test('live quote route uses provider consensus, extended-hours Twelve request and no response cache',()=>{
 const route=fs.readFileSync(new URL('../app/api/quote/[symbol]/route.ts',import.meta.url),'utf8');
 const provider=fs.readFileSync(new URL('../lib/nivora-trading-market-data.ts',import.meta.url),'utf8');
 assert.match(route,/loadTradingMarketData/);assert.match(route,/integrityState/);assert.match(route,/no-store/);
 assert.match(provider,/prepost=true/);assert.match(provider,/cache:"no-store"/);
});
test('stock client refreshes live quote independently and overlays Today only',()=>{
 const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
 assert.match(s,/\/api\/quote\//);assert.match(s,/12000/);assert.match(s,/applyLiveQuoteToToday/);assert.match(s,/integrityState|session/);
});
