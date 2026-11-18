import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intelligenceView} from '../lib/sentisense-view.ts';
const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
test('earnings prose is preserved outside compact record identity',()=>{
 const v=intelligenceView('earnings',[{headline:'A very long provider headline with revenue and EPS observations',fiscalPeriod:'Q3 2026',reportDate:'2026-11-01',summaryMd:'Detailed report'}]);
 assert.equal(v.groups[0].rows[0].label,'Q3 2026');
 assert.match(v.groups[0].rows[0].text,/very long provider headline/);
 assert.match(v.groups[0].rows[0].text,/Detailed report/);
});
test('table preserves numeric tokens and labels fiscal dates separately',()=>{
 assert.match(read('components/IntelligenceTable.tsx'),/dateHeading = "Date"/);
 assert.match(read('components/IntelligenceTable.module.css'),/white-space: nowrap/);
 assert.match(read('components/SentiSensePanels.tsx'),/Fiscal period ending/);
});
test('consensus uses supplied currency and keeps publisher count out of price grid',()=>{
 const s=read('components/SentiSenseConsensus.tsx');
 assert.match(s,/consensusTarget\(data.targetMean, data.currency\)/);
 assert.match(s,/Target publishers: /);
});
test('target currency is explicit without guessing USD for missing units',async()=>{
 const {consensusTarget}=await import('../lib/analyst-presentation.ts');
 assert.equal(consensusTarget(148.25,'cad'),'CAD 148.25');
 assert.equal(consensusTarget(148.25,null),'148.25');
 assert.equal(consensusTarget(null,'USD'),'Not supplied');
});

test('unknown currency stays unassigned without repeated missing-currency prose',()=>{
 for (const dataset of ['fundamentalsCurrent','fundamentalsAnnual']) {
  const payload = dataset === 'fundamentalsCurrent'
   ? {revenueTTM:123, reportedCurrency:null}
   : {periods:[{revenue:123,reportedCurrency:null,fiscalPeriod:'FY',fiscalYear:2025}]};
  const rendered=JSON.stringify(intelligenceView(dataset,payload));
  assert.match(rendered,/123/);
  assert.doesNotMatch(rendered,/currency not supplied|USD|\$/);
 }
 assert.doesNotMatch(read('components/EodEventCalendar.tsx'),/currency not supplied/);
});
