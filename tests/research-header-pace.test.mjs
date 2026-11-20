import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("components/Research.tsx", "utf8");
test("compact header uses actual current or completed Pace, never illustrative P2", () => {
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
    "workspacePaceStyles",
    "headerPace",
    "headerPaceProvisional",
    "headerPaceCarry",
    "p",
    "PACE_LEVELS",
    "paceCode",
    "Help",
    code,
  );
  const render = (reading, provisional = false, carry = false) =>
    renderToStaticMarkup(
      element(
        React,
        { paceStatus: "status", paceLevel: "level" },
        { palette: "palette" },
        reading,
        provisional,
        carry,
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
  assert.match(render({ multiplier: 2 }, false, true), /· P2†/);
  assert.match(
    render({ multiplier: 2 }, false, true),
    /Last completed month; current reading unavailable/,
  );
});

test("header never substitutes a stale forming zone for current conditions", async () => {
  const { currentPace } = await import("../lib/current-pace.ts");
  const declaration = source.match(
    /const headerPaceNow = [\s\S]+?(?=  const paceReading)/,
  );
  assert.ok(declaration, "evaluate the actual header selection");
  const select = new Function(
    "p",
    "demo",
    "r",
    "currentPace",
    declaration[0] +
      "return { headerPace, headerPaceProvisional, headerPaceCarry };",
  );
  const closing = { multiplier: 2, date: "2026-10-30", month: "2026-10" };
  const forming = { multiplier: 4, date: "2026-11-14", month: "2026-11" };
  const read = (retrievedAt, confirmed = closing) =>
    select({ dca: { forming, confirmed } }, true, { retrievedAt }, currentPace);
  assert.deepEqual(read("2026-11-15T20:00:00Z"), {
    headerPace: forming,
    headerPaceProvisional: true,
    headerPaceCarry: false,
  });
  assert.deepEqual(read("2026-11-20T20:00:00Z"), {
    headerPace: closing,
    headerPaceProvisional: false,
    headerPaceCarry: true,
  });
  assert.deepEqual(read("2026-11-20T20:00:00Z", null), {
    headerPace: null,
    headerPaceProvisional: false,
    headerPaceCarry: false,
  });
});

test("header inherits the workspace category palette and neutral missing state", () => {
  const css = fs.readFileSync(
    "components/ResearchHeaderPace.module.css",
    "utf8",
  );
  assert.match(source, /workspacePaceStyles\.palette/);
  assert.match(
    css,
    /background: var\(--workspace-pace-fill, var\(--surface-2\)\)/,
  );
  assert.match(css, /color: var\(--workspace-pace-ink, var\(--muted\)\)/);
  assert.doesNotMatch(css, /#e9e6fe|#5941d9|#30284d|#c7baff/);
});
