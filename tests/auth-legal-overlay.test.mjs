import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { documents, legalConfiguration } from "../lib/legal-content.ts";
const read = (path) => readFileSync(path, "utf8");
test("sign-in brand returns home and the desktop side contour banner needs no exit affordance", () => {
  const login = read("components/Session.tsx");
  assert.match(login, /href="\/" className=\{experience.accessBrand\}/);
  assert.doesNotMatch(login, /Close sign in and return to Auryn/);
  assert.match(
    read("components/SessionAccess.css"),
    /\[data-auth-side\][^{}]*\{[^}]*repeating-radial-gradient/,
  );
});
test("native legal dialog preserves the form and uses existing full legal document text", () => {
  const login = read("components/Session.tsx");
  assert.match(login, /<AuthLegalLinks\s*\/>/);
  const component = read("components/AuthLegalLinks.tsx");
  assert.match(component, /documents\[active\]/);
  assert.match(component, /<dialog/);
  assert.match(component, /showModal\(\)/);
  assert.match(component, /onClose=/);
  assert.match(component, /opener.current\?\.focus\(/);
  assert.match(component, /target="_blank"/);
  assert.match(component, /document.sections.map/);
});

test("legal links open the exact document, allow modified clicks, and restore focus after dismissal", () => {
  const source = read("components/AuthLegalLinks.tsx");
  const js = ts.transpileModule(
    source
      .replace(/^(?:"use client";|import[^;]+;)\s*/gm, "")
      .replace("export default function", "return function"),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  let active = null,
    opened = 0,
    dismissed = 0,
    focused = 0;
  const doc = { scrollTop: 200 };
  const refs = [
    {
      current: {
        showModal: () => {
          assert.equal(active, "terms");
          opened++;
        },
        close: () => dismissed++,
      },
    },
    { current: null },
    { current: doc },
  ];
  let refIndex = 0;
  const view = new Function(
    "React",
    "useId",
    "useRef",
    "useState",
    "flushSync",
    "documents",
    "legalConfiguration",
    js,
  )(
    React,
    () => "terms-heading",
    () => refs[refIndex++],
    () => [active, (next) => (active = next)],
    (callback) => callback(),
    documents,
    legalConfiguration,
  );
  const controls = () => {
    refIndex = 0;
    return React.Children.toArray(view().props.children);
  };
  let prevent = 0;
  const event = {
    button: 0,
    currentTarget: {
      focus: (options) => {
        assert.equal(options.preventScroll, true);
        focused++;
      },
    },
    preventDefault: () => prevent++,
  };
  let elements = controls();
  let link = elements.find((node) => node?.props?.href === "/terms");
  link.props.onClick({ ...event, ctrlKey: true });
  assert.equal(opened, 0);
  assert.equal(prevent, 0);
  link.props.onClick(event);
  assert.equal(opened, 1);
  assert.equal(prevent, 1);
  assert.equal(doc.scrollTop, 0);
  elements = controls();
  const dialog = elements.find((node) => node?.type === "dialog");
  const markup = renderToStaticMarkup(dialog);
  assert.match(markup, /aria-labelledby="terms-heading"/);
  assert.ok(markup.includes(documents.terms.title));
  assert.ok(markup.includes(documents.terms.sections.at(-1).title));
  assert.match(markup, /href="\/terms" target="_blank"/);
  const [header, scroller] = dialog.props.children;
  assert.equal(scroller.props.role, "region");
  assert.equal(scroller.props.tabIndex, 0);
  assert.equal(scroller.props["aria-label"], "Document text");
  assert.match(
    read("components/SessionAccess.css"),
    /\.mp-auth-legal-body:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--plaid-focus/,
  );
  header.props.children
    .find((child) => child.type === "button")
    .props.onClick();
  assert.equal(dismissed, 1);
  dialog.props.onClose();
  assert.equal(focused, 1);
  assert.equal(active, null);
});
