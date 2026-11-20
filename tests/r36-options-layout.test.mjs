import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
const read = (name) => readFileSync(`components/${name}`, "utf8");
test("Options presents primary data first and consolidates repeated instructions", () => {
  const source = read("OptionsDesk.tsx");
  assert.doesNotMatch(
    source,
    /<QuickRead|Choose an expiration to explore|Read before choosing a contract/,
  );
  assert.match(source, /<dl\s+className=\{deskStyles.snapshotStrip\}/);
  assert.ok(
    source.indexOf("<MarketWorkspace") <
      source.indexOf("<summary>Data & definitions"),
  );
  assert.doesNotMatch(source, /<summary>Most traded strikes/);
  assert.match(
    read("OptionsExpiryComparison.tsx"),
    /<section\s+className=\{s.comparison\}/,
  );
});
test("empty account does not render a disclosure but still has a save action", () => {
  const source = read("MarketWorkspace.tsx");
  assert.match(source, /snapshots.length === 0 \? \(/);
  assert.match(
    source,
    /aria-label="Account snapshot actions"[\s\S]+?\{saveActions\}/,
  );
  assert.match(source, /op: "capture"/);
});
test("Positioning mode renders charts before source record disclosures", () => {
  const source = read("SentiSensePanels.tsx");
  assert.ok(
    source.indexOf("<OptionsPositioningOverview") <
      source.indexOf("Detailed positioning observations"),
  );
  assert.ok(
    source.indexOf("<OptionsObservationChart") <
      source.indexOf("Evidence dates & coverage"),
  );
});
