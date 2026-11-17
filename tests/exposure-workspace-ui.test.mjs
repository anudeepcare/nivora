import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import * as jsx from "react/jsx-runtime";
import * as icons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import * as exposure from "../lib/exposure-board.ts";
import * as format from "../lib/format.ts";
import * as windowDates from "../lib/exposure-window.ts";
const mod = { exports: {} };
const code = ts.transpileModule(
  fs.readFileSync("components/ExposureBoard.tsx", "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  },
).outputText;
new Function("require", "module", "exports", code)(
  (name) => {
    if (name === "react") return React;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "lucide-react") return icons;
    if (name === "@/lib/exposure-window") return windowDates;
    if (name === "@/lib/exposure-board") return exposure;
    if (name === "@/lib/format") return format;
    if (name === "./Ui")
      return {
        Help: ({ label, children }) =>
          React.createElement(
            "details",
            null,
            React.createElement("summary", null, label),
            children,
          ),
      };
    if (name.endsWith(".css"))
      return {
        __esModule: true,
        default: new Proxy({}, { get: (_, p) => String(p) }),
      };
    throw Error(name);
  },
  mod,
  mod.exports,
);
const c = {
  id: "test",
  type: "call",
  strike: 100,
  expiry: "2026-12-18",
  observed: "2026-11-05",
  gamma: 0.02,
  oi: 20,
  volume: 10,
  multiplier: 100,
  standard: true,
};
test("populated exposure UI explains sign, coverage and accessible inspection", () => {
  const html = renderToStaticMarkup(
    React.createElement(mod.exports.default, {
      contracts: [c],
      spot: 100,
      symbol: "TEST",
      complete: false,
      onContracts() {},
    }),
  ).replace(/<!--.*?-->/g, "");
  for (const text of [
    "Estimated GEX",
    "Open interest",
    "Nearby strikes",
    "Save snapshot",
    "Export",
    "1/1 visible cells measured",
    "actual dealer positions and hedging activity are not known",
    "Contracts",
  ])
    assert.ok(html.includes(text), text);
  assert.match(html, /100 strike, 2026-12-18, 4,000, largest visible exposure/);
});
test("missing inputs render unmeasured cells, not numeric zero", () => {
  const html = renderToStaticMarkup(
    React.createElement(mod.exports.default, {
      contracts: [{ ...c, gamma: null }],
      spot: 100,
      symbol: "TEST",
      complete: false,
    }),
  ).replace(/<!--.*?-->/g, "");
  assert.match(html, /0\/1 visible cells measured/);
  assert.match(html, /100 strike, 2026-12-18, not measured/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test("account replay exposes an exit without removed saved-view controls", () => {
  const html = renderToStaticMarkup(
    React.createElement(mod.exports.default, {
      contracts: [c],
      spot: 100,
      symbol: "TEST",
      complete: false,
      externalSnapshot: {
        id: "account",
        symbol: "TEST",
        savedAt: "2026-11-05T10:00:00Z",
        board: exposure.exposureBoard([c], 100),
      },
      onExitReplay() {},
    }),
  );
  assert.match(html, /Account replay is active/);
  assert.match(html, /Exit account replay/);
  assert.doesNotMatch(html, /Saved views|Observation<select/);
});

test("focused board shortcuts act locally and leave controls and modified keys alone", () => {
  const updates = [];
  const scrolls = [];
  const mockReact = {
    ...React,
    useMemo: (fn) => fn(),
    useEffect() {},
    useState: (initial) => [
      typeof initial === "function" ? initial() : initial,
      (value) => updates.push(value),
    ],
    useRef: () => ({
      current: {
        querySelector: (selector) => ({
          scrollIntoView: () => scrolls.push(selector),
        }),
      },
    }),
  };
  const local = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => {
      if (name === "react") return mockReact;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "lucide-react") return icons;
      if (name === "@/lib/exposure-window") return windowDates;
    if (name === "@/lib/exposure-board") return exposure;
      if (name === "@/lib/format") return format;
      if (name === "./Ui") return { Help: () => null };
      if (name.endsWith(".css")) return { __esModule: true, default: {} };
      throw Error(name);
    },
    local,
    local.exports,
  );
  const tree = local.exports.default({
    contracts: [c],
    spot: 100,
    symbol: "TEST",
    complete: false,
  });
  assert.equal(tree.props.tabIndex, 0);
  let prevented = 0;
  const event = (key, control = false, extras = {}) => ({
    key,
    target: { closest: () => (control ? {} : null) },
    preventDefault: () => prevented++,
    ...extras,
  });
  tree.props.onKeyDown(event("l"));
  assert.deepEqual(updates, ["100|2026-12-18"]);
  assert.deepEqual(scrolls, ['[data-strike="100"]']);
  tree.props.onKeyDown(event("Escape"));
  assert.equal(updates.at(-1), null);
  tree.props.onKeyDown(event("s", true));
  tree.props.onKeyDown(event("s", false, { ctrlKey: true }));
  tree.props.onKeyDown(event("s", false, { repeat: true }));
  assert.equal(prevented, 2);
});

test("map defaults to all loaded future expirations independently of contract selection",()=>{
 const html=renderToStaticMarkup(React.createElement(mod.exports.default,{contracts:[c,{...c,id:'later',expiry:'2027-01-15'}],spot:100,symbol:'TEST',complete:false,expiry:'2027-01-15'}));
 assert.match(html,/100 strike, 2027-01-15/);assert.match(html,/100 strike, 2026-12-18/);
});
test("calendar windows clamp month ends and preserve all dates without a column cap",()=>{
 const dates=['2026-01-30','2026-02-28','2026-03-01','2026-03-31','2026-07-31','2026-08-01'];const now=Date.parse('2026-01-31T12:00:00Z');
 assert.deepEqual(windowDates.exposureDates(dates,1,undefined,now),['2026-02-28']);
 assert.deepEqual(windowDates.exposureDates(dates,2,undefined,now),['2026-02-28','2026-03-01','2026-03-31']);
 assert.equal(windowDates.exposureDates(dates,6,undefined,now).length,4);
 assert.equal(windowDates.exposureDates(dates,0,undefined,now).length,5);
 assert.deepEqual(windowDates.exposureDates(dates,-1,'2026-02-15',now),['2026-02-15']);
});
