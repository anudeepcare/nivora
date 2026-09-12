import test from "node:test";import assert from "node:assert/strict";
import {fingerprintShadowSnapshot,outcomeDueAt} from "../.engine-test/auryn/v99/shadow-cio.js";
const x={modelVersion:"v9.9",symbol:"IREN",evaluationDate:"2026-09-12",runKind:"DAILY_CLOSE",marketPrice:43.83,decision:{newMoney:"WAIT"},evidenceFingerprint:"abc"};
test("shadow snapshot fingerprint is deterministic",()=>{assert.equal(fingerprintShadowSnapshot(x),fingerprintShadowSnapshot({...x}))});
test("outcome horizons are deterministic",()=>{assert.equal(outcomeDueAt("2026-09-12","1W"),"2026-09-19");assert.equal(outcomeDueAt("2026-09-12","1M"),"2026-10-12")});
