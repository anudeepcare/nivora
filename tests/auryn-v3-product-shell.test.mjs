import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(p)=>fs.readFileSync(p,"utf8");

test("root layout loads the AURYN V3 design system without legacy responsive layers",()=>{
  const src=read("app/layout.tsx");
  assert.match(src,/\.\/auryn-tokens\.css/);
  assert.match(src,/\.\/auryn-product\.css/);
  assert.doesNotMatch(src,/v65-responsive\.css/);
  assert.doesNotMatch(src,/\.\/auryn\.css/);
});

test("shared shell publishes mobile safe-area compensation",()=>{
  const css=read("app/auryn-product.css");
  assert.match(css,/--mobile-nav-height/);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/\.aurynAppMain/);
  assert.match(css,/\.aurynBottomNav/);
});
