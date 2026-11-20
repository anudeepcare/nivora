import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("pricing uses an open public title and balanced, compact plan comparison", () => {
  const css = fs.readFileSync("components/Plans.module.css", "utf8");
  const publicRule =
    css.match(
      /\.page:global\(\.plans-public\) > :global\(\.plans-heading\)\s*\{([^}]+)\}/,
    )?.[1] ?? "";
  assert.match(publicRule, /background: transparent/);
  assert.match(publicRule, /border: 0/);
  assert.match(publicRule, /max-width: none/);
  assert.match(
    css,
    /\.page:global\(\.plans-public\) \.cards[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    css,
    /\.page:global\(\.plans-public\) \.cards[\s\S]*?min-height: 44px/,
  );
});
test("public checkout entry, price and actual feature source stay intact", () => {
  const ts = fs.readFileSync("components/Plans.tsx", "utf8");
  assert.match(ts, /\? "\$0" : "\$2\.99"/);
  assert.match(ts, /\/login\?mode=signup/);
  assert.match(ts, /\/login\?next=%2Fplans/);
  assert.match(ts, /included\(plan\)\.map/);
  assert.match(ts, /<SignedInPlans \/>/);
});
