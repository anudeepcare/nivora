import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { NavigationMemory, restoreWhenReady } from "../lib/navigation.ts";

function component(file, name, bindings) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  const code = ts.transpileModule(
    declaration.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  return new Function(
    "React",
    ...Object.keys(bindings),
    code + `;return ${name};`,
  )(React, ...Object.values(bindings));
}

test("workspace pages share a layout-owned session and shell without route keys", () => {
  let path = "/portfolio";
  const AppSession = component("components/AppSession.tsx", "AppSession", {
    usePathname: () => path,
    ProductSession: "ProductSession",
    Shell: "Shell",
  });
  const first = AppSession({ children: "portfolio" });
  path = "/watchlist";
  const next = AppSession({ children: "watchlist" });
  assert.equal(first.type, "ProductSession");
  assert.equal(next.type, first.type);
  assert.equal(first.key, null);
  assert.equal(next.key, null);
  assert.equal(first.props.children.type, "Shell");
  assert.equal(next.props.children.props.page, "watchlist");
  assert.match(
    fs.readFileSync("app/layout.tsx", "utf8"),
    /<AppSession>\{children\}<\/AppSession>/,
  );
  assert.doesNotMatch(
    fs.readFileSync("components/Product.tsx", "utf8"),
    /<ProductSession demo=\{demo\}>\s*<Shell page=\{page\}>\s*\{page ===/,
  );
});

test("local preview has its own isolated session and never starts real account loading", () => {
  const AppSession = component("components/AppSession.tsx", "AppSession", {
    usePathname: () => "/preview/portfolio",
    ProductSession: "ProductSession",
    Shell: "Shell",
  });
  const tree = AppSession({ children: "preview" });
  assert.equal(tree.props.children, "preview");
  assert.notEqual(tree.type, "ProductSession");
});

test("switching workspace tabs restores their own position; tapping the active tab does not jump", () => {
  let path = "/portfolio",
    cursor = 0,
    effect;
  const refs = [],
    calls = [];
  const listeners = new Map();
  const window = {
    scrollY: 720,
    scrollTo: (value) => calls.push(value),
    addEventListener: (event, fn) => listeners.set(event, fn),
    removeEventListener: (event) => listeners.delete(event),
  };
  const icon = () => null;
  const Shell = component("components/Shell.tsx", "Shell", {
    usePathname: () => path,
    useProduct: () => ({ theme: "dark" }),
    useRef: (value) =>
      refs[cursor++] ?? (refs[cursor - 1] = { current: value }),
    useLayoutEffect: (fn) => {
      effect = fn;
    },
    useEffect: () => {},
    NavigationMemory,
    restoreWhenReady,
    browserScrollEnvironment: () => ({
      maxScroll: () => 10000,
      scrollTo: (top) => window.scrollTo({ top, left: 0, behavior: "instant" }),
      observe: () => () => {},
      onIntent: () => () => {},
      delay: () => () => {},
    }),
    window,
    primary: [
      { path: "portfolio", label: "Portfolio", icon },
      { path: "watchlist", label: "Watchlist", icon },
    ],
    Link: "Link",
    Logo: icon,
    ProductFooter: icon,
    Settings: icon,
    Search: icon,
    SearchIcon: icon,
    Sun: icon,
    Moon: icon,
    X: icon,
    Bell: icon,
    SettingsSheet: icon,
  });
  function links(node, href) {
    if (!node || typeof node !== "object") return [];
    return [
      ...(node.type === "Link" &&
      node.props.href === href &&
      node.props.onNavigate
        ? [node]
        : []),
      ...React.Children.toArray(node.props?.children).flatMap((child) =>
        links(child, href),
      ),
    ];
  }
  function render() {
    cursor = 0;
    return Shell({ page: path.slice(1), children: "content" });
  }
  const first = render();
  const away = links(first, "/watchlist")[0];
  assert.equal(away.props.scroll, false);
  away.props.onNavigate({
    preventDefault: () => assert.fail("new tab should navigate"),
  });
  path = "/watchlist";
  const second = render();
  effect();
  assert.equal(calls.at(-1).top, 0);
  window.scrollY = 360;
  links(second, "/portfolio")[0].props.onNavigate({ preventDefault: () => {} });
  path = "/portfolio";
  const third = render();
  effect();
  assert.equal(calls.at(-1).top, 720);
  assert.equal(calls.at(-1).behavior, "instant");
  let prevented = false;
  links(third, "/portfolio")[0].props.onNavigate({
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  assert.equal(calls.length, 2);
  // Leaving through a company link still retains the last list position.
  window.scrollY = 910;
  listeners.get("scroll")();
  path = "/research/APP";
  const research = render();
  effect();
  links(research, "/portfolio")[0].props.onNavigate({
    preventDefault: () => {},
  });
  path = "/portfolio";
  render();
  effect();
  assert.equal(calls.at(-1).top, 910);
});

test('public storefront and sample bypass the account shell while research remains protected',()=>{
 for(const path of ['/','/sample','/research/MSFT','/portfolio','/login']){
 const AppSession=component('components/AppSession.tsx','AppSession',{React,usePathname:()=>path,ProductSession:'ProductSession',Shell:'Shell'});const tree=AppSession({children:'content'});assert.equal(tree.type==='ProductSession',!['/','/sample'].includes(path));
 }
});
