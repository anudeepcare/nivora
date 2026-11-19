import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css = (n) => fs.readFileSync(`components/${n}.module.css`, "utf8");
test("Portfolio chart and allocation align as peers in the approved layout", () => {
  assert.match(
    css("PortfolioReference"),
    /\.grid\s*\{[^}]*align-items:\s*stretch/s,
  );
});
test("Today quarter evidence is bounded and responds to card width rather than viewport", () => {
  const s = css("HomeQuarterHighlights");
  assert.match(
    s,
    /grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 280px\), 440px\)\)/,
  );
  assert.match(s, /container:\s*quarter-highlight\s*\/\s*inline-size/);
  assert.match(s, /@container quarter-highlight \(max-width: 330px\)/);
  assert.match(s, /font-variant-numeric:\s*tabular-nums/);
  assert.match(s, /\.grid article > header > a\s*\{[^}]*min-width:\s*0/s);
  assert.match(s, /outline:\s*2px solid var\(--blue\)/);
});
test("Home date badges use theme-aware text, not fixed dark ink on dark accent", () => {
  const s = css("HomeWorkspace");
  assert.match(s, /--date-badge-ink:\s*var\(--ink\)/);
  assert.doesNotMatch(s, /color:\s*var\(--blue\);/);
  const lum = (h) => {
    const a = h
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };
  for (const [fg, bg] of [
    ["171c27", "eceeff"],
    ["eef2f8", "283957"],
  ]) {
    const a = lum(fg),
      b = lum(bg);
    assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) > 4.5);
  }
});

test("Holdings mover links have touch targets and preserve semantic colors", () => {
  const s = css("PortfolioDay");
  assert.match(s, /\.movers a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(s, /color:\s*var\(--tone\)/);
  assert.match(s, /outline:\s*2px solid var\(--blue\)/);
});
