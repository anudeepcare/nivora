import test from "node:test";
import assert from "node:assert/strict";
import { createSentiSenseClient } from "../lib/sentisense-api.ts";
import { intelligenceData } from "../lib/intelligence-dto.ts";
const base = {
  ticker: "AAPL",
  status: "READY",
  reportType: "FULL",
  lastUpdated: 1794916800000,
  sectionOrder: ["Thesis", "Risks"],
  sections: {
    Thesis: { content: "Reported narrative", directives: { secret: "no" } },
    Risks: { content: "Risk narrative" },
  },
  moatRating: 8,
};
const read = async (body) =>
  createSentiSenseClient({
    key: "test",
    fetcher: async (url) => {
      assert.match(url, /\/stocks\/AAPL\/ai-summary\?depth=deep$/);
      return new Response(JSON.stringify(body));
    },
  })("AAPL", "aiReport");
test("deep report uses fixed endpoint, dated flat response and closed narrative DTO", async () => {
  const r = await read(base);
  assert.equal(r.status, "available");
  assert.equal(r.asOf, new Date(base.lastUpdated).toISOString());
  const d = intelligenceData("aiReport", r.data);
  assert.deepEqual(d.sections, [
    { title: "Thesis", text: "Reported narrative" },
    { title: "Risks", text: "Risk narrative" },
  ]);
  assert.equal(JSON.stringify(d).includes("directives"), false);
  assert.equal(JSON.stringify(d).includes("moatRating"), false);
});
test("deep report fails closed for draft, wrong ticker, summary and malformed sections", async () => {
  for (const body of [
    { ...base, status: "DRAFT" },
    { ...base, reportType: "SUMMARY" },
    { ...base, sections: { Thesis: { content: { unsafe: true } } } },
    { ...base, sectionOrder: ["Thesis", "Thesis"] },
    { ...base, lastUpdated: NaN },
  ]) {
    assert.notEqual((await read(body)).status, "available");
    assert.equal(intelligenceData("aiReport", body), null);
  }
});

test("report ticker mismatch is rejected", async () =>
  assert.equal(
    (await read({ ...base, ticker: "MSFT" })).status,
    "subject-mismatch",
  ));

test("reader shows one selected section safely, keeps timestamp and retries", async () => {
  const fs = await import("node:fs");
  const ts = (await import("typescript")).default;
  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const ast = ts.createSourceFile(
    "report.tsx",
    fs.readFileSync("components/SentiSenseReport.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const code = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export default /, ""))
      .join("\n"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  let selected = 0,
    response = {
      data: {
        status: "available",
        data: intelligenceData("aiReport", {
          ...base,
          sections: {
            ...base.sections,
            Thesis: { content: "<script>alert(1)</script>" },
          },
        }),
      },
    },
    requested;
  const bindings = {
    React,
    useState: () => [selected, (n) => (selected = n)],
    useResource: (key) => {
      requested = key;
      return response;
    },
    s: new Proxy({}, { get: (_, k) => k }),
  };
  const Component = new Function(
    ...Object.keys(bindings),
    code + ";return SentiSenseReport;",
  )(...Object.values(bindings));
  let html = renderToStaticMarkup(
    React.createElement(Component, { symbol: "AAPL" }),
  );
  assert.match(requested, /dataset=aiReport$/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /Risk narrative/);
  assert.match(html, /Report updated/);
  assert.match(html, /class="reportText"/);
  assert.match(html, /role="region"/);
  assert.match(html, /tabindex="0"/);
  const css = fs.readFileSync("components/SentiSensePanels.module.css", "utf8");
  assert.match(css, /\.reportText\s*\{[^}]*max-height:\s*min\(50dvh, 28rem\)/s);
  assert.match(css, /\.reportText\s*\{[^}]*overflow-y:\s*auto/s);
  selected = 1;
  html = renderToStaticMarkup(
    React.createElement(Component, { symbol: "AAPL" }),
  );
  assert.match(html, /Risk narrative/);
  assert.doesNotMatch(html, /alert\(1\)/);
  response = { error: "Unavailable", refresh: () => {} };
  html = renderToStaticMarkup(
    React.createElement(Component, { symbol: "AAPL" }),
  );
  assert.match(html, /Retry report/);
});
