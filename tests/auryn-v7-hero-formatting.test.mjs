import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('hero uses explicit six core decision factors in stable order',()=>{
 const s=read('components/stock/v5/StockV5Decision.tsx');
 assert.match(s,/coreMetricIds/);
 const order=['thesisStrength','businessQuality','technicalStrength','entryQuality','valuation','riskPressure'];
 let pos=-1;for(const id of order){const next=s.indexOf(`'${id}'`);assert.ok(next>pos,`${id} should appear in canonical order`);pos=next;}
 assert.doesNotMatch(s,/\["thesisStrength","businessQuality","valuation","riskPressure","entryQuality","rsi14"\]/);
});

test('technical metrics expose a canonical Technical strength score separate from trend',()=>{
 const s=read('lib/auryn/v5/metrics.ts');
 assert.match(s,/addNum\('technicalStrength','Technical strength'/);
});

test('model proof and method diagnostics are Extreme Pro only',()=>{
 const s=read('components/stock/v5/StockV5Decision.tsx');
 assert.match(s,/depth==="pro"&&v6/);
 assert.doesNotMatch(s,/depth!=="simple"&&v6&&<div className="aurynMemoSignals aurynProofSignals"/);
});

test('professional formatter has stable precision for score, percent, ratio and oscillators',()=>{
 const s=read('lib/auryn/v5/format.ts');
 assert.match(s,/metric\.unit==='\/100'/);
 assert.match(s,/metric\.unit==='x'/);
 assert.match(s,/metric\.unit==='%'/);
 assert.match(s,/ichimokuPosition/);
 assert.match(s,/cmf20/);
});

test('hero factor grid uses card-like spacing rather than border-separated inline values',()=>{
 const css=read('app/auryn-product.css');
 assert.match(css,/\.aurynCoreFactors/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:560px\)[\s\S]*\.aurynCoreFactors\{[^}]*grid-template-columns:1fr 1fr/);
});
