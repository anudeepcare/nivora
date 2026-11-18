import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync(
  new URL("../components/PortfolioDay.module.css", import.meta.url),
  "utf8",
);
test("session movers reserve intrinsic amounts and wrap long symbols instead of overlapping", () => {
  assert.doesNotMatch(css, /grid-template-columns:\s*56px/);
  assert.match(
    css,
    /\.movers li\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) max-content max-content/s,
  );
  assert.match(css, /\.movers a\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /repeat\(auto-fit, minmax\(min\(100%, 260px\), 1fr\)\)/);
});
test("mixed observations cannot be presented as a single latest session", () => {
  const source = readFileSync(
    new URL("../components/PortfolioDay.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /Your holdings · latest session|Your holdings in the latest session/,
  );
  assert.match(source, /Mixed quote dates, not one session/);
  assert.match(source, /dateTime=\{d.oldestAsOf\}/);
  assert.match(source, /dateTime=\{d.asOf\}/);
  assert.match(source, /Quote observed \$\{m.asOf\}/);
});
