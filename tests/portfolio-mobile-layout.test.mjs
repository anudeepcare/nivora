import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (n) =>
  readFileSync(new URL("../components/" + n, import.meta.url), "utf8");
test("history chart geometry follows its measured panel width rather than shrinking 800px text on phones", () => {
  const s = read("AccountHistory.tsx");
  assert.match(s, /new ResizeObserver/);
  assert.match(s, /viewBox=\{`0 0 \$\{chartWidth\} 210`\}/);
  assert.match(s, /amount\(high, "USD", true\)/);
  assert.match(s, /chartWidth - 84/);
});
test("phone holdings preserve real column headers and contain horizontal scrolling locally", () => {
  const s = read("PortfolioReference.module.css");
  assert.match(s, /\.holdingsScroll\s*\{[^}]*min-width:\s*0/s);
  assert.match(
    s,
    /@media \(max-width: 700px\)[\s\S]*display: table-header-group/,
  );
  assert.match(s, /content: none/);
  assert.match(s, /overscroll-behavior-x: contain/);
});
test("phone forms and ledger scroll regions stay within history panel", () => {
  const s = read("AccountHistory.module.css"),
    c = read("ContributionCompare.module.css");
  assert.match(s, /\.history > \*\s*\{[^}]*min-width: 0/s);
  assert.match(s, /:global\(\.table-scroll\)\s*\{[^}]*overflow-x: auto/s);
  assert.match(
    c,
    /@media \(max-width: 430px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/,
  );
});
