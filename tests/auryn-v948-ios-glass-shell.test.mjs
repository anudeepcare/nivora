import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layout=fs.readFileSync("app/layout.tsx","utf8");
const css=fs.readFileSync("app/auryn-mobile.css","utf8");

test("standalone status bar returns to translucent native overlay",()=>{
  assert.match(layout,/statusBarStyle:"black-translucent"/);
});

test("app shell does not reserve the iOS top inset twice",()=>{
  const block=css.match(/\.aurynAppShell\{([^}]*)\}/)?.[1]||"";
  assert.match(block,/padding-top:50px/);
  assert.doesNotMatch(block,/safe-area-inset-top/);
});

test("header paints under iOS status area while toolbar content starts below it",()=>{
  const block=css.match(/\.aurynHeader\{([^}]*)\}/)?.[1]||"";
  assert.match(block,/height:calc\(50px \+ env\(safe-area-inset-top\)\)/);
  assert.match(block,/padding:env\(safe-area-inset-top\)/);
});

test("content reserve does not add bottom safe area a second time",()=>{
  const block=css.match(/\.aurynAppMain\{([^}]*)\}/)?.[1]||"";
  assert.match(block,/padding-bottom:76px/);
  assert.doesNotMatch(block,/safe-area-inset-bottom/);
});

test("bottom nav owns the bottom safe area exactly once",()=>{
  const block=css.match(/\.aurynBottomNav\{([^}]*)\}/)?.[1]||"";
  assert.match(block,/bottom:8px/);
  assert.match(block,/padding-bottom:calc\(6px \+ env\(safe-area-inset-bottom\)\)/);
});

test("bottom nav uses glass rather than a full-height black slab",()=>{
  const block=css.match(/\.aurynBottomNav\{([^}]*)\}/)?.[1]||"";
  assert.match(block,/backdrop-filter:blur\(22px\)/);
  assert.match(block,/border-radius:18px/);
  assert.match(block,/left:10px/);
  assert.match(block,/right:10px/);
});

test("standalone mode has explicit top and bottom chrome ownership",()=>{
  assert.match(css,/@media\(display-mode:standalone\)/);
  assert.match(css,/body\{background:#15130f/);
});
