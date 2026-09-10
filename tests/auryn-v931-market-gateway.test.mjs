import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';

test('all migrated current-price surfaces use the canonical market-data gateway',()=>{
 for(const file of ['app/api/quote/[symbol]/route.ts','app/api/market/route.ts','app/api/portfolio/pulse/route.ts','app/api/scan/route.ts']){
   const s=fs.readFileSync(file,'utf8');
   assert.match(s,/market-data-gateway/,`${file} must import market-data-gateway`);
 }
 const market=fs.readFileSync('app/api/market/route.ts','utf8');
 const pulse=fs.readFileSync('app/api/portfolio/pulse/route.ts','utf8');
 assert.doesNotMatch(market,/api\.twelvedata\.com\/time_series/);
 assert.doesNotMatch(pulse,/api\.twelvedata\.com\/price/);
});

test('stored investment scan prices are explicitly historical context, never current truth',()=>{
 const s=fs.readFileSync('app/api/investment/route.ts','utf8');
 assert.match(s,/storedPrice/);
 assert.match(s,/priceRole:"STORED_SCAN_CONTEXT"/);
 assert.doesNotMatch(s,/\{symbol:x\.symbol,price:/);
});
