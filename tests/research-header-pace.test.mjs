import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("components/Research.tsx", "utf8");
test("compact header uses actual current or completed Pace, never illustrative P2", () => {
  assert.match(source, /headerPace = p\?\.dca.forming \?\? p\?\.dca.confirmed/);
  assert.match(source, /paceCode\(headerPace.multiplier\)/);
  assert.match(source, /PACE_LEVELS\[headerPace.multiplier\]/);
  assert.match(source, /Pace unavailable/);
  assert.match(source, /Provisional current-month reading/);
  assert.match(source, /headerPaceProvisional \? "\*" : ""/);
  assert.match(source, /Current month · provisional/);
  assert.match(source, /Completed month/);
  assert.match(source, /Help label="this Pace reading"/);
});
test("inner rails have isolated styling hooks, preserving selection keyboard handling", () => {
  assert.match(
    source,
    /cockpit.supporting} auryn-view-tabs research-compact-tabs/,
  );

  assert.match(source, /onKeyDown={\(event\) => navigateSelection\(event\)}/);
});

test("header renders status-first Pace, showing actual level and provisional state", async () => {
  const { default: ts } = await import("typescript");
  const { default: React } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { paceCode, PACE_LEVELS } = await import("../lib/pace-presentation.ts");
  const ast = ts.createSourceFile(
    "Research.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let pace;
  function visit(node) {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.getText(ast).includes("data-pace-level=")
    )
      pace = node.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(pace);
  const code = ts.transpileModule("return " + pace, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const element = new Function(
    "React",
    "headerPaceStyles",
    "headerPace",
    "headerPaceProvisional",
    "p",
    "PACE_LEVELS",
    "paceCode",
    "Help",
    code,
  );
  const render = (reading, provisional = false) =>
    renderToStaticMarkup(
      element(
        React,
        { paceStatus: "status", paceLevel: "level" },
        reading,
        provisional,
        { dca: {} },
        PACE_LEVELS,
        paceCode,
        ({ label }) => React.createElement("button", { "aria-label": label }),
      ),
    );
  assert.match(
    render({ multiplier: 1 }, true),
    /data-pace-level="1".*class="status">Watch<.*class="level">· P1\*<.*Provisional current-month reading.*aria-label="this Pace reading"/,
  );
  for (const multiplier of [0, 2, 3, 4]) {
    const rendered = render({ multiplier });
    assert.ok(rendered.includes(`class="status">${PACE_LEVELS[multiplier]}`));
    assert.ok(rendered.includes(`class="level">· P${multiplier}</span>`));
    assert.doesNotMatch(rendered, /Provisional|\*/);
  }
  assert.match(
    render(undefined),
    /data-pace-level="unavailable".*Pace unavailable/,
  );
  assert.doesNotMatch(render(undefined), /class="level"/);
});
