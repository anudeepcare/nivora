import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {classifyArchetype}=require('../lib/nivora-investor.ts');
const {adaptCurrentEvidenceToV4}=require('../lib/auryn/v4/current-evidence-adapter.ts');
const {classifyV4Security}=require('../lib/auryn/v4/classification.ts');
const raw={revenue:400e9,opMargin:32,fcf:98e9,revGrowth:8};
const context={profile:{name:'Apple Inc.',finnhubIndustry:'Technology'},summary:{topReason:'AI cloud and data center spending rises'},news:[{headline:'Apple joins discussions with GPU cloud data center operators',summary:'Satellite partner signs a deal'}]};
test('incidental news cannot reclassify a profitable consumer technology company as AI infrastructure',()=>{
 assert.equal(classifyArchetype(context,raw,'stock'),'compounder');
});
test('adapter ignores old news-derived model hints and themes when identity evidence is absent',()=>{
 const b=adaptCurrentEvidenceToV4({symbol:'AAPL',asOf:'2026-10-16',context,company:{rawMetrics:raw},legacyDecision:{archetype:'ai_infrastructure',strategicContext:{theme:'AI infrastructure / compute & power'}}});
 assert.equal(b.classificationInput.description,null);
 assert.equal(classifyV4Security({...b.classificationInput,evidence:b.evidenceRefs}).businessModel,'GENERAL_COMPOUNDER');
});
test('actual operating descriptions still identify compute infrastructure and satellite businesses',()=>{
 for(const [description,want] of [['Developer and operator of AI cloud data center campuses','AI_DATA_CENTER_INFRA'],['Direct-to-device satellite constellation services','SPACE_SATELLITE']]){
  const b=adaptCurrentEvidenceToV4({symbol:'EXAMPLE',asOf:'2026-10-16',context:{profile:{name:'Example Corp',description}},company:{rawMetrics:{revenue:1e9,revGrowth:50,opMargin:-30,fcf:-1e8}},legacyDecision:{archetype:'compounder'}});
  assert.equal(classifyV4Security({...b.classificationInput,evidence:b.evidenceRefs}).businessModel,want);
 }
});
