import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const research = fs.readFileSync("components/Research.tsx", "utf8");
const ast = ts.createSourceFile(
  "Research.tsx",
  research,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
function find(node, predicate) {
  if (predicate(node)) return node;
  return ts.forEachChild(node, (child) => find(child, predicate));
}
function switchHarness(
  tab = "Snapshot",
  href = "https://auryn.example/research/IREN",
) {
  const declaration = find(
    ast,
    (n) => ts.isVariableDeclaration(n) && n.name.getText(ast) === "switchTab",
  );
  const code = ts.transpileModule(`const ${declaration.getText(ast)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const calls = [],
    entries = [href];
  const window = {
    location: { href },
    history: {
      replaceState: (_state, _title, url) => {
        entries[entries.length - 1] = String(url);
        calls.push("replace");
      },
      pushState: (_state, _title, url) => {
        entries.push(String(url));
        calls.push("push");
      },
    },
  };
  const fn = new Function(
    "tab",
    "setRetainedCharts",
    "setTab",
    "cache",
    "symbol",
    "window",
    "requestAnimationFrame",
    code + ";return switchTab;",
  )(
    tab,
    () => calls.push("retain"),
    (value) => calls.push(value),
    { set: () => calls.push("cache") },
    "IREN",
    window,
    () => calls.push("scroll"),
  );
  return { fn, calls, entries };
}
test("repeat selection leaves history, cache and scroll untouched", () => {
  const h = switchHarness();
  h.fn("Snapshot");
  assert.deepEqual(h.calls, []);
});
test("section navigation adds a history entry and preserves its originating section", () => {
  const h = switchHarness("Technicals");
  h.fn("Financials");
  assert.equal(h.entries.length, 2);
  assert.equal(new URL(h.entries[0]).searchParams.get("tab"), "Technicals");
  assert.equal(new URL(h.entries[1]).searchParams.get("tab"), "Financials");
});
test("section navigation preserves unrelated URL parameters and fragment", () => {
  const h = switchHarness(
    "Snapshot",
    "https://auryn.example/research/IREN?tab=Snapshot&from=watchlist#price",
  );
  h.fn("Options");
  assert.equal(h.entries.length, 2);
  assert.equal(new URL(h.entries[1]).searchParams.get("from"), "watchlist");
  assert.equal(new URL(h.entries[1]).hash, "#price");
});
test("URL selection resets when history returns to an unqualified company route", () => {
  const effect = find(
    ast,
    (n) =>
      ts.isCallExpression(n) &&
      n.expression.getText(ast) === "useEffect" &&
      n.arguments[1]?.getText(ast) === "[requestedTab]",
  );
  const callback = ts.transpileModule(
    `const effect = ${effect.arguments[0].getText(ast)};`,
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  let selected = "Options";
  const run = new Function(
    "requestedTab",
    "tabs",
    "setTab",
    "setRetainedCharts",
    "lastRequestedTab",
    callback + ";return effect;",
  )(
    null,
    ["Snapshot", "Options"],
    (value) => (selected = value),
    () => {},
    { current: "Options" },
  );
  run();
  assert.equal(selected, "Snapshot");
});

import React from "react";
import * as icons from "lucide-react";
import { NavigationMemory } from "../lib/navigation.ts";
function shellHarness(pathname, page) {
  const source = ts.createSourceFile(
    "Shell.tsx",
    fs.readFileSync("components/Shell.tsx", "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = source.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "Shell",
  );
  const code = ts.transpileModule(
    declaration.getText(source).replace("export default ", ""),
    { compilerOptions: { jsx: ts.JsxEmit.React } },
  ).outputText;
  let stateCursor = 0,
    refCursor = 0;
  const states = [],
    refs = [],
    closed = [];
  const bindings = {
    ...icons,
    React,
    NavigationMemory,
    useProduct: () => ({ theme: "dark" }),
    useAccess: () => ({ access: {} }),
    usePathname: () => pathname,
    useRouter: () => ({ push: () => {} }),
    useRef: (value) =>
      refs[refCursor++] ?? (refs[refCursor - 1] = { current: value }),
    useState: (value) => {
      const index = stateCursor++;
      if (!(index in states)) states[index] = value;
      return [states[index], (next) => (states[index] = next)];
    },
    useEffect: () => {},
    useLayoutEffect: () => {},
    primary: [
      { path: "overview", label: "Home", icon: icons.Home },
      { path: "research", label: "Research", icon: icons.ChartNoAxesCombined },
    ],
    experience: new Proxy({}, { get: (_, key) => String(key) }),
    Link: "a",
    LinkProgress: () => null,
    AccessNotice: () => null,
    ReleaseNotice: () => null,
    ProductFooter: () => null,
    Search: () => null,
    browserScrollEnvironment: () => ({ readTop: () => 0 }),
    window: { scrollY: 0 },
  };
  for (const key of Object.keys(bindings))
    if (key === "default" || !/^[A-Za-z_$][\w$]*$/.test(key))
      delete bindings[key];
  const Shell = new Function(...Object.keys(bindings), code + ";return Shell;")(
    ...Object.values(bindings),
  );
  function render() {
    stateCursor = 0;
    refCursor = 0;
    return Shell({ page, children: null });
  }
  function all(node, predicate) {
    if (!node || typeof node !== "object") return [];
    return [
      ...(predicate(node) ? [node] : []),
      ...React.Children.toArray(node.props?.children).flatMap((child) =>
        all(child, predicate),
      ),
    ];
  }
  let tree = render();
  const dialog = all(
    tree,
    (n) => n.type === "dialog" && n.props.id === "workspace-tools",
  )[0];
  dialog.props.ref.current = {
    showModal: () => {},
    close: () => {
      closed.push(true);
      dialog.props.onClose?.();
    },
  };
  return { render, all, closed };
}
test("main selection follows the actual nested route rather than a stale page prop", () => {
  const h = shellHarness("/research/IREN", "overview");
  const links = h.all(
    h.render(),
    (n) => n.type === "a" && n.props["data-destination"],
  );
  assert.ok(
    links
      .filter((n) => n.props["data-destination"] === "research")
      .every((n) => n.props["aria-current"] === "page"),
  );
  assert.ok(
    links
      .filter((n) => n.props["data-destination"] === "overview")
      .every((n) => !n.props["aria-current"]),
  );
});
test("menu keeps the current destination selected and closes without navigating again", () => {
  const h = shellHarness("/discover", "discover");
  const current = h.all(
    h.render(),
    (n) => n.type === "a" && n.props.href === "/discover",
  )[0];
  assert.ok(current, "current menu destination must not disappear");
  assert.equal(current.props["aria-current"], "page");
  let prevented = false;
  current.props.onNavigate({ preventDefault: () => (prevented = true) });
  assert.equal(prevented, true);
  assert.equal(h.closed.length, 1);
});
test("menu trigger exposes its open and closed state", () => {
  const h = shellHarness("/overview", "overview");
  const trigger = () =>
    h.all(h.render(), (n) => n.props["aria-controls"] === "workspace-tools")[0];
  assert.equal(trigger().props["aria-expanded"], false);
  trigger().props.onClick();
  assert.equal(trigger().props["aria-expanded"], true);
  h.all(
    h.render(),
    (n) => n.type === "dialog" && n.props.id === "workspace-tools",
  )[0].props.onClose();
  assert.equal(trigger().props["aria-expanded"], false);
});
test("menu backdrop dismisses while clicks inside the panel stay open", () => {
  const h = shellHarness("/overview", "overview");
  const dialog = h.all(
    h.render(),
    (n) => n.type === "dialog" && n.props.id === "workspace-tools",
  )[0];
  assert.equal(typeof dialog.props.onClick, "function");
  const target = {
    getBoundingClientRect: () => ({
      left: 100,
      right: 500,
      top: 80,
      bottom: 600,
    }),
    close: () => h.closed.push(true),
  };
  dialog.props.onClick({
    target,
    currentTarget: target,
    clientX: 150,
    clientY: 100,
  });
  assert.equal(h.closed.length, 0);
  dialog.props.onClick({
    target,
    currentTarget: target,
    clientX: 50,
    clientY: 100,
  });
  assert.equal(h.closed.length, 1);
});
