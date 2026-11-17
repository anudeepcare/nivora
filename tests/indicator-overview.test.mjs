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
  assert.ok(
    research.indexOf("<IndicatorOverview") <
      research.indexOf("<AdvancedResearch"),
  );
  assert.match(
    research,
    /title: "Risk & research tools"/,
  );
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
  const mod = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "@/lib/indicator-overview") return logic;
      if (name === "@/lib/business-indicator-overview") return business;
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
  assert.doesNotMatch(render([]), /<svg/);
  assert.equal(
    (render([]).match(/Insufficient completed history/g) || []).length,
    6,
  );
});
