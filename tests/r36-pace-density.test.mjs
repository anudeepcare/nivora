import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("components/AccumulationDesk.tsx", "utf8");
const css = readFileSync("components/PaceDeskDetails.module.css", "utf8");

test("Pace separates each observed price label, value and date without changing provenance", () => {
  assert.match(source, /<dl aria-label="Price observation basis">/);
  assert.match(
    source,
    /<dt>Settled chart close<\/dt>\s*<dd>\s*<strong>\s*\{amount\(monthly\.at\(-1\)\?\.close, r\.quote\.currency\)\}\s*<\/strong>\s*<small>\{dateLabel\(monthly\.at\(-1\)\?\.time\)\}<\/small>/,
  );
  assert.match(
    source,
    /<dt>Latest quoted price<\/dt>\s*<dd>\s*<strong>\s*\{amount\(r\.quote\.price, r\.quote\.currency\)\}\s*<\/strong>\s*<small>[\s\S]*?r\.quote\.asOf[\s\S]*?Observation time not supplied[\s\S]*?r\.quote\.stale/,
  );
  assert.match(css, /\.observations\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.priceBasis dl\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
});

test("Pace anchors the complete stage legend directly to its locally bounded price chart", () => {
  const chart = source.slice(
    source.indexOf('<figure className="accumulation-chart"'),
    source.indexOf("{!!levels.length"),
  );
  assert.match(chart, /<figure className="accumulation-chart">/);
  assert.match(chart, /<figcaption className=\{detail\.chartHeading\}>/);
  assert.match(
    chart,
    /<PriceChart[\s\S]*?bars=\{monthly\}[\s\S]*?candleColors=\{candleColors\}[\s\S]*?levels=\{levels\}/,
  );
  assert.match(
    chart,
    /aria-label="Chart zone legend"[\s\S]*?\[0, 1, 2, 3, 4\][\s\S]*?Price-extension review[\s\S]*?No eligible signal[\s\S]*?<\/figure>/,
  );
  assert.match(
    css,
    /\.desk\.desk[^{}]*:global\(\.price-chart\)\s*\{[^}]*height: clamp\([^)]*\)[^}]*min-height: 0/s,
  );
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*?:global\(\.price-chart\)\s*\{[^}]*height: clamp\(/,
  );
});

test("optional Pace business chart opens on demand without hiding the main price chart or monthly evidence", () => {
  const nativeEvidence = source.match(
    /<details[\s\S]*?<summary>Business evidence<\/summary>[\s\S]*?{evidenceOpened && <PaceEvidenceJourney research=\{r\} \/>}[\s\S]*?<\/details>/,
  )?.[0];
  assert.ok(nativeEvidence);
  assert.match(nativeEvidence, /event.currentTarget.open/);
  assert.match(source, /r.company.assetType === "stock"/);
  assert.match(source, /<PaceMonthHistory key=\{r.company.symbol\}/);
  assert.match(source, /<PaceHistoryInsights research=\{r\}/);
  assert.ok(
    source.indexOf("<PriceChart") <
      source.indexOf("<summary>Business evidence"),
  );
  assert.doesNotMatch(css, /overflow(?:-y)?: (?:auto|scroll)/);
});
