import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css=fs.readFileSync("app/auryn-mobile.css","utf8");

test("tab bar is a fixed compact 64px glass capsule",()=>{
 assert.match(css,/\.aurynBottomNav\{[^}]*height:64px/);
 assert.match(css,/\.aurynBottomNav\{[^}]*min-height:64px/);
 assert.match(css,/\.aurynBottomNav\{[^}]*max-height:64px/);
 assert.match(css,/\.aurynBottomNav\{[^}]*padding:6px/);
});
test("safe area positions the dock instead of making it taller",()=>{
 assert.match(css,/bottom:calc\(8px \+ env\(safe-area-inset-bottom\)\)/);
 const blocks=[...css.matchAll(/\.aurynBottomNav\{([^}]*)\}/g)].map(x=>x[1]);
 const b=blocks.findLast(x=>/height:64px/.test(x))||"";
 assert.doesNotMatch(b,/padding-bottom:.*safe-area-inset-bottom/);
});
test("four items are mathematically centered and equal",()=>{
 assert.match(css,/grid-template-columns:repeat\(4,1fr\)/);
 assert.match(css,/\.aurynBottomNav a\{[^}]*height:52px/);
 assert.match(css,/\.aurynBottomNav a\{[^}]*justify-content:center/);
 assert.match(css,/\.aurynBottomNav a\{[^}]*align-items:center/);
});
test("dock uses modern lighter glass treatment",()=>{
 assert.match(css,/background:rgba\(27,26,23,.72\)/);
 assert.match(css,/backdrop-filter:blur\(28px\) saturate\(180%\)/);
 assert.match(css,/border-radius:22px/);
});
test("active item is a centered compact capsule",()=>{
 assert.match(css,/\.aurynBottomNav a\.active\{[^}]*border-radius:17px/);
 assert.match(css,/\.aurynBottomNav a\.active\{[^}]*background:rgba\(196,151,83,.16\)/);
});
