import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function load(hooks = React) {
  const source = fs.readFileSync("components/PublicPlaidOpening.tsx", "utf8");
  const m = { exports: {} };
  new Function(
    "require",
    "module",
    "exports",
    "React",
    ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.CommonJS,
      },
    }).outputText,
  )(
    (n) =>
      n === "react"
        ? hooks
        : n === "next/link"
          ? {
              default: ({ children, ...p }) =>
                React.createElement("a", p, children),
            }
          : n === "lucide-react"
            ? new Proxy({}, { get: () => () => null })
            : { default: new Proxy({}, { get: (_, k) => k }) },
    m,
    m.exports,
    React,
  );
  return m.exports.default;
}
function render() {
  return renderToStaticMarkup(
    React.createElement(load(), {
      brand: React.createElement("span", null, "AURYN"),
      themeControl: null,
    }),
  );
}
test("public opening links real routes and explicitly labels methodology previews without fabricated prices", () => {
  const html = render();
  for (const value of [
    "Know what",
    "you own.",
    "/sample",
    "/methodology",
    "/login",
    "/portfolio",
    "/options",
    "Method preview",
    "Decision Atlas",
    "Auryn Pace",
    "Market Radar",
    "Screener",
  ])
    assert.ok(html.includes(value), value);
  assert.doesNotMatch(html, /\$112\.40|\$158|\$86|BABA|\+30%/);
});
test("accessible Explore menu and responsive artwork have scoped classes", () => {
  const s = fs.readFileSync("components/PublicPlaidOpening.tsx", "utf8");
  assert.match(s, /aria-expanded=\{open\}/);
  assert.match(s, /Escape/);
  assert.match(s, /pointerdown/);
  assert.match(s, /\.focus\(\)/);
  assert.match(s, /aria-pressed=\{category === index\}/);
  assert.match(s, /aria-hidden="true"/);
  const css = fs.readFileSync(
    "components/PublicPlaidOpening.module.css",
    "utf8",
  );
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /data-theme="light"/);
});

test("Explore opens, switches real destinations and closes on Escape/outside pointer", () => {
  const state = [false, 0];
  let index = 0,
    focused = 0;
  const listeners = {};
  const refs = [
    { current: { contains: (t) => t === "inside" } },
    { current: { focus: () => focused++ } },
  ];
  let refIndex = 0;
  const effects = [];
  const hooks = {
    ...React,
    useState: (initial) => {
      const i = index++;
      return [state[i], (v) => (state[i] = v)];
    },
    useRef: () => refs[refIndex++],
    useEffect: (f) => effects.push(f),
  };
  const Component = load(hooks);
  const render = () => {
    index = 0;
    refIndex = 0;
    return Component({ brand: "AURYN", themeControl: null });
  };
  const nodes = (n) =>
    !n || typeof n !== "object"
      ? []
      : [n, ...React.Children.toArray(n.props?.children).flatMap(nodes)];
  let tree = render();
  let all = nodes(tree);
  const trigger = all.find(
    (n) => n.props?.["aria-controls"] === "public-explore",
  );
  assert.equal(trigger.props["aria-expanded"], false);
  trigger.props.onClick();
  tree = render();
  all = nodes(tree);
  assert.ok(all.some((n) => n.props?.id === "public-explore"));
  const category = all.find(
    (n) =>
      n.type === "button" &&
      React.Children.toArray(n.props.children)[0] === "Portfolio",
  );
  category.props.onClick();
  all = nodes(render());
  assert.ok(
    all.some((n) => n.props?.["aria-label"] === "Portfolio destinations"),
  );
  const header = all.find((n) => n.type === "header" && n.props.onKeyDown);
  header.props.onKeyDown({ key: "Escape" });
  assert.equal(state[0], false);
  assert.equal(focused, 1);
  state[0] = true;
  effects.length = 0;
  render();
  const previous = globalThis.document;
  globalThis.document = {
    addEventListener: (k, f) => (listeners[k] = f),
    removeEventListener: (k) => delete listeners[k],
  };
  try {
    const cleanup = effects.at(-1)();
    listeners.pointerdown({ target: "inside" });
    assert.equal(state[0], true);
    listeners.pointerdown({ target: "outside" });
    assert.equal(state[0], false);
    cleanup();
    assert.equal(listeners.pointerdown, undefined);
  } finally {
    globalThis.document = previous;
  }
});

test("Pace method card shows the five-stage dial without a fake selected signal", () => {
  const s = fs.readFileSync("components/PublicPlaidOpening.tsx", "utf8");
  assert.match(s, /function PaceMethodDial/);
  assert.match(s, /aria-label="Pace stages P0 through P4, no stock selected"/);
  assert.match(s, /<PaceMethodDial\s*\/>/);
});
