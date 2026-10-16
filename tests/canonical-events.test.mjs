import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import fs from 'node:fs';
const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/auryn/v931/research-events.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:out,Date,Map});
const collect=out.collectResearchEvents;
test('provider calendar is explicitly estimated, filings require a known publication and source',()=>{
 const r=collect('TEST',{filings:[{date:'2026-10-15',form:'10-Q',accession:'filed',url:'https://www.sec.gov/Archives/example'},{date:'2026-10-20',form:'10-Q',accession:'future',url:'https://www.sec.gov/Archives/future'}]},{earnings:{date:'2026-11-01'}},'2026-10-16T15:00:00Z');
 assert.equal(r.length,2);assert.equal(r[0].dateState,'reported');assert.equal(r[1].dateState,'estimated');assert.match(r[1].label,/estimated/);
});
test('an impossible calendar date cannot become an event',()=>{assert.equal(collect('TEST',null,{earnings:{date:'2026-02-31'}},'2026-10-16').length,0);});
test('guidance cannot appear before publication or be labeled delivered',()=>{
 const claim={id:'capacity-1',milestoneId:'capacity',text:'Target capacity',kind:'MANAGEMENT_GUIDANCE',periodEnd:'2027-01-01',publishedAt:'2026-10-16',source:'SEC',sourceUrl:'https://www.sec.gov/Archives/filing'};
 assert.equal(collect('TEST',{businessEvidence:[claim]},null,'2026-10-15').length,0);
 const r=collect('TEST',{businessEvidence:[claim]},null,'2026-10-16');assert.equal(r[0].dateState,'estimated');assert.match(r[0].label,/Planned/);
});
test('external estimates remain forecasts and unclassified claims do not become delivered events',()=>{
 const base={id:'provider-forecast',milestoneId:'capacity',text:'Consensus capacity',periodEnd:'2027-01-01',publishedAt:'2026-10-16',source:'PROVIDER',sourceUrl:'https://provider.example/forecast'};
 const r=collect('TEST',{businessEvidence:[{...base,kind:'EXTERNAL_ESTIMATE'}]},null,'2026-10-16');
 assert.equal(r[0].dateState,'estimated');assert.match(r[0].label,/Planned/);
 assert.equal(collect('TEST',{businessEvidence:[{...base,kind:'AURYN_INTERPRETATION'}]},null,'2026-10-16').length,0);
});
