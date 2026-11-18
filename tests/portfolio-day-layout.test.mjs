import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync(
  new URL("../components/PortfolioDay.module.css", import.meta.url),
  "utf8",
);
test("session movers reserve intrinsic amounts and wrap long symbols instead of overlapping", () => {
  assert.doesNotMatch(css, /grid-template-columns:\s*56px/);
  assert.match(
    css,
    /\.movers li\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) max-content max-content/s,
  );
  assert.match(css, /\.movers a\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /repeat\(auto-fit, minmax\(min\(100%, 260px\), 1fr\)\)/);
});
test("mixed observations cannot be presented as a single latest session", () => {
  const source = readFileSync(
    new URL("../components/PortfolioDay.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /Your holdings · latest session|Your holdings in the latest session/,
  );
  assert.match(source, /Mixed quote dates, not one session/);
  assert.match(source, /dateTime=\{d.oldestAsOf\}/);
  assert.match(source, /dateTime=\{d.asOf\}/);
  assert.match(source, /Quote observed \$\{m.asOf\}/);
});

test("holdings mover bars share actual dollar scale and retain explicit basis", () => {
  const source = readFileSync(
    new URL("../components/PortfolioDay.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    source,
    /Math\.max\(\s*1,\s*\.\.\.\[\.\.\.d.gainers, \.\.\.d.decliners\]\.map/,
  );
  assert.match(source, /Math\.abs\(m.move\) \/ largestMove/);
  assert.match(source, /m.move < 0\s*\? 50 -/);
  assert.match(
    source,
    /Bar lengths compare the displayed dollar contributions/,
  );
  assert.match(
    source,
    /Current quantities × quoted changes, not account performance/,
  );
});

test("rendered mover bars put losses left and gains right on a shared dollar scale", async () => {
  const ts = await import("typescript"),
    React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  const js = ts.default.transpileModule(
    readFileSync("components/PortfolioDay.tsx", "utf8"),
    {
      compilerOptions: {
        jsx: ts.default.JsxEmit.React,
        module: ts.default.ModuleKind.CommonJS,
        target: ts.default.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const out = {};
  const fixture = {
    priced: 2,
    holdings: 2,
    covered: 2,
    value: 200,
    move: -50,
    movePct: -25,
    gainers: [{ symbol: "UP", move: 50, changePct: 5, asOf: "2026-11-18" }],
    decliners: [
      { symbol: "DOWN", move: -100, changePct: -10, asOf: "2026-11-17" },
    ],
    mixedQuoteDates: true,
  };
  new Function("require", "exports", "React", js)(
    (name) =>
      name === "next/link"
        ? {
            default: ({ children, ...p }) =>
              React.createElement("a", p, children),
          }
        : name === "lucide-react"
          ? new Proxy({}, { get: () => () => null })
          : name.includes("portfolio-day")
            ? { portfolioDay: () => fixture }
            : name.includes("/format")
              ? {
                  amount: (v) => String(v),
                  percent: (v) => String(v),
                  quoteTime: (v) => v,
                }
              : name.includes("approved-workspace")
                ? { researchLink: (s) => "/research/" + s }
                : name.endsWith(".css")
                  ? { default: new Proxy({}, { get: (_, p) => p }) }
                  : {},
    out,
    React,
  );
  const html = renderToStaticMarkup(
    React.createElement(out.default, { positions: [], quotes: {}, prefix: "" }),
  );
  assert.match(html, /<rect x="50" y="2" width="25"/);
  assert.match(html, /<rect x="0" y="2" width="50"/);
  assert.match(html, /Mixed quote dates, not one session/);
  assert.match(html, /dateTime="2026-11-17"|datetime="2026-11-17"/i);
});
