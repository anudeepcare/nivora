import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
test('live quote route delegates to canonical provider consensus, extended-hours Twelve request and no response cache',()=>{
 const route=fs.readFileSync(new URL('../app/api/quote/[symbol]/route.ts',import.meta.url),'utf8');
 const gateway=fs.readFileSync(new URL('../lib/auryn/market-data-gateway.ts',import.meta.url),'utf8');
 const provider=fs.readFileSync(new URL('../lib/nivora-trading-market-data.ts',import.meta.url),'utf8');
 assert.match(route,/loadCanonicalMarketSnapshot/);assert.match(route,/integrityState/);assert.match(route,/no-store/);
 assert.match(gateway,/loadTradingMarketData/);assert.match(provider,/prepost=true/);assert.match(provider,/cache:"no-store"/);
});
test('stock client refreshes canonical Market Truth independently and overlays Today only',()=>{
 const s=fs.readFileSync(new URL('../components/StockClient.tsx',import.meta.url),'utf8');
 assert.match(s,/\/api\/canonical\//);assert.match(s,/20000/);assert.match(s,/applyLiveQuoteToToday/);assert.match(s,/marketTruth|session/);
 assert.doesNotMatch(s,/\/api\/quote\//);
});
