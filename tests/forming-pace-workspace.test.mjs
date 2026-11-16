import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { researchAccumulation } from "../lib/accumulation-policy-v7.ts";
import { currentPace } from "../lib/current-pace.ts";
const fixtures = JSON.parse(
  fs.readFileSync("tests/fixtures/pace-v6-bars.json"),
);
for (const fixture of fixtures.slice(0, 3))
  test(`${fixture.symbol}: one-year source preserves provisional display without confirmed buying eligibility`, () => {
    const bars = fixture.bars.toSorted((a, b) => a.time.localeCompare(b.time));
    const end = bars.at(-1).time;
    const cutoff = new Date(Date.parse(end) - 365 * 86400000)
      .toISOString()
      .slice(0, 10);
    const now = Date.parse(end + "T23:59:00Z");
    const policy = researchAccumulation(
      bars.filter((x) => x.time >= cutoff),
      new Date(now).toISOString(),
    );
    const pace = currentPace(policy, now);
    assert.equal(pace.historicalLevel, null);
    assert.equal(pace.provisional, true);
    assert.notEqual(pace.level, null);
    assert.ok(pace.eligibleLevel === null || pace.eligibleLevel <= 1);
  });
test("workspace display uses current level while opportunity board retains eligibility gate", () => {
  const ui = fs.readFileSync("components/WorkspacePace.tsx", "utf8");
  assert.match(ui, /signal\?\.currentPace/);
  assert.match(ui, /provisional/);
  assert.match(
    ui,
    /r\.signal\?\.view\.permitted && \(r\.signal\.view\.rawLevel \?\? 0\) >= 2/,
  );
  assert.match(ui, /No confirmed accumulation opportunities/);
});
