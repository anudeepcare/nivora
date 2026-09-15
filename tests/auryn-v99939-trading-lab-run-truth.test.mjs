import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8"),status=read("app/api/trading-lab/status/route.ts"),page=read("app/trading-lab/page.tsx"),css=read("app/auryn-premium.css");
test("status API separates latest-run evaluations from previous checks",()=>{for(const x of ["currentRunEvaluations","previousEvaluations","latestRunStartedAt"])assert.ok(status.includes(x),x);});
test("current check uses current-run rows only",()=>{assert.ok(page.includes("currentRows"));assert.ok(page.includes("previousRows"));assert.ok(page.includes("PREVIOUS CHECKS"));});
test("empty processed run explains why instead of looking broken",()=>{for(const x of ["No canonical decisions were available for this check","Waiting for fresh canonical research"])assert.ok(page.includes(x),x);});
test("status headline is explicitly readable",()=>{assert.ok(css.includes(".aurynLabStatus h2{color:#171411!important"));assert.ok(css.includes("opacity:1!important"));});
test("old identical provenance blocks are grouped away from current check",()=>{assert.ok(page.includes("Previous blocked evaluations"));assert.ok(!page.includes("rows.slice(0,12)"));});
test("confirmed working workflow auth remains canonical",()=>{const w=read(".github/workflows/nivora-portfolio-learning.yml");assert.ok(w.includes("AURYN_BASE_URL")&&w.includes("CRON_SECRET"));assert.ok(!w.includes("AURYN_PRODUCTION_URL")&&!w.includes("TRADING_LAB_CRON_SECRET"));});
