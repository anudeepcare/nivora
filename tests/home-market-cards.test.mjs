import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("components/HomeMarketCards.tsx", "utf8");
const ast = ts.createSourceFile(
  "HomeMarketCards.tsx",
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const declaration = ast.statements.find(
  (n) => ts.isFunctionDeclaration(n) && n.name?.text === "usableHistory",
);
const code = ts.transpileModule(declaration.getText(ast), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const valid = new Function("DAY", code + ";return usableHistory;")(86400000);
const now = Date.parse("2026-11-05T16:00:00Z");
const row = (time, close = 100) => ({ time, close });
test("Home price areas use settled dated observations and never create a decorative trend from stale or invalid data", () => {
  assert.deepEqual(
    valid([row("2026-11-03"), row("2026-11-04"), row("2026-11-05")], now).map(
      (p) => p.time,
    ),
    ["2026-11-03", "2026-11-04"],
  );
  for (const points of [
    [row("2026-10-01"), row("2026-10-02")],
    [row("2026-11-04"), row("2026-11-06")],
    [row("bad"), row("2026-11-04")],
    [row("2026-11-03", 0), row("2026-11-04")],
  ])
    assert.deepEqual(valid(points, now), []);
  assert.deepEqual(
    valid([row("2026-11-04"), row("2026-11-05")], now).map((x) => x.time),
    [],
  );
});

test("quoted change uses neutral zero and never colors missing values as gains", () => {
  const node = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "quoteDirection",
  );
  assert.ok(node, "quote direction classifier exists");
  const js = ts.transpileModule(node.getText(ast), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const direction = new Function(js + ";return quoteDirection;")();
  assert.equal(direction(0), "flat");
  assert.equal(direction(-1), "down");
  assert.equal(direction(1), "up");
  assert.equal(direction(null), "flat");
  assert.equal(direction(NaN), "flat");
});

test("price card layout targets real quote markup and keeps factual color with readable phone labels", () => {
  const css = fs.readFileSync("components/HomeMarketCards.module.css", "utf8");
  assert.doesNotMatch(css, /\.price\s*\{/);
  assert.match(css, /minmax\(min\(100%, 240px\), 1fr\)/);
  assert.match(
    css,
    /\.changeValue\[data-direction="flat"\][\s\S]*?color: var\(--muted\)/,
  );
  assert.match(
    css,
    /\.changeValue\[data-direction="down"\][\s\S]*?color: var\(--red\)/,
  );
  assert.match(css, /@media \(max-width: 540px\)/);
  assert.match(css, /\.card \.historyLabel\s*\{[\s\S]*?font-size: 11px/);
  assert.doesNotMatch(
    css,
    /border-top[^;]*var\(--(?:green|red|blue|company-accent)\)/,
  );
});

test("Home stale-price refresh is a visible44px action without hiding data caveats", () => {
  const css = fs.readFileSync("components/HomeWorkspace.module.css", "utf8");
  assert.match(css, /\.approved-data-note\) button\s*\{[^}]*min-height: 44px/s);
  assert.match(
    css,
    /\.approved-data-note\) button\s*\{[^}]*background: var\(--ink\)/s,
  );
  assert.match(css, /button:focus-visible/);
  const source = fs.readFileSync("components/WorkspaceShared.tsx", "utf8");
  assert.match(source, /onClick=\{quotes.refresh\}/);
  assert.match(source, /older quote/);
  assert.match(source, /disabled=\{quotes.loading\}/);
});
