import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8"),persist=read("lib/auryn/v995/persist-research.ts"),paper=read("app/api/trading-lab/run-paper/route.ts"),status=read("app/api/trading-lab/status/route.ts"),page=read("app/trading-lab/page.tsx");
test("autonomous research persists V935 canonical provenance",()=>{assert.ok(persist.includes("buildV935Provenance"));assert.ok(persist.includes("v935:canonical"));assert.ok(persist.includes("AUTONOMOUS_RESEARCH_ENGINE_VERSION"));});
test("paper runner consumes autonomous canonical research not legacy V65 learning snapshots",()=>{assert.ok(paper.includes("AUTONOMOUS_RESEARCH_ENGINE_VERSION"));assert.ok(!paper.includes('.eq("engine_version",ENGINE_VERSION)'));});
test("status audit consumes same autonomous canonical research",()=>{assert.ok(status.includes("AUTONOMOUS_RESEARCH_ENGINE_VERSION"));assert.ok(status.includes("decisionSnapshotsResult"));});
test("trading lab scheduled auth prefers canonical CRON_SECRET",async()=>{
 const ts=(await import('typescript')).default,vm=await import('node:vm'),crypto=await import('node:crypto');const exports={};
 vm.runInNewContext(ts.transpileModule(read('lib/server/paper-operations.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='node:crypto'?crypto:{},Buffer,process:{env:{}},Request});
 const env={CRON_SECRET:'canonical',TRADING_LAB_CRON_SECRET:'legacy'},request=token=>new Request('https://app',{headers:{authorization:`Bearer ${token}`}});
 assert.equal(exports.authorizePaperCron(request('canonical'),env),true);assert.equal(exports.authorizePaperCron(request('legacy'),env),false);
 assert.ok(paper.includes('authorizePaperCron(req)'));
});
test("UI does not expose obsolete V9.3.5 provenance failure copy",()=>{assert.ok(!page.includes("V9.3.5 canonical snapshot provenance is missing"));assert.ok(page.includes("fresh canonical research"));});
test("UI prioritizes current run over lifetime order totals",()=>{assert.ok(page.includes("latestRun"));assert.ok(page.includes("THIS CHECK"));assert.ok(page.includes("Historical paper orders"));});
test("trading lab uses compact decision summary",()=>{for(const x of ["aurynLabCompactFunnel","aurynLabDecisionGrid","aurynLabCurrentRun"])assert.ok(page.includes(x),x);});
