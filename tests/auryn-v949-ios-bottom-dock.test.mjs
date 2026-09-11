import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css=fs.readFileSync("app/auryn-mobile.css","utf8");

test("glass dock is compact instead of a tall panel",()=>{
 const blocks=[...css.matchAll(/\.aurynBottomNav\{([^}]*)\}/g)].map(x=>x[1]);
 const b=blocks.findLast(x=>/min-height:52px/.test(x))||"";
 assert.match(b,/min-height:52px/);
 assert.match(b,/padding:4px 5px calc\(4px \+ env\(safe-area-inset-bottom\)\)/);
});
test("dock floats close to the home indicator with narrow side gutters",()=>{
 const blocks=[...css.matchAll(/\.aurynBottomNav\{([^}]*)\}/g)].map(x=>x[1]);
 const b=blocks.findLast(x=>/min-height:52px/.test(x))||"";
 assert.match(b,/bottom:4px/);
 assert.match(b,/left:8px/);
 assert.match(b,/right:8px/);
});
test("dock is lighter glass and active item is compact",()=>{
 assert.match(css,/background:rgba\(21,19,15,.78\)/);
 assert.match(css,/\.aurynBottomNav a\{[^}]*min-height:44px/);
 assert.match(css,/\.aurynBottomNav a\.active\{[^}]*background:rgba\(199,153,83,.12\)/);
});
test("main page only reserves compact dock clearance",()=>{
 const b=css.match(/\.aurynAppMain\{([^}]*)\}/)?.[1]||"";
 assert.match(b,/padding-bottom:68px/);
});
