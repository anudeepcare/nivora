import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page=fs.readFileSync("app/portfolio/page.tsx","utf8");
const css=fs.readFileSync("app/globals.css","utf8");

test("portfolio holdings use direct edit/delete icon actions without overflow menu",()=>{
  assert.doesNotMatch(page,/className="v6523Overflow"/);
  assert.match(page,/className="v6526RowActions"/);
  assert.match(page,/aria-label={`Edit \${x\.symbol}`}/);
  assert.match(page,/aria-label={`Delete \${x\.symbol}`}/);
  assert.match(css,/\.v6526RowActions/);
});
