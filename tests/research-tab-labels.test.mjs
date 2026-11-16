import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("components/Research.tsx", "utf8");
const ast = ts.createSourceFile(
  "Research.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
function initializer(name) {
  for (const s of ast.statements)
    if (ts.isVariableStatement(s))
      for (const d of s.declarationList.declarations)
        if (d.name.getText(ast) === name) return d.initializer;
  throw new Error(name);
}
test("research labels distinguish company case, financial evidence and analyst opinion", () => {
  const presentation = initializer("tabPresentation");
  const labels = Object.fromEntries(
    presentation.properties.map((property) => [
      property.name.getText(ast),
      property.initializer.properties.find(
        (p) => p.name.getText(ast) === "label",
      ).initializer.text,
    ]),
  );
  assert.equal(labels.Thesis, "Investment case");
  assert.equal(labels.Financials, "Financials");
  assert.equal(labels.Analysts, "Analysts");
  assert.equal(labels.Valuation, "Valuation");
  assert.equal(labels.News, "News & earnings");
  assert.equal(new Set(Object.values(labels)).size, Object.keys(labels).length);
});
test("display renaming preserves route IDs, order, tab controls and content branches", () => {
  const declared = initializer("tabs");
  const array = ts.isAsExpression(declared) ? declared.expression : declared;
  assert.deepEqual(
    array.elements.map((x) => x.text),
    [
      "Snapshot",
      "Thesis",
      "Financials",
      "Valuation",
      "Technicals",
      "Analysts",
      "News",
      "Advanced",
      "Options",
    ],
  );
  for (const id of ["Thesis", "Financials", "Analysts"])
    assert.ok(source.includes(`tab === "${id}"`));
  assert.match(source, /onClick=\{\(\) => switchTab\(key\)\}/);
  assert.match(source, /aria-current=\{tab === key/);
  assert.match(source, /aria-label=\{tabPresentation\[tab\]\.label\}/);
  assert.match(source, /\{tabPresentation\[key\]\.label\}/);
});
