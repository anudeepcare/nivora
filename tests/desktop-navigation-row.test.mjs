import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync("components/WorkspaceShell.module.css", "utf8");
test("desktop navigation never forces a second row at tablet desktop widths", () => {
  const block = css.slice(
    css.indexOf("@media (min-width: 768px) and (max-width: 1199px)"),
    css.indexOf(":global([data-keyboard-open"),
  );
  assert.doesNotMatch(block, /flex-wrap:\s*wrap|order:\s*4|flex:\s*1 0 100%/);
  assert.match(block, /flex-wrap:\s*nowrap/);
  assert.match(block, /overflow-x:\s*auto/);
  assert.match(block, /flex:\s*1 1 0/);
  assert.match(block, /\.searchTrigger[\s\S]*width:\s*44px/);
});
test("mobile retains its independent bottom-navigation pattern", () => {
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*\.shell \.header \.nav\s*\{\s*display:\s*none/,
  );
});
