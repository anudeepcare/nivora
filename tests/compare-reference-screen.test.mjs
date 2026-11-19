import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (n) =>
  readFileSync(new URL("../components/" + n, import.meta.url), "utf8");
test("Compare uses the reference header, editable selection and explicitly non-ranking highlight", () => {
  const s = read("SupportingViews.tsx");
  assert.match(s, /compareStyles.page/);
  assert.match(s, /Change companies/);
  assert.match(
    s,
    /Highlighted column is a comparison reference, not a ranking/,
  );
  assert.match(s, /aria-pressed=\{r.company.symbol === referenceSymbol\}/);
  assert.match(s, /setReferenceSymbol/);
});
test("reference comparison keeps dated evidence and existing tools without invented scores or allocation", () => {
  const s = read("SupportingViews.tsx");
  assert.match(s, /loadComparison/);
  assert.match(s, /comparisonCompatibility/);
  assert.match(s, /saveComparison/);
  assert.match(s, /Free cash flow margin/);
  assert.match(s, /No suggested\s+allocation is generated/);
  assert.match(s, /<ContributionCompare[\s\S]*defaultOpen/);
  assert.doesNotMatch(s, /APP.*1,100|Best fit now|BEST FIT/);
});
test("contribution separates current assessment from historical Pace and retains full rationale on demand", () => {
  const s = read("ContributionCompare.tsx");
  assert.match(s, /Current assessment/);
  assert.match(s, /Current eligible Pace/);
  assert.match(s, /className=\{s.evidenceDetails\}/);
  assert.match(s, /Evidence and limitations/);
  assert.match(s, /d.explanation.detail/);
});
