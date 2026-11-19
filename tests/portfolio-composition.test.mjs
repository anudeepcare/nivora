import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
test("allocation shows scoped concentration and accessible on-demand sector context", () => {
  assert.match(source, /Top 3 concentration/);
  assert.match(source, /Share of priced investments/);
  assert.match(source, /model\.allocations\s*\.slice\(0, 3\)/);
  assert.match(source, /View sector exposure/);
  assert.equal((source.match(/Other holdings/g) ?? []).length, 1);
  assert.ok(
    source.indexOf("reference.history}") <
      source.indexOf("reference.capitalOverview}"),
  );
  assert.ok(
    source.indexOf("reference.capitalOverview}") <
      source.indexOf("portfolio-holdings-panel"),
  );
  assert.match(source, /aria-label="Sector and crypto exposure groups"/);
});
test("purchase and dated transaction workflows remain distinct", () => {
  assert.match(source, /Add purchase/);
  assert.match(source, /directRecord/);
  assert.match(source, /onAddPurchase=/);
  assert.match(source, /Cash &amp; balances/);
});

test("phone rows retain every field without duplicate controls", () => {
  const css = fs.readFileSync(
    "components/PortfolioComposition.module.css",
    "utf8",
  );
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/);
  assert.match(source, /data-label="Weight"/);
  assert.match(source, /data-label="Price"/);
  assert.match(source, /data-label="Market value"/);
  assert.match(source, /role="region"[\s\S]*tabIndex={0}/);
});

test("desktop market value and unrealized return are separate accessible columns", () => {
  assert.match(source, /<th>Market value<\/th>\s*<th>Unrealized return<\/th>/);
  assert.match(
    source,
    /<td data-label="Market value">\s*<strong>{amount\(row.value\)}<\/strong>\s*<\/td>\s*<td data-label="Unrealized return">/,
  );
});
