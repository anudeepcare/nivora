import test from "node:test";import assert from "node:assert/strict";
import {buildThreeClockState} from "../.engine-test/auryn/v98/three-clock.js";
const base={business:88,earnings:78,moat:90,reinvestment:86,cashConversion:82,capitalAllocation:80,revisions:72,catalysts:60,technical:70};
test("technical shocks do not rewrite thesis clock",()=>{const a=buildThreeClockState(base),b=buildThreeClockState({...base,technical:15});assert.equal(a.thesis.score,b.thesis.score);assert.ok(b.tactical.score<a.tactical.score)});
test("corroborated fundamental deterioration reduces thesis persistence",()=>{const x=buildThreeClockState({...base,business:38,earnings:35,moat:42,reinvestment:40,cashConversion:36});assert.ok(x.thesis.deterioration>=60);assert.ok(x.thesis.score<60)});
