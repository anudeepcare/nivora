import * as infoDisclosure from "../lib/info-disclosure.ts";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { advancedStudies } from "../lib/advanced-research.ts";
const bars = Array.from({ length: 100 }, (_, i) => ({
  time: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10),
  open: 100 + i,
  high: 102 + i,
  low: 99 + i,
  close: 101 + i,
  volume: 1000 + i,
}));
test("indicator histories preserve dated real observations and agree with existing calculations", async () => {
  const { indicatorOverview } = await import("../lib/indicator-overview.ts");
  const result = indicatorOverview(bars, "2025-05-01");
  assert.equal(result.length, 6);
  for (const row of result) {
    assert.equal(row.points.length, 60);
    assert.equal(row.points.at(-1).date, bars.at(-1).time);
    assert.equal(
      row.points.at(-1).value,
      advancedStudies(bars, "2025-05-01")[row.key],
    );
  }
});
test("indicator histories exclude forming and future bars and retain missing values", async () => {
  const { indicatorOverview } = await import("../lib/indicator-overview.ts");
  const input = [
    ...bars,
    { ...bars[0], time: "2025-05-01", close: 999, high: 1000 },
  ];
  assert.deepEqual(
    indicatorOverview(input, "2025-05-01"),
    indicatorOverview(bars, "2025-05-01"),
  );
  const sparse = indicatorOverview(bars.slice(0, 10), "2025-05-01");
  assert.ok(
    sparse.every((row) => row.points.every((point) => point.value === null)),
  );
  assert.ok(
    indicatorOverview([], "2025-05-01").every((row) => row.points.length === 0),
  );
});
test("Pace chart precedes long interpretation and Indicators opens chart overview before tools", () => {
  const pace = fs.readFileSync("components/AccumulationDesk.tsx", "utf8");
  assert.ok(
    pace.indexOf("<PriceChart") <
      pace.indexOf('className="accumulation-summary"'),
  );
  const research = fs.readFileSync("components/Research.tsx", "utf8");
  assert.match(research, /<IndicatorsLens/);
  const lenses = fs.readFileSync("components/DirectResearchLenses.tsx", "utf8");
  const indicators = lenses.slice(
    lenses.indexOf("export function IndicatorsLens"),
  );
  assert.ok(indicators.indexOf("<IndicatorOverview") >= 0);
  assert.ok(
    indicators.indexOf("<IndicatorOverview") <
      indicators.indexOf("<AdvancedResearch"),
  );
  assert.doesNotMatch(indicators, /MoreEvidence|<details/);
});
test("indicator cards render six real charts, dated tables and no invented empty-history chart", async () => {
  const React = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const ts = (await import("typescript")).default;
  const jsx = await import("react/jsx-runtime");
  const logic = await import("../lib/indicator-overview.ts");
  const business = await import("../lib/business-indicator-overview.ts");
  const format = await import("../lib/format.ts");
  const source = ts.transpileModule(
    fs.readFileSync("components/IndicatorOverview.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  let projectedBusiness = null;
  const mod = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => {
      if (name === "@/lib/info-disclosure") return infoDisclosure;
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "@/lib/indicator-overview") return logic;
      if (name === "@/lib/business-indicator-overview")
        return {
          ...business,
          businessIndicatorOverview: (research) =>
            projectedBusiness ?? business.businessIndicatorOverview(research),
        };
      if (name === "@/lib/format") return format;
      if (name.endsWith(".module.css"))
        return {
          __esModule: true,
          default: new Proxy({}, { get: (_, key) => String(key) }),
        };
      throw Error(name);
    },
    mod,
    mod.exports,
  );
  const render = (history) =>
    renderToStaticMarkup(
      React.createElement(mod.exports.default, {
        research: { history, retrievedAt: "2025-05-01" },
      }),
    );
  const html = render(bars);
  assert.equal((html.match(/<article/g) || []).length, 6);
  assert.equal((html.match(/<svg/g) || []).length, 6);
  assert.equal((html.match(/role="region"/g) || []).length, 6);
  assert.match(html, /About 20-session momentum/);
  assert.match(html, /Apr 10/);
  const latestDates = [
    ...html.matchAll(/<small class="basis">([\s\S]*?)<\/small>/g),
  ];
  assert.equal(latestDates.length, 6);
  for (const [, basis] of latestDates) {
    assert.match(basis, /Completed session/);
    assert.match(basis, /<time dateTime="2025-04-10">/);
    assert.doesNotMatch(basis, /2025-05-01/);
  }
  const emptyHtml = render([]);
  assert.equal(
    (emptyHtml.match(/No completed daily prices were supplied/g) || []).length,
    1,
  );
  assert.match(emptyHtml, /6 unavailable daily-price metrics/);
  assert.match(emptyHtml, /20-session momentum/);
  assert.doesNotMatch(
    emptyHtml,
    /<article|<time|<table|<svg|History needed|Insufficient completed history/,
  );
  const sparseHtml = render(bars.slice(0, 10));
  assert.equal(
    (sparseHtml.match(/Completed daily prices were supplied/g) || []).length,
    1,
  );
  assert.match(sparseHtml, /6 unavailable daily-price metrics/);
  assert.match(sparseHtml, /Jan 10/);
  assert.doesNotMatch(
    sparseHtml,
    /<article|<svg|Insufficient completed history/,
  );
  const mixedHtml = render(bars.slice(0, 25));
  assert.ok((mixedHtml.match(/<article/g) || []).length > 0);
  assert.ok((mixedHtml.match(/<article/g) || []).length < 6);
  assert.match(mixedHtml, /unavailable daily-price metrics/);
  assert.match(mixedHtml, /<svg/);
  assert.match(mixedHtml, /Completed session/);
  projectedBusiness = business.businessIndicatorPeriods([
    {
      end: "2023-12-31",
      currency: "USD",
      basis: "annual",
      revenue: 100,
      operatingIncome: 20,
      fcf: 10,
      weightedShares: 10,
    },
    {
      end: "2024-12-31",
      currency: "USD",
      basis: "annual",
      revenue: 120,
      operatingIncome: 24,
      fcf: 12,
      weightedShares: 11,
      filed: "2025-02-10",
    },
  ]);
  const annualHtml = render([]);
  const annualDates = [
    ...annualHtml.matchAll(/<small class="basis">([\s\S]*?)<\/small>/g),
  ].slice(0, 4);
  assert.equal(annualDates.length, 4);
  for (const [, basis] of annualDates) {
    assert.match(basis, /Period ended/);
    assert.match(basis, /<time dateTime="2024-12-31">/);
    assert.doesNotMatch(basis, /2025-02-10|2025-05-01/);
  }
  assert.equal((annualHtml.match(/<article/g) || []).length, 4);
  assert.match(annualHtml, /6 unavailable daily-price metrics/);
  assert.doesNotMatch(annualHtml, /unavailable annual-report metrics/);
  projectedBusiness = business.businessIndicatorPeriods([
    { end: "2024-12-31", currency: "USD", basis: "annual", revenue: 100 },
  ]);
  const separateSources = render([]);
  assert.match(separateSources, /4 unavailable annual-report metrics/);
  assert.match(separateSources, /Reported annual periods were supplied/);
  assert.match(separateSources, /Period ended/);
  assert.match(separateSources, /<time dateTime="2024-12-31">/);
  assert.match(separateSources, /No completed daily prices were supplied/);
  assert.doesNotMatch(separateSources, /<article|<svg/);
  projectedBusiness = business.businessIndicatorPeriods([]);
  assert.match(render([]), /No reported annual periods were supplied/);
  projectedBusiness = business.businessIndicatorPeriods([
    {
      end: "2023-12-31",
      currency: "USD",
      basis: "annual",
      revenue: 100,
      operatingIncome: 0,
    },
    { end: "2024-12-31", currency: "USD", basis: "annual", revenue: 110 },
  ]);
  const mixedAnnual = render([]);
  const operatingMargin = [
    ...mixedAnnual.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/g),
  ]
    .map(([, content]) => content)
    .find((content) => content.includes("Operating margin"));
  assert.ok(operatingMargin);
  assert.match(operatingMargin, /Latest value unavailable/);
  assert.match(operatingMargin, /<time dateTime="2024-12-31">/);
  assert.match(operatingMargin, /0\.00%/);
  assert.doesNotMatch(operatingMargin, /<svg/);
});
