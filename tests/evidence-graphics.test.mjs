import test from "node:test";
import assert from "node:assert/strict";
import {
  seriesGeometry,
  overviewValueMessage,
} from "../lib/evidence-graphics.ts";
test("signed bar geometry uses a true zero baseline without inventing missing observations", () => {
  const g = seriesGeometry(
    [
      { label: "2022", value: -20 },
      { label: "2023", value: null },
      { label: "2024", value: 40 },
    ],
    "bar",
  );
  assert.equal(g.points.length, 2);
  assert.ok(g.points[0].y > g.zero);
  assert.ok(g.points[1].y < g.zero);
  assert.equal(g.points[0].label, "2022");
});
test("single observations and flat lines never produce NaN or invented extra samples", () => {
  for (const rows of [
    [{ label: "2024", value: 0 }],
    [
      { label: "2023", value: 5 },
      { label: "2024", value: 5 },
    ],
  ]) {
    const g = seriesGeometry(rows, "line");
    assert.equal(g.points.length, rows.length);
    assert.ok(
      g.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    );
  }
  assert.equal(seriesGeometry([{ label: "x", value: NaN }], "line"), null);
});
test("an unestablished optimistic sensitivity cannot become a headline upside", () => {
  assert.equal(
    overviewValueMessage("unestablished", 191.7),
    "Assumptions need review",
  );
  assert.equal(
    overviewValueMessage("supported", 25),
    "Conditional price cushion",
  );
  assert.equal(
    overviewValueMessage("demanding", -10),
    "Price asks more of the business",
  );
});
test("SVG series titles are one text node so server markup hydrates without changing the graph", async () => {
  const { default: fs } = await import("node:fs");
  const { default: ts } = await import("typescript");
  const React = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const format = await import("../lib/format.ts");
  const source = fs.readFileSync("components/EvidenceGraphics.tsx", "utf8"),
    ast = ts.createSourceFile(
      "EvidenceGraphics.tsx",
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
    fn = ast.statements.find(
      (n) => ts.isFunctionDeclaration(n) && n.name?.text === "EvidenceSeries",
    );
  const code = ts.transpileModule(fn.getText(ast).replace("export ", ""), {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const C = new Function(
    "React",
    "seriesGeometry",
    "amount",
    "percent",
    code + ";return EvidenceSeries;",
  )(React, seriesGeometry, format.amount, format.percent);
  const html = renderToStaticMarkup(
    React.createElement(C, {
      points: [{ label: "2022", value: 20 }],
      label: "Revenue",
    }),
  );
  assert.match(html, /<title>2022: \$20<\/title>/);
});
