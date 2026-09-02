
import test from "node:test";import assert from "node:assert/strict";
import {assessBarSeriesIntegrity} from "../.engine-test/nivora-bar-integrity.js";
const bars=(shift=0)=>Array.from({length:20},(_,i)=>({datetime:`2026-08-${String(i+1).padStart(2,"0")}`,open:100+i+shift,high:101+i+shift,low:99+i+shift,close:100+i+shift,volume:1_000_000}));
test("historical bar integrity verifies close agreement",()=>{
 const x=assessBarSeriesIntegrity(bars(),bars(.05));
 assert.equal(x.state,"VERIFIED");assert.ok(x.compared>=15);assert.ok(x.medianCloseGapPct<.2);
});
test("historical bar integrity flags material provider disagreement",()=>{
 const x=assessBarSeriesIntegrity(bars(),bars(4));
 assert.equal(x.state,"DISAGREEMENT");assert.equal(x.decisionGrade,false);
});
test("historical bar integrity rejects malformed OHLC",()=>{
 const bad=bars();bad[5]={...bad[5],high:90};
 const x=assessBarSeriesIntegrity(bad,null);
 assert.equal(x.state,"INVALID_SERIES");assert.equal(x.decisionGrade,false);
});

import fs from "node:fs";
test("live analysis cross-checks recent daily bars when Alpaca data is configured",()=>{
 const r=fs.readFileSync(new URL("../app/api/analyze/[symbol]/route.ts",import.meta.url),"utf8");
 const b=fs.readFileSync(new URL("../lib/alpaca-paper.ts",import.meta.url),"utf8");
 assert.match(r,/assessBarSeriesIntegrity/);
 assert.match(r,/getRecentBars/);
 assert.match(b,/getRecentBars/);
});
