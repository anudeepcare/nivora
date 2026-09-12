import test from "node:test";import assert from "node:assert/strict";
import {buildFundamentalScenarioSpectrum} from "../.engine-test/auryn/v98/fundamental-scenarios.js";
const independent={bearValue:32,baseValue:61,bullValue:94,horizonYears:3,confidence:78,basis:"normalized owner earnings + reinvestment economics"};
test("intrinsic scenarios are invariant to current market price",()=>{const a=buildFundamentalScenarioSpectrum({...independent,marketPrice:40}),b=buildFundamentalScenarioSpectrum({...independent,marketPrice:80});assert.equal(a.base.value,b.base.value);assert.equal(a.bull.value,b.bull.value);assert.notEqual(a.base.impliedAnnualReturnPct,b.base.impliedAnnualReturnPct)});
test("missing independent base value does not fabricate a scenario from market price",()=>{const x=buildFundamentalScenarioSpectrum({bearValue:null,baseValue:null,bullValue:null,horizonYears:3,confidence:20,basis:"missing",marketPrice:50});assert.equal(x,null)});
