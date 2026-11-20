import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync("components/Search.module.css", "utf8");
test("shared search owns one visible ring and overrides inherited themed input outline", () => {
  assert.match(
    css,
    /global\(#auryn-app\)[^{]+input:is\(:focus, :focus-visible\)[^{]+\{[^}]+outline: none/s,
  );
  assert.match(
    css,
    /search-box\):focus-within\s*\{[^}]+outline: 2px solid var\(--plaid-focus/s,
  );
  assert.match(css, /:has\(> button:focus-visible\)\s*\{[^}]+outline: none/s);
});
test("clear action and shortcut share a stable trailing slot", () => {
  assert.match(css, /grid-template-columns: 19px minmax\(0, 1fr\) 44px/);
  assert.match(css, /form.search-box\) > button:focus-visible/);
  assert.match(css, /form.search-box\) > kbd\s*\{[^}]+justify-self: center/s);
});
