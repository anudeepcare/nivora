import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
const source = fs.readFileSync("components/DetailDialog.tsx", "utf8");
function harness(initial = false) {
  const refs = [],
    effects = [],
    states = [],
    portals = [];
  const code = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const mod = { exports: {} };
  const deps = {
    react: {
      ...React,
      useState: () => [initial, (v) => states.push(v)],
      useRef: () => {
        const r = { current: null };
        refs.push(r);
        return r;
      },
      useId: () => "detail-title",
      useEffect: (f) => effects.push(f),
    },
    "react/jsx-runtime": jsx,
    "react-dom": {
      createPortal: (child, target) => {
        portals.push({ child, target });
        return child;
      },
    },
    "lucide-react": { ArrowUpRight: () => null, X: () => null },
    "./DetailDialog.module.css": {
      default: {
        trigger: "trigger",
        dialog: "dialog",
        header: "header",
        content: "content",
      },
    },
  };
  new Function("require", "module", "exports", code)(
    (name) => deps[name],
    mod,
    mod.exports,
  );
  const body = {};
  const doc = { body, documentElement: { style: { overflow: "scroll" } } };
  const prior = globalThis.document;
  globalThis.document = doc;
  const tree = mod.exports.default({
    title: "All metrics",
    trigger: "More metrics",
    children: React.createElement("p", null, "Unabridged evidence"),
  });
  globalThis.document = prior;
  return { tree, refs, effects, states, portals, doc };
}
test("closed detail is only a labelled dialog trigger, without inline expansion", () => {
  const h = harness();
  const html = renderToStaticMarkup(h.tree);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /Unabridged evidence|<dialog|<details/);
  assert.equal(h.portals.length, 0);
  React.Children.toArray(h.tree.props.children)[0].props.onClick();
  assert.deepEqual(h.states, [true]);
});
test("open detail portals content and native dialog restores focus and scroll on close", () => {
  const h = harness(true);
  assert.equal(h.portals.length, 1);
  assert.equal(h.portals[0].target, h.doc.body);
  const dialog = h.portals[0].child;
  assert.equal(dialog.type, "dialog");
  assert.equal(dialog.props["aria-labelledby"], "detail-title");
  let opened = 0,
    focused = 0,
    restored = 0,
    closed = 0;
  h.refs[0].current = {
    open: false,
    showModal() {
      opened++;
      this.open = true;
    },
    close() {
      closed++;
    },
  };
  h.refs[1].current = {
    focus: (options) => {
      assert.equal(options.preventScroll, true);
      restored++;
    },
  };
  h.refs[2].current = { focus: () => focused++ };
  const prior = globalThis.document;
  globalThis.document = h.doc;
  try {
    const cleanup = h.effects[0]();
    assert.equal(opened, 1);
    assert.equal(focused, 1);
    assert.equal(h.doc.documentElement.style.overflow, "hidden");
    dialog.props.onClose();
    assert.deepEqual(h.states, [false]);
    cleanup();
    assert.equal(restored, 1);
    assert.equal(h.doc.documentElement.style.overflow, "scroll");
  } finally {
    globalThis.document = prior;
  }
  assert.equal(
    dialog.props.onCancel,
    undefined,
    "Escape uses native close behavior, never prevented",
  );
  const element = {
    getBoundingClientRect: () => ({
      left: 10,
      right: 100,
      top: 10,
      bottom: 100,
    }),
    close: () => closed++,
  };
  dialog.props.onClick({
    target: element,
    currentTarget: element,
    clientX: 40,
    clientY: 40,
  });
  assert.equal(closed, 0);
  dialog.props.onClick({
    target: element,
    currentTarget: element,
    clientX: 0,
    clientY: 40,
  });
  assert.equal(closed, 1);
});
test("mobile dialog bounds, touch targets and compact summary preserve accessible detail", () => {
  const css = fs.readFileSync("components/DetailDialog.module.css", "utf8");
  assert.match(css, /100dvh/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /overflow: auto/);
  assert.match(css, /44px/);
  const conclusion = fs.readFileSync(
    "components/ResearchConclusion.tsx",
    "utf8",
  );
  assert.match(conclusion, /<DetailDialog/);
  assert.doesNotMatch(conclusion, /<details/);
  assert.equal((conclusion.match(/d\.explanation\.detail/g) || []).length, 2);
  const summary = fs.readFileSync(
    "components/ResearchConclusion.module.css",
    "utf8",
  );
  assert.match(summary, /-webkit-line-clamp: 3/);
});
