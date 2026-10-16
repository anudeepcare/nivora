import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../lib/auryn/accumulation/engine.ts',import.meta.url),'utf8');
test('accumulation engine includes hard gates and independent fundamentals',()=>{for(const token of ['evidenceFresh','thesisIntact','financingRisk','portfolioWeightPct','fundamentalScore','valuationScore','technicalScore','availableCash'])assert.ok(src.includes(token))});
test('route uses authenticated app shell',()=>{const s=readFileSync(new URL('../app/accumulation/page.tsx',import.meta.url),'utf8');assert.match(s,/AuthGuard/);assert.match(s,/AppShell/)});
