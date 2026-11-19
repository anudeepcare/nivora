import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const s = fs.readFileSync("components/PortfolioReference.module.css", "utf8");
test("four independent metric cards match the approved sheet with no enclosing frame", () => {
  assert.match(
    s,
    /\.snapshot\s*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)[^}]*border: 0[^}]*background: none/s,
  );
  assert.match(
    s,
    /\.snapshot > div\s*\{[^}]*border: 1px solid[^}]*border-radius: 17px/s,
  );
  assert.match(
    s,
    /\.snapshot > div:first-child\s*\{[^}]*background: var\(--portfolio-net-bg\)/s,
  );
  assert.match(
    s,
    /@media \(max-width: 840px\)\s*\{\s*\.snapshot\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/s,
  );
});
test("desktop makes the chart dominant with allocation adjacent and holdings below", () => {
  assert.match(
    s,
    /grid-template-columns: minmax\(0, 3fr\) minmax\(260px, 1fr\)/,
  );
  assert.match(s, /\.grid > \.history\s*\{\s*grid-column: 1/s);
  assert.match(s, /\.grid > \.capitalOverview\s*\{\s*grid-column: 2/s);
  assert.match(s, /\.grid > \.holdings\s*\{\s*grid-column: 1 \/ -1/s);
  assert.match(
    s,
    /\.history,\s*\.capitalOverview,\s*\.holdings\s*\{[^}]*background: var\(--card\)/s,
  );
});
