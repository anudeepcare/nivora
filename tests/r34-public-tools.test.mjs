import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const read = (p) => fs.readFileSync(p, "utf8");
const styles = new Proxy({}, { get: (_, p) => String(p) });
function renderCheck(initial = "") {
  let state = [initial, false],
    cursor = 0;
  const m = { exports: {} };
  const out = ts.transpileModule(read("components/PublicPortfolioCheck.tsx"), {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const Link = ({ href, children }) =>
    React.createElement("a", { href }, children);
  const Frame = ({ children }) => React.createElement("main", null, children);
  new Function("require", "module", "exports", "React", out)(
    (id) =>
      id === "react"
        ? {
            useState: () => {
              const i = cursor++;
              return [
                state[i],
                (v) => {
                  state[i] = v;
                },
              ];
            },
          }
        : id === "next/link"
          ? Link
          : id.endsWith(".css")
            ? styles
            : Frame,
    m,
    m.exports,
    React,
  );
  const run = () => {
    cursor = 0;
    return m.exports.default();
  };
  return { run, render: () => renderToStaticMarkup(run()), state };
}
test("portfolio check explains input and provides honest empty, invalid and populated results", () => {
  const empty = renderCheck().render();
  assert.match(empty, /No holdings entered/);
  assert.match(empty, /aria-describedby="portfolio-input-format"/);
  assert.match(empty, /Example values are illustrative/);
  const invalid = renderCheck("AAPL, nope").render();
  assert.match(invalid, /Check line 1/);
  const valid = renderCheck("AAPL, 27\nMSFT, 10\nAAPL, 13").render();
  assert.match(valid, /\$50/);
  assert.match(valid, /80\.0%/);
  assert.match(valid, /20\.0%/);
  assert.doesNotMatch(
    read("components/PublicPortfolioCheck.tsx"),
    /fetch\(|localStorage|sessionStorage/,
  );
});
test("two tool routes use mobile-first public frame and never promote empty Pace data as performance", () => {
  assert.match(read("app/track-record/page.tsx"), /tool="track-record"/);
  assert.match(
    read("components/PublicPortfolioCheck.tsx"),
    /tool="portfolio-check"/,
  );
  const frame = read("components/PublicFrame.tsx");
  assert.match(frame, /aria-current/);
  const css = read("components/PublicFrame.module.css");
  assert.match(css, /\.toolPage \.intro/);
  assert.match(css, /min-width: 760px/);
  const feed = read("components/PaceRecordFeed.tsx");
  assert.match(feed, /publication-disabled/);
  assert.match(feed, /No observations have been published/);
  assert.match(feed, /Retry observations/);
});

test("example and clear controls update only the local portfolio calculation", () => {
  const view = renderCheck();
  function find(node, label) {
    if (!React.isValidElement(node)) return undefined;
    if (node.type === "button" && node.props.children === label) return node;
    return React.Children.toArray(node.props.children)
      .map((child) => find(child, label))
      .find(Boolean);
  }
  find(view.run(), "Try an example").props.onClick();
  const sample = view.render();
  assert.match(sample, /Illustrative example/);
  assert.match(sample, /\$10,000/);
  find(view.run(), "Clear entries").props.onClick();
  assert.match(view.render(), /No holdings entered/);
  assert.doesNotMatch(view.render(), /\$10,000/);
});
