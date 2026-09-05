import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('mobile shell keeps stock search directly accessible',()=>{
 const shell=read('components/AppShell.tsx');
 const css=read('app/auryn-product.css');
 assert.match(shell,/aurynMobileSearch/);
 assert.match(css,/\.aurynMobileSearch/);
});

test('PWA manifest uses the AURYN v37 icon instead of legacy icon',()=>{
 const manifest=read('app/manifest.ts');
 assert.match(manifest,/auryn-v37-192\.png/);
 assert.match(manifest,/auryn-v37-512\.png/);
 assert.doesNotMatch(manifest,/src:"\/icon\.svg"/);
});

test('decision hero explicitly separates long-term thesis from today action and explains score direction',()=>{
 const hero=read('components/InvestorDecisionHero.tsx');
 assert.match(hero,/LONG-TERM THESIS/);
 assert.match(hero,/TODAY'S ACTION/);
 assert.match(hero,/Higher is better except Risk/);
});

test('thesis panel score language explains higher-is-better and risk inversion',()=>{
 const panel=read('components/stock/StockThesisPanel.tsx');
 assert.match(panel,/Higher scores are stronger evidence/);
 assert.match(panel,/Risk pressure is the exception/);
});

test('holdings layout styles the actual facts markup and makes the whole stock row navigable',()=>{
 const holdings=read('components/portfolio/HoldingsIntelligence.tsx');
 const css=read('app/auryn-product.css');
 assert.match(holdings,/aurynPositionFacts/);
 assert.match(holdings,/Open .* research/);
 assert.match(css,/\.aurynPositionFacts small/);
 assert.match(css,/\.aurynPositionRow\.clickable:hover/);
});
