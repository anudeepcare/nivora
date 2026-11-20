import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
test("phone market navigation exposes every view through a labeled selector, desktop row preserved", async () => {
  const React = await import("react");
  const src = fs.readFileSync("components/OptionsMarketPage.tsx", "utf8"),
    ast = ts.createSourceFile(
      "p.tsx",
      src,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
  const js = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export default /, ""))
      .join("\n"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
      },
    },
  ).outputText;
  const selected = [];
  const C = new Function(
    "React",
    "Link",
    "useState",
    "dynamic",
    "StockScreener",
    "layout",
    "plaidDiscovery",
    "useProduct",
    "OptionsMarketOverview",
    js + ";return OptionsMarketPage",
  )(
    React,
    "a",
    () => ["options", (v) => selected.push(v)],
    () => () => null,
    () => null,
    new Proxy({}, { get: (_, k) => k }),
    new Proxy({}, { get: (_, k) => k }),
    () => ({ demo: null }),
    () => null,
  );
  const tree = C();
  const walk = (n, p) => {
    if (!n || typeof n !== "object") return [];
    return [
      ...(p(n) ? [n] : []),
      ...React.Children.toArray(n.props?.children).flatMap((x) => walk(x, p)),
    ];
  };
  const selects = walk(tree, (n) => n.type === "select");
  assert.equal(selects.length, 1, "phone needs compact select");
  assert.equal(selects[0].props["aria-label"], "Market research view");
  const values = walk(selects[0], (n) => n.type === "option").map(
    (n) => n.props.value,
  );
  assert.deepEqual(values, [
    "options",
    "stocks",
    "trackers",
    "mood",
    "indexes",
    "earnings",
    "insiders",
    "summary",
    "etfs",
  ]);
  selects[0].props.onChange({ target: { value: "earnings" } });
  assert.deepEqual(selected, ["earnings"]);
  assert.equal(
    walk(
      tree,
      (n) => n.type === "button" && n.props["aria-pressed"] !== undefined,
    ).length,
    9,
  );
});
test("phone selector replaces rather than duplicates nav; disclosures have touch and focus rules", () => {
  const css = fs.readFileSync(
      "components/OptionsMarketOverview.module.css",
      "utf8",
    ),
    shared = fs.readFileSync(
      "components/GlobalEarningsCalendar.module.css",
      "utf8",
    );
  assert.match(css, /\.mobileViewChoice\s*\{\s*display:\s*none/);
  assert.match(
    css,
    /@media\s*\(max-width:\s*650px\)[\s\S]*\.viewSwitch\s*\{\s*display:\s*none/,
  );
  assert.match(shared, /\.root summary[\s\S]*min-height:\s*44px/);
  assert.match(shared, /summary:focus-visible/);
});
test("calendar and insider errors offer retry instead of a terminal text-only state", () => {
  const c = fs.readFileSync("components/GlobalEarningsCalendar.tsx", "utf8"),
    i = fs.readFileSync("components/MarketInsiderActivity.tsx", "utf8");
  assert.match(c, /onClick=\{result.refresh\}/);
  assert.match(i, /onClick=\{resource.refresh\}/);
});
