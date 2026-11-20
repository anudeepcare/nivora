import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import postcss from "postcss";
const path = "components/WorkspacePace.tsx";
const ast = ts.createSourceFile(
  path,
  readFileSync(path, "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const node = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name.text === "PaceBadge",
);
const js = ts.transpileModule(node.getText(ast).replace("export ", ""), {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
}).outputText;
const Badge = new Function("React", "s", "dateLabel", js + ";return PaceBadge")(
  React,
  { badge: "badge", palette: "palette" },
  (date) => date,
);
const badge = (signal) =>
  renderToStaticMarkup(React.createElement(Badge, { signal }));
test("badge coloring follows the visible Pace code even when purchase is blocked or confirmed differs", () => {
  for (let level = 0; level < 5; level++) {
    const html = badge({
      view: {
        code: `P${level}`,
        actionLabel: "Wait before buying",
        permitted: false,
      },
      periods: [
        { key: "confirmed", level: (level + 1) % 5, date: "2026-11-01" },
      ],
    });
    assert.match(html, new RegExp(`data-pace-level="${level}"`));
    assert.match(html, /badge palette/);
    assert.match(html, /Wait before buying/);
    assert.match(html, /Confirmed 2026-11-01/);
  }
  for (const signal of [
    null,
    { view: { code: "Pending", actionLabel: "Review" }, periods: [] },
  ]) {
    assert.doesNotMatch(badge(signal), /data-pace-level/);
  }
});
const rules = postcss.parse(
  readFileSync("components/WorkspacePace.module.css", "utf8"),
);
const lum = (hex) =>
  hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
test("shared palette keeps all five category fills readable in light and dark", () => {
  for (const prefix of ["", ':global(html[data-theme="dark"]) ']) {
    for (let level = 0; level < 5; level++) {
      const selector = `${prefix}.palette[data-pace-level="${level}"]`;
      const rule = rules.nodes.find((r) => r.selector === selector);
      assert.ok(rule, selector);
      const [bg, fg] = ["--workspace-pace-fill", "--workspace-pace-ink"].map(
        (p) => rule.nodes.find((d) => d.prop === p)?.value,
      );
      assert.match(bg, /^#[a-f0-9]{6}$/i);
      assert.match(fg, /^#[a-f0-9]{6}$/i);
      const a = lum(bg),
        b = lum(fg);
      assert.ok(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
        selector,
      );
    }
  }
});
