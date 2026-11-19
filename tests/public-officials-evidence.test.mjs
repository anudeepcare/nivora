import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { intelligenceView } from "../lib/sentisense-view.ts";
function render(a, b) {
  const m = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync("components/PublicOfficialsEvidence.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  new Function("require", "module", "exports", code)(
    (n) =>
      n === "react/jsx-runtime"
        ? jsx
        : n === "./Session"
          ? { useResource: (k) => (k.startsWith("intelligence") ? a : b) }
          : n === "@/lib/sentisense-view"
            ? { intelligenceView }
            : n === "./IntelligenceTable"
              ? {
                  default: ({ rows, title }) =>
                    React.createElement(
                      "div",
                      null,
                      title,
                      JSON.stringify(rows),
                    ),
                }
              : { default: {} },
    m,
    m.exports,
  );
  return renderToStaticMarkup(
    React.createElement(m.exports.default, { symbol: "ZETA" }),
  );
}
const empty = {
  loading: false,
  data: {
    status: "available",
    symbol: "ZETA",
    data: [],
    asOf: "2026-11-18",
    retrievedAt: "2026-11-18T12:00:00Z",
  },
  refresh: () => {},
};
const filings = {
  loading: false,
  data: { rows: [], asOf: "2026-11-18T12:00:00Z", truncated: false },
  refresh: () => {},
};
test("both empty sources produce one compact empty statement with separate dated coverage", () => {
  const html = render(empty, filings);
  assert.equal(
    (html.match(/No displayable disclosures returned/g) || []).length,
    1,
  );
  assert.match(html, /Source A/);
  assert.match(html, /Source B/);
  assert.match(html, /180 days/);
  assert.match(html, /2026-11-18/);
  assert.doesNotMatch(html, /No matching disclosures|No displayable records/);
});
test("error is not empty and successful other source rows remain visible", () => {
  const html = render(
    { ...empty, error: "unavailable" },
    {
      ...filings,
      data: {
        ...filings.data,
        rows: [
          {
            id: "1",
            member: "Member X",
            chamber: "house",
            action: "purchase",
            amountRange: "$1–$2",
            traded: "2026-11-01",
            disclosed: "2026-11-10",
            lagDays: 9,
            assetType: "stock",
            assetDescription: "Zeta",
            owner: "Self",
            filingUrl: "https://example.com/filing",
          },
        ],
      },
    },
  );
  assert.match(html, /Member X/);
  assert.match(html, /2026-11-10/);
  assert.match(html, /Source A unavailable/);
  assert.doesNotMatch(html, /No displayable disclosures returned/);
});
test("loading and preview never claim complete absence", () => {
  assert.match(
    render({ ...empty, loading: true }, filings),
    /Checking disclosure sources/,
  );
  assert.doesNotMatch(
    render({ ...empty, loading: true }, filings),
    /No displayable disclosures returned/,
  );
  assert.match(
    render(
      { ...empty, data: { ...empty.data, status: "preview", isPreview: true } },
      filings,
    ),
    /limited preview/,
  );
});

test("provider scope count remains distinct from displayed rows", () => {
  const html = render(
    { ...empty, data: { ...empty.data, totalCount: 37 } },
    filings,
  );
  assert.match(html, /37 provider records in scope/);
  assert.match(html, /displayed rows may be a subset/);
});
