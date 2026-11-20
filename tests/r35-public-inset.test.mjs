import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
test("adjacent public routes share inset width and nonsticky navigation without targeting signed-in plans", () => {
  for (const [file, selector] of [
    ["PublicFrame", ".page.page"],
    ["Plans", ".page:global(.plans-public)"],
    ["Contact", ".page.page.page"],
  ]) {
    const css = fs.readFileSync(`components/${file}.module.css`, "utf8");
    assert.ok(css.includes(selector), file);
    assert.match(css, /inline-size: min\(calc\(100% - 32px\), 1080px\)/, file);
    assert.match(css, /margin: 20px auto 0/, file);
    assert.match(css, /position: static/, file);
    assert.match(css, /margin-block-end: 22px/, file);
  }
});
