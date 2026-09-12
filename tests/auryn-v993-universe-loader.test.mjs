import test from "node:test";import assert from "node:assert/strict";
import {validationUniverseColumns,validationUniversePageRanges} from "../.engine-test/auryn/v993/universe-loader.js";
test("universe loader never selects star",()=>{assert.equal(validationUniverseColumns.includes("*"),false);assert.equal(validationUniverseColumns,"symbol,sector,asset_type,name,priority")});
test("universe loader pages deterministically",()=>{assert.deepEqual(validationUniversePageRanges(2500,1000),[[0,999],[1000,1999],[2000,2499]])});
