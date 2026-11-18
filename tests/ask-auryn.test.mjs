import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stockQuestion,validateAnswer } from '../lib/ask-auryn.ts';
const evidence=[{id:'E1',label:'Revenue',url:'https://www.sec.gov/Archives/example',value:123,unit:'USD',period:'2025-12-31',filed:'2026-02-01'}];
test('questions are bounded but not restricted to four preset intents',()=>{
 assert.equal(stockQuestion(' What is changing in this business? '),'What is changing in this business?');
 for(const value of [null,'aa','a'.repeat(1201),'bad\u0000question']) assert.throws(()=>stockQuestion(value));
});
test('validated answer renders numbers only by selecting actual facts',()=>{
 const answer=validateAnswer({claims:[{text:'The supplied revenue observation alone cannot establish future growth.',evidenceIds:['E1']}],factIds:['E1']},evidence);
 assert.equal(answer.facts[0].value,123);
 for(const raw of [
 {claims:[{text:'Revenue will rise 999 percent.',evidenceIds:['E1']}],factIds:[]},
 {claims:[{text:'This is guaranteed profit.',evidenceIds:['E1']}],factIds:[]},
 {claims:[{text:'A claim with invented citation.',evidenceIds:['fake']}],factIds:[]},
 {claims:[{text:'An uncited answer is not accepted.',evidenceIds:[]}],factIds:[]},
 {claims:answer.claims,factIds:['secret']},
 ]) assert.throws(()=>validateAnswer(raw,evidence));
});
test('missing evidence cannot manufacture a claim or value',()=>{
 assert.throws(()=>validateAnswer({claims:[{text:'The company has strong cash flow.',evidenceIds:['E1']}],factIds:['E1']},[]));
});
test('route preserves privacy, budgets and server evidence boundaries',()=>{
 const route=fs.readFileSync('app/api/ask/[symbol]/route.ts','utf8');
 for(const token of ['requestAccess','requireFeature(access, "ai")','reserveAccess','auryn_reserve_ai_request','stockQuestion','store: false','No tools are available','untrusted text','!evidence.length','validateAnswer']) assert.ok(route.includes(token),token);
 assert.doesNotMatch(route,/new Map|reports\.set|body\.(portfolio|holdings|evidence)|previous_response_id|console\.log/);
 assert.match(route,/observations: evidence.map/);
 assert.match(route,/company: symbol/);
 const ui=fs.readFileSync('components/AskAurynQuestion.tsx','utf8');
 assert.doesNotMatch(ui,/dangerouslySetInnerHTML/);
 assert.match(ui,/Do not include private financial details/);
});
test('fact-only citations remain linked and ticker changes remount question state',()=>{
 const route=fs.readFileSync('app/api/ask/[symbol]/route.ts','utf8');
 const ui=fs.readFileSync('components/AskAurynQuestion.tsx','utf8');
 const analyst=fs.readFileSync('components/Analyst.tsx','utf8');
 assert.match(route,/answer\.facts\.some\(\(f\) => f.id === e.id\)/);
 assert.match(ui,/href={f.url}/);
 assert.equal((analyst.match(/key={research.company.symbol}/g)||[]).length,2);
 assert.equal((analyst.match(/<AskAurynQuestion/g)||[]).length,2);
});
