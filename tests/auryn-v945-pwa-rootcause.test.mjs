import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("app/auryn-mobile-v945.css","utf8");
const layout=fs.readFileSync("app/layout.tsx","utf8");
const shell=fs.readFileSync("components/AppShell.tsx","utf8");

test("mobile shell has an explicit app-shell class",()=>{
  assert.match(shell,/className="aurynAppShell"/);
});

test("iOS standalone uses opaque black status bar instead of translucent overlay",()=>{
  assert.match(layout,/statusBarStyle:"black"/);
  assert.doesNotMatch(layout,/statusBarStyle:"black-translucent"/);
});

test("mobile header is fixed and shell reserves exactly one header slot",()=>{
  assert.match(css,/\.aurynHeader\{[^}]*position:fixed/);
  assert.match(css,/\.aurynAppShell\{[^}]*padding-top:calc\(56px \+ env\(safe-area-inset-top\)\)/);
});

test("portfolio summary is truly one column on mobile",()=>{
  assert.match(css,/\.aurynPortfolioSummary\{[^}]*grid-template-columns:1fr/);
  assert.match(css,/\.aurynPortfolioCondition\{[^}]*border-left:0/);
});

test("portfolio direct children cannot widen the viewport",()=>{
  assert.match(css,/\.aurynPortfolioPage>\*\{[^}]*min-width:0[^}]*max-width:100%/);
});

test("portfolio headings and copy are allowed to wrap",()=>{
  assert.match(css,/\.aurynPortfolioPage h1,.aurynPortfolioPage h2,.aurynPortfolioPage p\{[^}]*white-space:normal/);
});

test("visual and allocation sections do not hide oversized content as a fake fix",()=>{
  assert.match(css,/\.aurynPortfolioVisuals\{[^}]*overflow:visible/);
  assert.match(css,/\.aurynPortfolioComposition\{[^}]*overflow:visible/);
});

test("holdings use compact card rows on mobile",()=>{
  assert.match(css,/\.aurynPositionRow\{[^}]*grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(css,/\.aurynPositionFacts\{[^}]*display:none/);
});
