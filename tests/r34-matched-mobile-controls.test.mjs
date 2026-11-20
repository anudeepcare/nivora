import test from "node:test";
import fs from "node:fs";
import assert from "node:assert/strict";
const read = (p) => fs.readFileSync(p, "utf8");
test("compare and discovery replace desktop width basis with natural input height when stacked", () => {
  const css = read("components/PlaidDiscovery.module.css");
  const legacy = read("app/core/surfaces.css");
  assert.match(
    legacy,
    /@media \(max-width: 600px\) \{\s*\.product \.compare-search \{\s*flex-direction: column/,
  );
  assert.match(css, /flex: 1 1 220px/);
  const stacked = css.match(/@media \(max-width: 600px\) \{([\s\S]*?)(?:\n\})/);
  assert.ok(stacked, "match the actual mobile stack breakpoint");
  for (const view of ["compare", "discovery"])
    assert.ok(
      stacked[1].includes(`.${view}.${view} :global(.compare-search) input`),
    );
  assert.match(stacked[1], /input\s*\{\s*flex: none;\s*width: 100%;/);
});
