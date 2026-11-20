import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { paceCode } from "../lib/pace-presentation.ts";
import postcss from "postcss";
const source = fs.readFileSync("components/Research.tsx", "utf8");
test("mobile Pace displays only real code or missing dash, never sample or status text", () => {
  const ast = ts.createSourceFile("x.tsx", source, 99, true, ts.ScriptKind.TSX);
  let node;
  function walk(n) {
    if (
      ts.isJsxElement(n) &&
      n.openingElement.getText(ast).includes("headerPaceStyles.mobileCode")
    )
      node = n;
    ts.forEachChild(n, walk);
  }
  walk(ast);
  assert.ok(node, "mobile-only code exists");
  const js = ts.transpileModule("return " + node.getText(ast), {
    compilerOptions: { jsx: ts.JsxEmit.React },
  }).outputText;
  const render = new Function(
    "React",
    "headerPaceStyles",
    "headerPace",
    "paceCode",
    "headerPaceProvisional",
    "headerPaceCarry",
    js,
  );
  for (const level of [0, 1, 2, 3, 4])
    assert.equal(
      renderToStaticMarkup(
        render(React, { mobileCode: "code" }, { multiplier: level }, paceCode),
      ),
      `<span class="code">P${level}</span>`,
    );
  assert.equal(
    renderToStaticMarkup(render(React, { mobileCode: "code" }, null, paceCode)),
    '<span class="code">—</span>',
  );
  for (const [provisional, carry, marker] of [
    [true, false, "*"],
    [false, true, "†"],
  ]) {
    assert.equal(
      renderToStaticMarkup(
        render(
          React,
          { mobileCode: "code" },
          { multiplier: 4 },
          paceCode,
          provisional,
          carry,
        ),
      ),
      `<span class="code">P4<sup aria-hidden="true">${marker}</sup></span>`,
    );
  }
  assert.match(source, /Help label="this Pace reading"/);
  assert.match(source, /Provisional current-month reading/);
});
test("approved mobile hero has enlarged identity, grid quote and separated category-colored code without changing desktop", () => {
  const css = postcss.parse(
    fs.readFileSync("components/ResearchHeaderPace.module.css", "utf8"),
  );
  const val = (selector, prop) => {
    let v;
    css.walkRules((r) => {
      if (
        r.parent.type === "atrule" &&
        r.parent.params === "(max-width: 700px)" &&
        r.selector.replace(/\s+/g, " ") === selector.replace(/\s+/g, " ")
      )
        r.walkDecls(prop, (d) => (v = d.value));
    });
    return v;
  };
  assert.equal(
    val(".header.header .identity.identity h1", "font-size"),
    "clamp(22px, 6.9vw, 28px)",
  );
  assert.equal(
    val(".header.header .quote.quote", "grid-template-areas"),
    '"metrics pace" "stamp pace"',
  );
  assert.equal(
    val(".header.header .paceMobile", "border-left"),
    "1px solid var(--line)",
  );
  assert.equal(
    val(
      ".paceMobile .paceText,\n.paceMobile .paceDot,\n.paceMobile .paceUnavailable",
      "display",
    ),
    "none",
  );
});

test("narrow mobile quote wraps within its track and listing stays readable", () => {
  const css = postcss.parse(
    fs.readFileSync("components/ResearchHeaderPace.module.css", "utf8"),
  );
  const values = (selector) => {
    const result = {};
    css.walkRules((r) => {
      if (
        r.parent.type === "atrule" &&
        r.parent.params === "(max-width: 700px)" &&
        r.selector === selector
      )
        r.walkDecls((d) => (result[d.prop] = d.value));
    });
    return result;
  };
  assert.equal(values(".header.header .priceMetrics")["flex-wrap"], "wrap");
  assert.equal(values(".header.header .priceMetrics")["min-width"], "0");
  assert.equal(
    values(".header.header .priceMetrics > strong")["overflow-wrap"],
    "anywhere",
  );
  assert.equal(
    values(".header.header .quote.quote")["grid-template-columns"],
    "minmax(0, 1fr) auto",
  );
  assert.equal(
    values(".header.header .identity.identity > div > div")["font-size"],
    "14px",
  );
});
