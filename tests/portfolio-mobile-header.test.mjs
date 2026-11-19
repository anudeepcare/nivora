import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (n) =>
  readFileSync(new URL("../components/" + n, import.meta.url), "utf8");
test("portfolio title is concise and all three actions stay visible without an overlay", () => {
  const s = read("PortfolioPage.tsx");
  assert.match(s, /title="Portfolio"/);
  assert.doesNotMatch(s, /<details className=\{reference.manage\}>/);
  assert.match(s, /role="group"\s+aria-label="Portfolio actions"/);
  const css = read("PortfolioReference.module.css");
  assert.match(css, /\.actionsBar\s*\{[^}]*flex-wrap: wrap/s);
  assert.doesNotMatch(css, /\.manage > div/);
  for (const text of [
    "Record transaction",
    "Cash &amp; balances",
    "Add purchase",
  ])
    assert.ok(s.includes(text));
  assert.doesNotMatch(s, /Where conviction and exposure disagree/);
});
test("phone financial summary uses two unboxed columns without hiding source notes", () => {
  const s = read("PortfolioReference.module.css");
  assert.match(
    s,
    /@media \(max-width: 840px\)\s*\{\s*\.snapshot\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/s,
  );
  assert.match(s, /\.snapshot > div > small\s*\{[^}]*color: var\(--muted\)/s);
});
test("Portfolio primary uses the same stable brand fill in either theme", () => {
  const s = read("PortfolioReference.module.css");
  assert.match(
    s,
    /\.page\.page\.page\.page :global\(\.btn\.primary\)\s*\{[^}]*background: var\(--accent-solid\);[^}]*color: #fff/s,
  );
});

test("approved phone action row fits three controls and preserves touch targets", () => {
  const css = read("PortfolioReference.module.css");
  assert.match(
    css,
    /\.actionsBar\s*\{[^}]*display: grid[^}]*grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, 1fr\) minmax\(0, 1\.05fr\)/s,
  );
  assert.match(css, /\.actionsBar > button\s*\{[^}]*min-block-size: 44px/s);
  assert.match(
    css,
    /\.actionsBar > button\s*\{[^}]*padding-inline: clamp\(4px, 1\.6vw, 10px\)/s,
  );
});
