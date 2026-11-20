import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as format from "../lib/format.ts";

const checked = {
  kind: "economy",
  source: "EODHD",
  from: "2026-11-20",
  to: "2026-11-27",
  checkedAt: "2026-11-20T20:40:00Z",
  cacheMaxAgeSeconds: 1800,
  rows: [],
  truncated: false,
};
const row = (name, date) => ({
  name,
  date,
  reportedTime: "13:30:00",
  actual: 0,
  estimate: 885522,
  previous: 1,
  period: "Oct",
  comparison: "YoY",
});

function render({
  data = checked,
  error = "",
  loading = false,
  preview = false,
  access = { admitted: true, sampleOnly: false, features: { news: true } },
} = {}) {
  const calls = [];
  let refreshes = 0;
  const out = {};
  const code = ts.transpileModule(
    fs.readFileSync("components/TodayMacroWatch.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("require", "exports", code)(
    (name) =>
      name === "react/jsx-runtime"
        ? jsx
        : name === "./Access"
          ? { useAccess: () => ({ access }) }
          : name === "./Session"
            ? {
                useResource: (...args) => {
                  calls.push(args);
                  return { data, error, loading, refresh: () => ++refreshes };
                },
              }
            : name.includes("/format")
              ? format
              : name.endsWith(".css")
                ? { default: {} }
                : {},
    out,
  );
  const props = { today: "2026-11-20", preview };
  const html = renderToStaticMarkup(React.createElement(out.default, props));
  return {
    html,
    calls,
    element: out.default(props),
    get refreshes() {
      return refreshes;
    },
  };
}

test("macro watch selects two dated high-impact families by day and deduplicates variants without guessing units", () => {
  const { html, calls } = render({
    data: {
      ...checked,
      rows: [
        row("CPI MoM", "2026-11-23"),
        row("Core CPI YoY", "2026-11-23"),
        row("FOMC Interest Rate Decision", "2026-11-23"),
        row("Nonfarm Payrolls", "2026-11-24"),
        row("GDP Growth Rate QoQ", "2026-11-28"),
        row("MBA Mortgage Applications", "2026-11-20"),
        row("Fed Chair Powell Speech", "2026-11-20"),
        row("Consumer Price Index", "2026-11-19"),
      ],
    },
  });
  assert.deepEqual(calls[0], [
    "market-context?kind=economy",
    undefined,
    1800000,
  ]);
  assert.equal((html.match(/<li>/g) || []).length, 2);
  assert.ok(
    html.indexOf("Fed rate decision") <
      html.indexOf("Consumer inflation (CPI)"),
  );
  assert.match(html, /<time dateTime="2026-11-23"/i);
  assert.doesNotMatch(html, /885522|13:30:00|YoY|Powell|Mortgage|Nov 19/);
});

test("no dates returned is distinct from no major releases and from failed or partial coverage", () => {
  assert.match(render().html, /No major U.S. releases were returned/);
  assert.match(
    render({ data: { ...checked, truncated: true } }).html,
    /Coverage is limited/,
  );
  assert.match(
    render({ data: { ...checked, from: "2026-11-21" } }).html,
    /Coverage is limited/,
  );
  assert.match(
    render({ data: null, loading: true }).html,
    /Checking the U.S. calendar/,
  );
  const failed = render({ error: "Access error" });
  assert.match(failed.html, /Calendar unavailable/);
  assert.doesNotMatch(failed.html, /No major U.S. releases/);
  const retained = render({
    error: "Transient failure",
    data: { ...checked, rows: [row("Nonfarm Payrolls", "2026-11-23")] },
  });
  assert.match(retained.html, /Could not refresh/);
  assert.match(retained.html, /Employment report/);
  assert.match(retained.html, /Retry calendar/);
});

test("preview, unadmitted, sample-only, and disabled news never request the calendar", () => {
  for (const options of [
    { preview: true },
    {
      access: { admitted: false, sampleOnly: false, features: { news: true } },
    },
    { access: { admitted: true, sampleOnly: true, features: { news: true } } },
    {
      access: { admitted: true, sampleOnly: false, features: { news: false } },
    },
  ]) {
    const { html, calls } = render(options);
    assert.equal(html, "");
    assert.equal(calls[0]?.[0], null);
  }
});

test("the authentic UTC-next-day feed is not partial after UTC midnight while New York remains on Today", () => {
  const { html } = render({
    data: {
      ...checked,
      from: "2026-11-21",
      to: "2026-11-28",
      checkedAt: "2026-11-21T01:30:00Z",
      rows: [
        row("Core CPI", "2026-11-20"),
        row("Nonfarm Payrolls", "2026-11-28"),
      ],
    },
  });
  assert.match(html, /Nov 21, 2026 to Nov 28, 2026/);
  assert.match(html, /<time dateTime="2026-11-28">/i);
  assert.doesNotMatch(
    html,
    /Coverage is limited|Consumer inflation|Could not refresh/,
  );
  const genuinelyShort = render({
    data: {
      ...checked,
      from: "2026-11-21",
      to: "2026-11-27",
      checkedAt: "2026-11-21T01:30:00Z",
    },
  });
  assert.match(genuinelyShort.html, /Coverage is limited/);
});
