import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
function load(file){if(!fs.existsSync(file))return {};const m={exports:{}};new Function('module','exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m,m.exports,n=>load(path.resolve(path.dirname(file),n)+'.ts'));return m.exports;}
const {buildSecCompanyEvidence}=load('lib/sec-company-evidence.ts');
const api=load('lib/research-financial-assessment.ts');
const analyst=load('lib/auryn/v99910/fundamental-analyst.ts');
const row=(value,year=2025,extra={})=>({val:value,start:`${year}-01-01`,end:`${year}-12-31`,filed:`${year+1}-02-15`,accn:`0000000001-${String(year+1).slice(-2)}-000001`,form:'10-K',...extra});
const concept=(rows,unit='USD')=>({units:{[unit]:rows}});
function company(){
  const flow={Revenues:concept([row(1000,2023),row(1100,2024),row(1200)]),NetIncomeLoss:concept([row(110,2023),row(120,2024),row(130)]),NetCashProvidedByUsedInOperatingActivities:concept([row(160)]),PaymentsToAcquirePropertyPlantAndEquipment:concept([row(60)]),OperatingIncomeLoss:concept([row(180)]),WeightedAverageNumberOfDilutedSharesOutstanding:concept([row(10)],'shares')};
  for(const tag of ['ProceedsFromIssuanceOfLongTermDebt','RepaymentsOfLongTermDebt','ProceedsFromRepaymentsOfShortTermDebt','PaymentsOfDividendsPreferredStockAndPreferenceStock','PaymentsToAcquireBusinessesNetOfCashAcquired','FinanceLeasePrincipalPayments'])flow[tag]=concept([row(0)]);
  const c=buildSecCompanyEvidence({facts:{'us-gaap':flow,dei:{EntityCommonStockSharesOutstanding:concept([{...row(10),start:undefined,end:'2026-01-31'}],'shares')}}},{cik:'1',asOf:'2026-10-16'});
  c.valuationReview={shareCountFactId:c.financials.facts.find(f=>f.metric==='sharesOutstanding').id,unitsPerListedShare:1,shareClass:'Common',source:'SEC',sourceUrl:'https://www.sec.gov/Archives/edgar/data/1/000000000126000001/filing.htm',publishedAt:'2026-02-15',claimsReviewed:true};
  return c;
}
const input=(extra={})=>({symbol:'TEST',businessModel:'GENERAL_COMPOUNDER',lifecycle:'COMPOUNDER',company:company(),asOf:'2026-10-16T12:00:00Z',currentPrice:80,priceAsOf:'2026-10-16T12:00:00Z',priceCurrency:'USD',...extra});

test('a complete sourced mature cash-flow case supplies scenarios and a separate earnings cross-check',()=>{
  assert.equal(typeof api.buildFinancialAssessment,'function');
  const result=api.buildFinancialAssessment(input());
  assert.equal(result.valuation.decisionGrade,true);
  assert.ok(result.valuation.fairValue>0);
  assert.equal(result.valuation.crossChecks[0].family,'NORMALIZED_EARNINGS');
  assert.equal(result.valuation.independentCrossChecks,1);
  assert.ok(result.valuation.scenarios.base.evidenceIds.length>0);
  assert.equal(result.valuation.scenarios.base.assumptions.kind,'AURYN_ASSUMPTION');
  assert.ok(result.businessScore>0);
  assert.ok(result.fundamentalScore>0);
  assert.ok(result.valuationScore>0);
});

test('share, financing and independent earnings gaps cannot unlock fair value',()=>{
  assert.equal(typeof api.buildFinancialAssessment,'function');
  for(const mutate of [c=>{delete c.valuationReview;},c=>{c.financials.facts=c.financials.facts.filter(f=>f.metric!=='debtRepaid');},c=>{c.financials.facts=c.financials.facts.filter(f=>!(f.metric==='netIncome'&&f.periodEnd<'2025-01-01'));},c=>{c.financials.facts.find(f=>f.metric==='sharesOutstanding').filedAt='2027-01-01';}]){
    const c=company();mutate(c);const r=api.buildFinancialAssessment(input({company:c}));
    assert.equal(r.valuation.decisionGrade,false);assert.equal(r.valuation.fairValue,null);assert.equal(r.valuationScore,null);assert.ok(r.valuation.missingInputs.length);
  }
});

test('market movement does not change intrinsic economics or business scores',()=>{
  assert.equal(typeof api.buildFinancialAssessment,'function');
  const a=api.buildFinancialAssessment(input()),b=api.buildFinancialAssessment(input({currentPrice:160}));
  assert.equal(a.valuation.fairValue,b.valuation.fairValue);assert.equal(a.businessScore,b.businessScore);assert.equal(a.fundamentalScore,b.fundamentalScore);
  assert.notEqual(a.valuation.marginOfSafetyPct,b.valuation.marginOfSafetyPct);
  assert.equal(api.buildFinancialAssessment(input({priceAsOf:null})).valuation.marginOfSafetyPct,null);
});

test('implied expectations and sensitivity reconcile to the real scenario model',()=>{
  assert.equal(typeof api.buildFinancialAssessment,'function');
  const result=api.buildFinancialAssessment(input());
  assert.ok(result.valuation.sensitivity.length>=3);
  const low=result.valuation.sensitivity.find(x=>x.discountRatePct===8),high=result.valuation.sensitivity.find(x=>x.discountRatePct===12);
  assert.ok(low.valuePerShare>high.valuePerShare);
  const target=result.valuation.fairValue;
  const implied=api.buildFinancialAssessment(input({currentPrice:target})).valuation.impliedExpectations;
  assert.ok(Math.abs(implied.growthPct-2)<0.001);
});

test('IREN-type and ASTS-type classifications expose operational gaps without generic profitability penalties',()=>{
  assert.equal(typeof api.buildFinancialAssessment,'function');
  for(const [symbol,businessModel,method,dimension] of [['IREN','AI_DATA_CENTER_INFRA','AI_INFRA_SOTP_CAPACITY','operationalCapacity'],['ASTS','SPACE_SATELLITE','FRONTIER_SCENARIO_RUNWAY','deployedCapacity']]){
    const r=api.buildFinancialAssessment(input({symbol,businessModel,lifecycle:'PRE_COMMERCIAL'}));
    assert.equal(r.valuation.method,method);assert.equal(r.valuation.decisionGrade,false);assert.equal(r.businessScore,null);assert.ok(r.thesis.missingDimensions.includes(dimension));assert.ok(r.thesis.invalidationConditions.length);
  }
});

test('living thesis preserves sourced guidance versus actual and never promotes an unsourced moat',()=>{
  assert.equal(typeof api.buildFinancialAssessment,'function');
  const c=company();c.businessEvidence=[{id:'g',dimension:'deployedCapacity',kind:'MANAGEMENT_GUIDANCE',text:'Deploy 5 satellites',value:5,unit:'satellites',targetOperator:'AT_LEAST',periodEnd:'2026-09-30',publishedAt:'2026-02-15',source:'ISSUER',sourceUrl:'https://issuer.example/results',milestoneId:'launch-1'},{id:'a',dimension:'deployedCapacity',kind:'REPORTED_FACT',text:'Deployed 4 satellites',value:4,unit:'satellites',periodEnd:'2026-09-30',publishedAt:'2026-10-01',source:'SEC',sourceUrl:'https://www.sec.gov/Archives/edgar/data/1/results',milestoneId:'launch-1'},{id:'bad',dimension:'moat',kind:'AURYN_INTERPRETATION',text:'Unassailable moat'}];
  const r=api.buildFinancialAssessment(input({company:c,businessModel:'SPACE_SATELLITE'}));
  assert.equal(r.thesis.guidanceReviews[0].state,'MISSED');assert.equal(r.thesis.guidanceReviews[0].expected.value,5);assert.equal(r.thesis.guidanceReviews[0].actual.value,4);assert.equal(r.thesis.moatDrivers.length,0);
});

test('analyst accepts the shared source-backed result rather than a second scalar valuation engine',()=>{
  const financialAssessment=api.buildFinancialAssessment(input());
  const result=analyst.buildFundamentalAnalyst({businessModel:'GENERAL_COMPOUNDER',financialAssessment});
  assert.equal(result.fairValue,financialAssessment.valuation.fairValue);
  assert.equal(result.decisionGrade,true);
  assert.equal(result.fundamentalScenario.base.value,financialAssessment.valuation.scenarios.base.value);
  assert.equal(analyst.buildFundamentalAnalyst({businessModel:'GENERAL_COMPOUNDER',rawMetrics:{revenue:100,fcf:50},currentPrice:10,marketCap:1000}).fairValue,null);
});

test('discontinued and stale earnings cannot provide canonical quality or an earnings cross-check',()=>{
  for(const mutate of [c=>{c.financials.facts.push({...c.financials.facts.find(f=>f.metric==='netIncome'),id:'discontinued',metric:'discontinuedNetIncome',value:100,periodEnd:'2025-12-31'});},c=>{c.financials.facts=c.financials.facts.filter(f=>f.metric!=='netIncome'||f.periodEnd<'2025-01-01');}]){
    const c=company();mutate(c);const result=api.buildFinancialAssessment(input({company:c}));
    assert.equal(result.valuation.decisionGrade,false);
  }
  const c=company();c.financials.facts.push({...c.financials.facts.find(f=>f.metric==='netIncome'),id:'discontinued',metric:'discontinuedNetIncome',value:100,periodEnd:'2025-12-31'});
  assert.equal(api.buildFinancialAssessment(input({company:c})).businessScore,null);
});

test('unknown lifecycle and unresolved recent monetary conflicts cannot unlock the mature valuation',()=>{
  assert.equal(api.buildFinancialAssessment(input({lifecycle:undefined})).valuation.decisionGrade,false);
  const c=company();c.financials.issues.push({code:'CONFLICT',metric:'operatingCashFlow',periodEnd:'2026-06-30',reason:'Conflicting newer filing.'});
  const result=api.buildFinancialAssessment(input({company:c}));assert.equal(result.valuation.decisionGrade,false);assert.ok(result.valuation.missingInputs.some(i=>i.reasonCode==='UNRESOLVED_CONFLICT'));assert.equal(result.businessScore,null);
});

test('guidance comparisons respect explicit target direction and preserve ambiguous targets for review',()=>{
  const c=company(),common={dimension:'capex',value:5,unit:'USD',periodEnd:'2026-09-30',source:'ISSUER',sourceUrl:'https://issuer.example/filing',milestoneId:'budget'};
  c.businessEvidence=[{...common,id:'g',kind:'MANAGEMENT_GUIDANCE',text:'Spend at most 5',targetOperator:'AT_MOST',publishedAt:'2026-02-15'},{...common,id:'a',value:4,kind:'REPORTED_FACT',text:'Spent 4',publishedAt:'2026-10-01'}];
  assert.equal(api.buildFinancialAssessment(input({company:c})).thesis.guidanceReviews[0].state,'MET');
  delete c.businessEvidence[0].targetOperator;
  assert.equal(api.buildFinancialAssessment(input({company:c})).thesis.guidanceReviews[0].state,'REVIEW_REQUIRED');
});

test('newer current share evidence invalidates a superseded denominator review',()=>{
  const c=company(),old=c.financials.facts.find(f=>f.metric==='sharesOutstanding');
  c.financials.facts.push({...old,id:'newer-shares',value:20,periodEnd:'2026-06-30',filedAt:'2026-08-01'});
  const r=api.buildFinancialAssessment(input({company:c}));assert.equal(r.valuation.decisionGrade,false);assert.ok(r.valuation.missingInputs.some(x=>x.reasonCode==='SHARE_REVIEW_SUPERSEDED'));
});

test('canonical equity cash flow accounts for short-term debt payments rather than ignoring them',()=>{
  const c=company();c.financials.facts.find(f=>f.metric==='shortTermDebtNet').value=-25;
  const result=api.buildFinancialAssessment(input({company:c}));assert.equal(result.valuation.ownerCashFlow,75);
});

test('valuation lineage uses its source inputs and review publication date, not operating quality timestamp',()=>{
 const c=company();c.valuationReview.publishedAt='2026-10-01';const r=api.buildFinancialAssessment(input({company:c}));
 assert.equal(r.valuation.evidenceAsOf,'2026-10-01');assert.equal(r.evidenceAsOf,'2026-02-15');
});
test('funding risk is unknown without current reported runway; valuation readiness is not funding evidence',()=>{
 const c=company();let r=api.buildFinancialAssessment(input({company:c}));assert.equal(r.valuation.decisionGrade,true);assert.equal(r.fundingRisk.state,'unknown');
 const claim={id:'runway',dimension:'cashRunway',kind:'REPORTED_FACT',text:'Reported cash runway of six months.',value:6,unit:'months',periodEnd:'2026-09-30',publishedAt:'2026-10-01',source:'SEC',sourceUrl:'https://www.sec.gov/Archives/edgar/data/1/filing',evidenceIds:['runway-source']};
 c.businessEvidence=[claim];r=api.buildFinancialAssessment(input({company:c}));assert.equal(r.fundingRisk.state,'elevated');assert.equal(r.fundingRisk.evidenceAsOf,'2026-10-01');
 c.businessEvidence=[{...claim,value:30}];assert.equal(api.buildFinancialAssessment(input({company:c})).fundingRisk.state,'normal');
 for(const change of [{kind:'MANAGEMENT_GUIDANCE'},{publishedAt:'2026-02-01'},{unit:'USD'}]){c.businessEvidence=[{...claim,value:30,...change}];assert.equal(api.buildFinancialAssessment(input({company:c})).fundingRisk.state,'unknown');}
});

test('superseded historical conflicts remain audited without gating current supported valuation',()=>{
 const c=company();c.financials.issues.push({code:'CONFLICT',metric:'revenue',periodEnd:'2025-12-31',status:'SUPERSEDED',resolvedAt:'2026-02-15',reason:'A later unambiguous same-basis filing corrected the historical conflict.'});
 const r=api.buildFinancialAssessment(input({company:c}));assert.equal(r.valuation.decisionGrade,true);assert.ok(r.businessScore>0);assert.ok(!r.valuation.missingInputs.some(x=>x.reasonCode==='UNRESOLVED_CONFLICT'));
});

test('margin of safety uses intrinsic value as denominator, distinct from price upside',()=>{
 const fair=api.buildFinancialAssessment(input()).valuation.fairValue;
 const v=api.buildFinancialAssessment(input({currentPrice:fair*.8})).valuation;
 assert.ok(Math.abs(v.marginOfSafetyPct-20)<1e-8);
 assert.ok(Math.abs(v.upsidePct-25)<1e-8);
});
