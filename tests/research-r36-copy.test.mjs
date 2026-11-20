import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (name) =>
  fs.readFileSync(
    new URL("../components/" + name + ".tsx", import.meta.url),
    "utf8",
  );
test("Atlas skips instructional filler while keeping evidence, range notes and actions", () => {
  const atlas = read("ReferenceAtlas");
  assert.doesNotMatch(atlas, /Select an orbit to inspect the evidence/);
  assert.match(atlas, /Use the labeled buttons to inspect each area/);
  assert.match(atlas, /referenceRange\.note/);
  assert.match(atlas, /m\.outcome\.caveat/);
  assert.match(atlas, /Input availability · not confidence/);
});
test("Scenarios and Events do not wrap concise status or a closed disclosure in empty panels", () => {
  assert.doesNotMatch(read("ValueStudio"), /About the pricing evidence/);
  assert.match(
    read("ValueStudio"),
    /Market multiples not supplied; missing values are not zero/,
  );
  const earnings = read("EarningsReview");
  assert.match(earnings, /if \(contextOnly\) return businessChanges/);
  assert.match(earnings, /data-research-disclosure/);
  assert.match(earnings, /Not supplied|annual evidence is unavailable/);
  assert.match(earnings, /bridge\.latest\.sourceUrl/);
});
test("Technical metrics retain methodological help without repeating group notes, Indicator tables remain expandable", () => {
  assert.match(
    read("TechnicalDashboard"),
    /<Help label={g.title}>{g.note}<\/Help>/,
  );
  assert.match(
    read("TechnicalDashboard"),
    /Chart interval changes do not alter these/,
  );
  const indicators = read("IndicatorOverview");
  assert.doesNotMatch(
    indicators,
    /Reported business performance and completed market evidence/,
  );
  assert.match(indicators, /Dates &amp; values/);
  assert.match(indicators, /Historical observations only; not a trading/);
});
test("ownership source caveats are consolidated without losing date or share-basis boundaries", () => {
  const ownership = read("OwnershipPicture");
  assert.match(ownership, /Aggregate reporting date not\s+supplied/);
  assert.match(ownership, /Retrieval time is not the reporting date/);
  assert.match(ownership, /share\s+bases can differ/);
  assert.match(ownership, /delayed disclosures, not live/);
});
