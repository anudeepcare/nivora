import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css=fs.readFileSync("app/globals.css","utf8");
test("desktop holding actions stay in the same row at the far right",()=>{
  assert.match(css,/V65\.26\.3 — desktop single-row holding actions/);
  assert.match(css,/\.portfolioPage \.v65PosMain\{grid-column:1!important/);
  assert.match(css,/\.portfolioPage \.v65PosMetrics\{grid-column:2!important/);
  assert.match(css,/\.portfolioPage \.v6522DecisionRow\{grid-column:3!important/);
  assert.match(css,/\.portfolioPage \.v6526RowActions\{grid-column:4!important/);
  assert.match(css,/grid-template-columns:minmax\(300px,2fr\) minmax\(520px,2\.6fr\) minmax\(250px,1\.35fr\) 76px!important/);
});
