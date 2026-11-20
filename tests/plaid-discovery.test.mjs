import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => fs.readFileSync(p, "utf8");
test("peripheral pages mount their scoped Plaid compositions without replacing live controls", () => {
  for (const [file, marker] of [
    ["Discover.tsx", "discovery"],
    ["WatchlistPage.tsx", "watchlist"],
    ["OptionsMarketPage.tsx", "market"],
    ["SupportingViews.tsx", "compare"],
  ]) {
    const src = read("components/" + file);
    assert.ok(
      src.includes("plaidDiscovery." + marker),
      file + " missing page composition",
    );
  }
  const market = read("components/OptionsMarketPage.tsx");
  for (const id of [
    "options",
    "stocks",
    "trackers",
    "mood",
    "indexes",
    "earnings",
    "insiders",
    "summary",
    "etfs",
  ])
    assert.ok(market.includes('value="' + id + '"'), id + " retained");
  assert.match(read("components/WatchlistPage.tsx"), /onClick=.*|onClick=\{/);
  assert.match(read("components/Discover.tsx"), /onSubmit=\{scan\}/);
});
test("discovery layouts provide responsive task surfaces and bounded accessible data, not palette alone", () => {
  const css = read("components/PlaidDiscovery.module.css");
  for (const rule of [
    "grid-template-columns",
    "max-height",
    "overflow: auto",
    ":focus-visible",
    "prefers-reduced-motion",
    "data-plaid-tone",
  ])
    assert.ok(css.includes(rule), rule);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /min-height: 44px/);
  assert.ok(!css.includes("display: none"));
});
