import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const r=p=>fs.readFileSync(p,'utf8');

test('analyze API exposes canonical technical diagnostics',()=>{
 const s=r('app/api/analyze/[symbol]/route.ts');
 assert.match(s,/technicalState:technical\.technicalState/);
 assert.match(s,/indicators:technical\.indicators/);
 assert.match(s,/indicatorVersion:technical\.indicatorVersion/);
});

test('stock technical UI distinguishes strength from entry quality',()=>{
 const s=r('components/StockClient.tsx');
 assert.match(s,/TECHNICAL STRENGTH/);
 assert.match(s,/ENTRY QUALITY/);
 assert.match(s,/MOMENTUM/);
 assert.match(s,/VOLATILITY RISK/);
 assert.doesNotMatch(s,/One score first\. Indicators underneath\./);
 assert.doesNotMatch(s,/TECHNICAL COMPOSITE/);
});
