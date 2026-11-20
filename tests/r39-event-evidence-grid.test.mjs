import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (file) =>
  readFileSync(new URL("../components/" + file, import.meta.url), "utf8");

test("company updates put related evidence in one peer-level grid", () => {
  const lens = read("CompanyUpdates.tsx");
  const coverage = read("ResearchEvidence.tsx");
  assert.match(lens, /<NewsAndFilings[^>]*additionalEvidence=/s);
  assert.doesNotMatch(lens, /news-context-column/);
  assert.match(coverage, /\{additionalEvidence\}/);
  assert.match(lens, /About reported activity/);
});

test("events reserve a wide rail for earnings and don't nest card grids", () => {
  const css = read("DirectResearchLenses.module.css");
  assert.match(
    css,
    /\.eventsSupporting(?:\s*,\s*\.indicatorSupporting)?\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/,
  );
  assert.doesNotMatch(
    css,
    /\.eventsSupporting(?:\s*,\s*\.indicatorSupporting)?\s*\{[^}]*repeat\(2/,
  );
  assert.match(
    css,
    /evidence-with-activity[^{}]*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    css,
    /@media \(max-width: 850px\)[\s\S]*?evidence-with-activity[^{}]*\{[^}]*minmax\(0, 1fr\)/,
  );
});

test("coverage and activity coexist without dropping supplied zero or dates", async () => {
  const React = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const ts = (await import("typescript")).default;
  const extract = (file, name) => {
    const parsed = ts.createSourceFile(
      file,
      read(file),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const fn = parsed.statements.find(
      (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
    );
    return ts.transpileModule(
      fn.getText(parsed).replace(/^export (default )?/, ""),
      {
        compilerOptions: {
          jsx: ts.JsxEmit.React,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText;
  };
  const Coverage = new Function(
    "React",
    "useProduct",
    "useMemo",
    "useResource",
    "FileText",
    extract("ResearchEvidence.tsx", "NewsAndFilings") +
      ";return NewsAndFilings;",
  )(
    React,
    () => ({}),
    React.useMemo,
    () => ({}),
    () => null,
  );
  const Updates = new Function(
    "React",
    "NewsAndFilings",
    "dateLabel",
    extract("CompanyUpdates.tsx", "CompanyUpdates") + ";return CompanyUpdates;",
  )(React, Coverage, (d) => d);
  const html = renderToStaticMarkup(
    React.createElement(Updates, {
      research: {
        company: { symbol: "QA", assetType: "stock" },
        retrievedAt: "2026-11-20T12:00:00Z",
        evidence: {
          earnings: [{ date: "2026-11-28", estimate: 0 }],
          insiders: [
            {
              name: "Fixture person",
              date: "2026-11-19",
              code: "P",
              change: 0,
            },
          ],
        },
      },
    }),
  );
  assert.match(
    html,
    /evidence-with-activity.*Recent coverage.*Source filings.*Reported activity.*2026-11-28.*EPS estimate 0\.00.*Fixture person.*0 shares/s,
  );
  assert.equal((html.match(/Reported activity/g) || []).length, 1);
});

test("horizontal earnings tables are labelled keyboard scroll regions", () => {
  const earnings = read("EarningsWorkspace.tsx");
  const regions = [
    ...earnings.matchAll(
      /<div\s+className="table-scroll"\s+tabIndex=\{0\}\s+role="region"\s+aria-label="([^"]+)"/g,
    ),
  ];
  assert.deepEqual(
    regions.map((m) => m[1]),
    ["EPS results and surprise", "Future earnings estimates"],
  );
});
