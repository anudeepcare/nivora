import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { buildMarketRadar } from "../lib/market-radar.ts";
import { researchLink } from "../lib/approved-workspace.ts";
import { renderToStaticMarkup } from "react-dom/server";
function render({
  error = "",
  snapshot = null,
  sampleOpen = false,
  research = [{ company: { symbol: "TEST" } }],
} = {}) {
  const cache = new Map();
  let hook = 0,
    charts = 0;
  const react = {
    ...React,
    useEffect: () => {},
    useState: (initial) => {
      hook++;
      return [
        hook === 1
          ? { key: "OTHER,TEST", cache, snapshot, error }
          : hook === 3
            ? sampleOpen
            : 0,
        () => {},
      ];
    },
  };
  const js = ts.transpileModule(
    fs.readFileSync("components/DailyMarketRadar.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const exports = {};
  new Function("require", "exports", "React", js)(
    (name) =>
      name === "react"
        ? react
        : name === "next/link"
          ? {
              default: ({ children, ...props }) =>
                React.createElement("a", props, children),
            }
          : name.endsWith("/approved-workspace")
            ? { researchLink }
            : name.endsWith("/market-radar")
              ? { buildMarketRadar }
              : name === "./Session"
                ? { useProduct: () => ({ cache }) }
                : name === "./MarketRadar"
                  ? {
                      MarketRadar: () => {
                        charts++;
                        return React.createElement("div", {
                          "data-chart": true,
                        });
                      },
                    }
                  : name.includes("provider-symbol")
                    ? { providerSymbol: (s) => s, providerIdentity: (s) => s }
                    : name.endsWith(".css")
                      ? { default: new Proxy({}, { get: (_, k) => k }) }
                      : {},
    exports,
    React,
  );
  const html = renderToStaticMarkup(
    React.createElement(exports.default, {
      research,
      sampleEvidence: React.createElement(
        "p",
        null,
        "Loaded business comparison",
      ),
      requested: ["TEST", "OTHER"],
      asOf: "2026-11-18",
    }),
  );
  return { html, charts };
}
test("missing migration is a compact exclusive error, never still checking or auto-rendering a one-stock radar", () => {
  const { html, charts } = render({
    error: "Daily radar requires its database migration.",
  });
  assert.match(html, /Daily radar setup required/);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /Checking today|role="status"/);
  assert.equal(charts, 0);
  assert.match(html, /1 of 2/);
});
test("loading, completed partial evidence, and paused progress have truthful distinct states", () => {
  assert.match(render().html, /Checking today/);
  const snapshot = {
    day: "2026-11-18",
    eligible: 2,
    ready: 1,
    pending: 1,
    excluded: 0,
    rows: [{ symbol: "TEST", status: "ready", history: [] }],
  };
  const loaded = render({ snapshot });
  assert.match(loaded.html, /1 histories shown/);
  assert.equal(loaded.charts, 1);
  const paused = render({ snapshot, error: "Provider paused" });
  assert.match(paused.html, /Refresh paused/);
  assert.doesNotMatch(paused.html, /Checking today/);
  assert.equal(paused.charts, 1);
});

test("bulk source outage remains visible even when cold account has no retained histories", () => {
  const { html } = render({
    snapshot: {
      day: "2026-11-18",
      mode: "bulk-opt-in",
      eligible: 500,
      ready: 0,
      pending: 500,
      excluded: 0,
      rows: [],
      sourceStatus: "unavailable",
      sourceRetryAt: "2026-11-18T13:00:00Z",
    },
  });
  assert.match(html, /Bulk source refresh paused/);
  assert.match(html, /500 pending/);
  assert.match(html, /2026-11-18T13:00:00Z/);
  assert.doesNotMatch(html, /Checking today/);
});
test("schema cache absence offers setup check without asserting missing configuration", () => {
  const { html } = render({
    error:
      "Daily radar database schema is unavailable. An administrator must check its migration and schema cache.",
  });
  assert.match(html, /Check setup again/);
  assert.match(html, /schema cache/);
  assert.doesNotMatch(
    html,
    /cache is not configured yet|requires its database migration/,
  );
});

test("opening a single locally loaded company offers research without sector averages or rotation", () => {
  const { html, charts } = render({
    sampleOpen: true,
    error: "Daily radar requires its database migration.",
  });
  assert.equal(charts, 0);
  assert.match(html, /At least two companies with eligible daily histories/);
  assert.match(html, /href="\/research\/TEST"/);
  assert.match(html, /Check setup again/);
});

test("loaded radar still shows scoped aggregates when two stock histories really qualify", () => {
  const end = Date.parse("2026-11-17");
  const history = Array.from(
    { length: 80 },
    (_, i) => new Date(end - i * 86400000),
  )
    .filter((date) => date.getUTCDay() > 0 && date.getUTCDay() < 6)
    .map((date) => ({
      time: date.toISOString().slice(0, 10),
      open: 100,
      high: 100,
      low: 100,
      close: 100,
    }));
  const research = ["TEST", "OTHER"].map((symbol) => ({
    company: { symbol, name: symbol, assetType: "stock", sector: "Technology" },
    history,
  }));
  const { html, charts } = render({ sampleOpen: true, research });
  assert.equal(charts, 1);
  assert.match(
    html,
    /not the daily holdings and watchlist snapshot or market-wide breadth/,
  );
  assert.match(html, /Loaded business comparison/);
});
