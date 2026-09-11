import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src=fs.readFileSync("components/v65/MetricInfo.tsx","utf8");

test("metric help positions from its actual rendered dimensions",()=>{
  assert.match(src,/sheetRef=useRef<HTMLDivElement>/);
  assert.match(src,/sheetRef\.current\?\.getBoundingClientRect\(\)/);
  assert.doesNotMatch(src,/ESTIMATED_HEIGHT/);
});

test("metric help clamps fully inside the viewport",()=>{
  assert.match(src,/Math\.min\(anchor\.left\+anchor\.width\/2-width\/2,vw-width-MARGIN\)/);
  assert.match(src,/Math\.max\(MARGIN,Math\.min\(top,vh-height-MARGIN\)\)/);
});

test("help popup repositions after its content is rendered",()=>{
  assert.match(src,/requestAnimationFrame\(reposition\)/);
});
