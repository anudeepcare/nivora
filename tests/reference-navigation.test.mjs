import test from "node:test";
import assert from "node:assert/strict";
import {
  desktopNavigation,
  mobileNavigation,
  researchLenses,
  lensForSection,
} from "../lib/reference-navigation.ts";
test("reference desktop and mobile navigation preserve actual routes", () => {
  assert.deepEqual(
    desktopNavigation.map((x) => x.label),
    ["Today", "Research", "Options", "Watchlist", "Portfolio"],
  );
  assert.deepEqual(
    mobileNavigation.map((x) => x.label),
    ["Today", "Research", "Options", "Watchlist", "Portfolio"],
  );
  assert.equal(desktopNavigation[0].path, "overview");
});
test("eight reference lenses preserve all existing evidence sections", () => {
  assert.deepEqual(
    researchLenses.map((x) => x.label),
    [
      "Atlas",
      "Scenarios",
      "Technicals",
      "Ownership",
      "Events",
      "Indicators",
      "Pace",
      "Options",
    ],
  );
  for (const section of [
    "Snapshot",
    "Thesis",
    "Financials",
    "Valuation",
    "Technicals",
    "Analysts",
    "News",
    "Advanced",
    "Options",
    "Pace",
  ])
    assert.ok(lensForSection(section), section);
  assert.equal(lensForSection("Analysts").label, "Atlas");
  assert.equal(lensForSection("Pace").label, "Pace");
  assert.equal(lensForSection("unknown"), undefined);
});

test("secondary research tools remain discoverable through account tools without a duplicate More menu", async () => {
  const fs = await import("node:fs");
  const s = fs.readFileSync("components/Shell.tsx", "utf8");
  assert.doesNotMatch(s, /More research and workspace tools|experience\.moreTrigger/);
  assert.match(s, /More tools and account/);
  for (const path of ["discover", "compare"])
    assert.ok(s.includes('path: "' + path + '"'));
  assert.match(s, /aria-haspopup="dialog"/);
});

test("market options has its own lazy route without removing ticker options", async () => {
  const fs = await import("node:fs");
  const product = fs.readFileSync("components/Product.tsx", "utf8");
  const page = fs.readFileSync("components/OptionsMarketPage.tsx", "utf8");
  const shell = fs.readFileSync("components/Shell.tsx", "utf8");
  assert.match(product, /page === "options"/);
  assert.match(product, /import\("\.\/OptionsMarketPage"\)/);
  assert.match(page, /<OptionsMarketOverview \/>/);
  assert.match(page, /not included in this design\s+preview/);
  assert.match(shell, /mobileNavigation.some/);
  assert.equal(lensForSection("Options").label, "Options");
});
