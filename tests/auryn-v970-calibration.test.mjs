import test from "node:test";
import assert from "node:assert/strict";
import {auditAurynDecisions} from "../.engine-test/auryn-decision-audit.js";
import {buildOpportunityLens} from "../.engine-test/auryn/v936/opportunity.js";

test("opportunity lens rewards quality without letting timing fully erase it",()=>{
 const strong=buildOpportunityLens({scores:{business:90,earningsRevisions:82,valuation:70,marketStructure:48,catalystsRegime:60,riskAsymmetry:65,entryQuality:42,relativeStrength:45,participation:40,rewardRisk:2,volatilityRisk:45}});
 const weak=buildOpportunityLens({scores:{business:40,earningsRevisions:42,valuation:70,marketStructure:70,catalystsRegime:60,riskAsymmetry:65,entryQuality:70,relativeStrength:70,participation:70,rewardRisk:2,volatilityRisk:45}});
 assert.ok(strong.opportunityScore>=weak.opportunityScore-10);
});

test("audit reports high-quality WAIT concentration separately",()=>{
 const rows=[
  {symbol:"A",newMoneyAction:"WAIT",ownerAction:"HOLD",longTermAction:"ATTRACTIVE",opportunityScore:75,evidenceQuality:90},
  {symbol:"B",newMoneyAction:"WAIT",ownerAction:"HOLD",longTermAction:"ATTRACTIVE",opportunityScore:78,evidenceQuality:92},
  {symbol:"C",newMoneyAction:"BUY",ownerAction:"ADD",longTermAction:"ATTRACTIVE",opportunityScore:85,evidenceQuality:93}
 ];
 const x=auditAurynDecisions(rows);
 assert.equal(x.diagnostics.highQualityWait.count,2);
 assert.deepEqual(x.diagnostics.highQualityWait.symbols,["A","B"]);
});
