import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (n) =>
  readFileSync(new URL("../components/" + n, import.meta.url), "utf8");
test("portfolio title is concise and secondary actions remain reachable in Manage", () => {
  const s = read("PortfolioPage.tsx");
  assert.match(s, /title="Portfolio"/);
  assert.match(s, /<details className=\{reference.manage\}>/);
  for (const text of ["Record transaction", "Cash & balances", "Add position"])
    assert.ok(s.includes(text));
  assert.doesNotMatch(s, /Where conviction and exposure disagree/);
});
test("phone financial summary uses compact labelled rows without hiding source notes", () => {
  const s = read("PortfolioReference.module.css");
  assert.match(
    s,
    /\.page\.page\.page\.page :global\(\.wealth-strip\.four\)\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/s,
  );
  assert.match(
    s,
    /\.page\.page\.page\.page :global\(\.wealth-strip\.four\) > div > small\s*\{[^}]*grid-column: 1 \/ -1/s,
  );
});
test("Portfolio primary uses the same stable brand fill in either theme", () => {
  const s = read("PortfolioReference.module.css");
  assert.match(
    s,
    /\.page\.page\.page\.page :global\(\.btn\.primary\)\s*\{[^}]*background: var\(--accent-solid\);[^}]*color: #fff/s,
  );
});
