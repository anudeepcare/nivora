import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (f) => fs.readFileSync(`components/${f}.tsx`, "utf8");
test("market views use shared flat hierarchy while mobile keeps controlled current-view select", () => {
  const s = read("OptionsMarketPage");
  assert.match(s, /auryn-view-tabs/);
  assert.match(s, /aria-label="Market research view"[\s\S]*value=\{view\}/);
  assert.match(
    s,
    /className=\{layout.viewSwitch\}>\s*<div\s+className="auryn-view-tabs"/,
  );
  assert.match(
    read("OptionsMarketOverview"),
    /className="auryn-view-tabs" aria-label="Options universe"/,
  );
});
test("Screener inner dataset views and smaller selectors use explicit shared hierarchy", () => {
  for (const file of ["MarketMood", "GlobalEarningsCalendar"])
    assert.match(read(file), /className="auryn-view-tabs"/);
  for (const file of [
    "GlobalEarningsCalendar",
    "MarketInsiderActivity",
    "AlternativeIndexes",
    "ScreenerCatalog",
  ])
    assert.match(read(file), /auryn-detail-tabs/);
  assert.doesNotMatch(read("MarketMood"), /data-nested-navigation/);
});

test("standalone Discover calendar separates event views from date-window selectors", () => {
  const s = read("EodEventCalendar");
  assert.match(
    s,
    /className="auryn-view-tabs" aria-label="Corporate event filters"/,
  );
  assert.match(
    s,
    /className="auryn-detail-tabs"\s+aria-label="Corporate event window"/,
  );
});
