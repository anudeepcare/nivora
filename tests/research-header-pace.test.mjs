import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("components/Research.tsx", "utf8");
test("compact header uses actual current or completed Pace, never illustrative P2", () => {
  assert.match(source, /headerPace = p\?\.dca.forming \?\? p\?\.dca.confirmed/);
  assert.match(source, /paceCode\(headerPace.multiplier\)/);
  assert.match(source, /PACE_LEVELS\[headerPace.multiplier\]/);
  assert.match(source, /Pace unavailable/);
  assert.match(source, /Provisional current-month reading/);
  assert.match(source, /headerPaceProvisional \? "\*" : ""/);
  assert.match(source, /Current month · provisional/);
  assert.match(source, /Completed month/);
  assert.match(source, /Help label="this Pace reading"/);
});
test("inner rails have isolated styling hooks, preserving selection keyboard handling", () => {
  assert.match(
    source,
    /cockpit.supporting} auryn-view-tabs research-compact-tabs/,
  );

  assert.match(source, /onKeyDown={\(event\) => navigateSelection\(event\)}/);
});
