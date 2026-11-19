import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("Today separates valued holdings from change basis and keeps mixed-session warning visible", () => {
  const s = fs.readFileSync("components/PortfolioDay.tsx", "utf8");
  for (const label of [
    "Priced holdings value · USD",
    "Sum of reported quote changes",
    "excludes cash",
    "Mixed quote dates, not one session",
    "not account performance",
    "dateTime={m.asOf}",
  ])
    assert.ok(s.includes(label), label);
  assert.doesNotMatch(s, /<details/);
  const css = fs.readFileSync("components/PortfolioDay.module.css", "utf8");
  assert.doesNotMatch(css, /position:\s*absolute|linear-gradient/);
  assert.match(css, /\.heading/);
  assert.match(css, /\.observed/);
});
test("Today priorities do not fill unavailable slots with generic promotional panels", () => {
  const s = fs.readFileSync("components/TodaySequence.tsx", "utf8");
  assert.match(
    s,
    /if \(!decision && !headline && !concentration\) return null/,
  );
  assert.match(s, /\{headline && \(/);
  assert.match(s, /\{concentration && \(/);
  assert.doesNotMatch(
    s,
    /Keep the source in view|Make room for portfolio context/,
  );
  assert.match(s, /Research prompt, not a trade instruction/);
});
