import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
export function tileComponent() {
  const m = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    "React",
    ts.transpileModule(
      fs.readFileSync("components/TrackerPriceTiles.tsx", "utf8"),
      {
        compilerOptions: {
          jsx: ts.JsxEmit.React,
          module: ts.ModuleKind.CommonJS,
        },
      },
    ).outputText,
  )(
    () => ({ default: new Proxy({}, { get: (_, k) => String(k) }) }),
    m,
    m.exports,
    React,
  );
  return m.exports.default;
}
test("price tiles retain signed readings, genuine zero, missingness and individual dates", () => {
  const C = tileComponent();
  const rows = [2, -1, 0, null].map((value, i) => ({
    id: String(i),
    name: `Company${i}`,
    category: null,
    metrics: [
      {
        label: "Price change",
        unit: "percent",
        value,
        asOf: i === 3 ? null : "2026-11-18T14:00:00Z",
      },
      { label: "Delayed price", unit: "usd", value: 10, asOf: null },
    ],
  }));
  const html = renderToStaticMarkup(React.createElement(C, { rows }));
  assert.match(html, /data-tone="positive"/);
  assert.match(html, /data-tone="negative"/);
  assert.match(html, /data-tone="flat"/);
  assert.match(html, /data-tone="missing"/);
  assert.match(html, /\+2%/);
  assert.match(html, /-1%/);
  assert.match(html, /0%/);
  assert.match(html, /2026-11-18T14:00:00Z/);
  assert.match(html, /Time not supplied/);
  assert.match(html, /Equal-sized tiles/);
  assert.match(html, /not market-cap weights/);
});
