import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildAstraRequest,validateAstraAnalysis} from '../.engine-test/auryn/v931/astra.js';

test('Astra uses Responses API structured outputs and cannot override deterministic authority',()=>{
 const req=buildAstraRequest({symbol:'MSFT',snapshotId:'s1',canonicalAction:'HOLD',evidence:[{id:'business.growth',text:'Revenue growth 15%.',values:[15],horizon:'6-12M'}]});
 assert.equal(req.model,'gpt-6-astra');
 assert.equal(req.text.format.type,'json_schema');
 assert.equal(req.text.format.strict,true);
 assert.match(JSON.stringify(req),/evidenceIds/);
 const bad=validateAstraAnalysis({verdictAgreement:'DISAGREE',executiveSummary:'Buy now at $500.',strongestEvidence:[],strongestCounterEvidence:[],decisionChangeExplanation:[],thesisRisks:[],catalysts:[],investorActionExplanation:'BUY',ownerActionExplanation:'BUY',dataCaveats:[],contradictionFlags:[],evidenceIds:['business.growth'],proposedAction:'BUY'},[{id:'business.growth',text:'Revenue growth 15%.',values:[15],horizon:'6-12M'}],'HOLD');
 assert.equal(bad.ok,false);
});

test('Astra route uses official Responses endpoint and fail-closed validation',()=>{
 const src=fs.readFileSync('app/api/astra/[symbol]/route.ts','utf8');
 assert.match(src,/api\.openai\.com\/v1\/responses/);
 assert.match(src,/validateAstraAnalysis/);
 assert.match(src,/OPENAI_API_KEY/);
});
