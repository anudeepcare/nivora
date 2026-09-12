import test from "node:test";import assert from "node:assert/strict";
import {auditValuationAnchoring} from "../.engine-test/auryn/v98/valuation-audit.js";
test("anti anchoring audit measures base proximity bands",()=>{const x=auditValuationAnchoring([{symbol:"A",marketPrice:100,baseValue:101},{symbol:"B",marketPrice:100,baseValue:104},{symbol:"C",marketPrice:100,baseValue:120},{symbol:"D",marketPrice:100,baseValue:96}]);assert.equal(x.within2Pct.count,1);assert.equal(x.within5Pct.count,3);assert.equal(x.within10Pct.count,3)});
test("suspicious clustering is flagged instead of silently moved",()=>{const rows=Array.from({length:20},(_,i)=>({symbol:`S${i}`,marketPrice:100,baseValue:102}));assert.equal(auditValuationAnchoring(rows).flag,"FAIL")});
