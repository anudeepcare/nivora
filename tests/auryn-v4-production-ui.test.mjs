import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");

test("stock page computes the V4 canonical analysis from current evidence",()=>{
  const s=read("components/StockClient.tsx");
  assert.match(s,/adaptCurrentEvidenceToV4/);
  assert.match(s,/buildAurynV4CoreAnalysis/);
  assert.match(s,/const v4Analysis=useMemo/);
  assert.match(s,/v4=\{v4Analysis\}/);
});

test("one institutional brain exposes beginner pro and extreme pro depth",()=>{
  const s=read("components/StockClient.tsx");
  assert.match(s,/const\[depth,setDepth\]=useState<Depth>/);
  for(const x of ["Beginner","Pro","Extreme Pro"])assert.match(s,new RegExp(`>${x}<`));
});

test("decision summary is V4 decision-first with multiple horizons and confidence not probability",()=>{
  const s=read("components/stock/StockDecisionSummary.tsx");
  assert.match(s,/AURYN V4 · DECISION/);
  assert.match(s,/DECISION CONFIDENCE/);
  assert.match(s,/NOW/);
  assert.match(s,/SWING/);
  assert.match(s,/6–12M/);
  assert.match(s,/3–5Y/);
  assert.match(s,/NEW MONEY/);
  assert.match(s,/IF YOU OWN IT/);
  assert.doesNotMatch(s,/win probability|profit probability|chance of profit/i);
});

test("V4 decision and depth controls have responsive production styles",()=>{
  const c=read("app/globals.css");
  assert.match(c,/\.aurynDepthSwitch\{/);
  assert.match(c,/\.aurynV4Horizons\{/);
  assert.match(c,/\.aurynV4ModelAudit\{/);
  assert.match(c,/@media\(max-width:700px\)[\s\S]*\.aurynV4Horizons/);
});
