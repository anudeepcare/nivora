import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");

test("V4 evidence migration feeds the V5 canonical analysis",()=>{
  const s=read("components/StockClient.tsx");
  assert.match(s,/adaptCurrentEvidenceToV4/);
  assert.match(s,/buildAurynV4CoreAnalysis/);
  assert.match(s,/const v4Analysis=useMemo/);
  assert.match(s,/buildAurynV5Analysis/);
  assert.match(s,/v4:v4Analysis/);
});

test("one institutional brain exposes beginner pro and extreme pro depth inside the canonical decision",()=>{
  const page=read("components/StockClient.tsx");
  const decision=read("components/stock/v5/StockV5Decision.tsx");
  assert.match(page,/const\[depth,setDepth\]=useState<Depth>/);
  assert.match(page,/depth=\{depth\} onDepthChange=\{setDepth\}/);
  for(const x of ["Beginner","Pro","Extreme Pro"])assert.match(decision,new RegExp(`>${x}<`));
});

test("decision summary is V8 reality-audited with multiple horizons and evidence confidence not probability",()=>{
  const s=read("components/stock/v5/StockV5Decision.tsx");
  assert.match(s,/AURYN V8 · REALITY AUDITED/);
  assert.match(s,/EVIDENCE CONFIDENCE/);
  assert.match(s,/NOW/);
  assert.match(s,/SWING/);
  assert.match(s,/6–12M/);
  assert.match(s,/3–5Y/);
  assert.match(s,/NEW MONEY/);
  assert.match(s,/IF YOU OWN IT/);
  assert.doesNotMatch(s,/win probability|profit probability|chance of profit/i);
});

test("V5 decision and depth controls have responsive production styles",()=>{
  const c=read("app/auryn-product.css");
  assert.match(c,/\.aurynDecisionDepth\{/);
  assert.match(c,/\.aurynExecutionPlanV5\{/);
  assert.match(c,/@media\(max-width:700px\)[\s\S]*\.aurynDecisionDepth/);
});

test("stock research tabs consume the V5 canonical decision and use one aligned page shell",()=>{
  const s=read("components/StockClient.tsx");
  assert.match(s,/StockThesisPanel decision=\{presentedDecision\} v5=\{v5Analysis\}/);
  assert.match(s,/className="aurynStockTabPage v12Fund"/);
  assert.match(s,/className="aurynStockTabPage v12Earnings"/);
  assert.match(s,/className="aurynStockTabPage v12Technical v26Technical"/);
  assert.doesNotMatch(s,/className="techRead"/);
});

test("analysis depth is compact inside the decision surface and global duplicate strips are removed",()=>{
  const s=read("components/StockClient.tsx");
  assert.doesNotMatch(s,/className="aurynDepthSwitch"/);
  assert.doesNotMatch(s,/className="v65ContextStrip v659ContextStrip"/);
  assert.match(s,/depth=\{depth\} onDepthChange=\{setDepth\}/);
});
