import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const stock=fs.readFileSync('components/StockClient.tsx','utf8');
const hero=fs.readFileSync('components/stock/v5/StockV5Decision.tsx','utf8');
const paper=fs.readFileSync('app/api/trading-lab/run-paper/route.ts','utf8');
const validation=fs.readFileSync('app/api/validation/snapshot/route.ts','utf8');

test('StockClient builds and persists V7 canonical trust state',()=>{
 assert.match(stock,/buildAurynV7Analysis/);
 assert.match(stock,/serializeV7Decision/);
 assert.match(stock,/const v7Analysis=useMemo/);
 assert.match(stock,/trustState:v7Analysis\.trust\.state/);
 assert.match(stock,/trustScore:v7Analysis\.trust\.score/);
 assert.match(stock,/canonicalDecision:v7Analysis\?serializeV7Decision\(v7Analysis\):null/);
});

test('decision hero identifies V8 and exposes trust only as useful reliability state',()=>{
 assert.match(hero,/AURYN V8 · REALITY AUDITED/);
 assert.match(hero,/SYSTEM TRUST/);
 assert.doesNotMatch(hero,/ENGINE\s*VERSION/i);
});

test('paper runner fails closed when V7 canonical trust audit blocks',()=>{
 assert.match(paper,/v5Meta\?\.trustState===['"]BLOCK['"]/);
 assert.match(paper,/Canonical trust audit blocked execution/);
});


test('validation learning rejects canonical trust blockers',()=>{
 assert.match(validation,/CANONICAL_TRUST_BLOCK/);
 assert.match(validation,/will not learn from an internally inconsistent canonical snapshot/);
});
