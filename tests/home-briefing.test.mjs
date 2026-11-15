import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const m = await import("../lib/home-briefing.ts").catch(() => ({}));
const base = {
  today: "2026-11-15",
  symbols: ["AAPL"],
  checkpoints: [],
  loading: false,
  eventsReady: true,
  newsReady: true,
  error: false,
};
test("30-second briefing uses the earliest checkpoint, not the most dramatic event", () => {
  assert.equal(typeof m.homeBriefing, "function");
  const r = m.homeBriefing({
    ...base,
    checkpoints: [
      { symbol: "AAPL", date: "2026-11-18", kind: "Earnings" },
      { symbol: "AAPL", date: "2026-11-16", kind: "Dividend" },
    ],
  });
  assert.equal(r.event.date, "2026-11-16");
  assert.equal(r.title, "AAPL · Dividend");
});
test("briefing never turns missing calendar coverage into a quiet market claim", () => {
  assert.equal(typeof m.homeBriefing, "function");
  assert.match(
    m.homeBriefing({ ...base, eventsReady: false }).title,
    /Calendar coverage is incomplete/,
  );
  assert.match(m.homeBriefing(base).title, /No dated events returned/);
  assert.match(m.homeBriefing({ ...base, loading: true }).title, /Checking/);
  assert.match(m.homeBriefing({ ...base, symbols: [] }).title, /first company/);
});
test("briefing rejects unrelated, past, invalid and out-of-window checkpoints", () => {
  assert.equal(typeof m.homeBriefing, "function");
  const r = m.homeBriefing({
    ...base,
    checkpoints: [
      { symbol: "MSFT", date: "2026-11-16", kind: "Earnings" },
      { symbol: "AAPL", date: "2026-11-14", kind: "Earnings" },
      { symbol: "AAPL", date: "bad", kind: "Earnings" },
      { symbol: "AAPL", date: "2026-12-01", kind: "Earnings" },
    ],
  });
  assert.equal(r.event, null);
});
test("Home puts briefing and editorial evidence before optional analysis tools", () => {
  const source = readFileSync(
    new URL("../components/HomeWorkspace.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.indexOf("<HomeDailyBriefing") < source.indexOf("<HomeMarketCards"),
  );
  assert.ok(
    source.indexOf("home-evidence-layout") <
      source.indexOf("<ContributionCompare"),
  );
  assert.ok(
    source.indexOf("home-evidence-layout") < source.indexOf("<ResearchInbox"),
  );
  assert.doesNotMatch(source, /title="What changed"/);
});

test("briefing source status distinguishes unsupported symbols, loading and failures", () => {
  assert.equal(typeof m.briefingSourceStatus, "function");
  assert.equal(
    m.briefingSourceStatus({
      symbols: ["BTC/USD"],
      loading: false,
      ready: true,
      error: false,
    }),
    "Stocks only",
  );
  assert.equal(
    m.briefingSourceStatus({
      symbols: [],
      loading: false,
      ready: true,
      error: false,
    }),
    "Follow a company",
  );
  assert.equal(
    m.briefingSourceStatus({
      symbols: ["AAPL"],
      loading: true,
      ready: true,
      error: false,
    }),
    "Checking…",
  );
  assert.equal(
    m.briefingSourceStatus({
      symbols: ["AAPL"],
      loading: false,
      ready: true,
      error: true,
    }),
    "Incomplete",
  );
  assert.equal(
    m.briefingSourceStatus({
      symbols: ["AAPL"],
      loading: false,
      ready: true,
      error: false,
    }),
    "Checked",
  );
});

test("secondary tools remain one tap away from the top of Home", () => {
  const source = readFileSync(
    new URL("../components/HomeWorkspace.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /href="#home-workbench"/);
  assert.match(source, /id="home-workbench"/);
});

test("empty briefing has no links to conditional evidence panels", async () => {
  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const ts = (await import("typescript")).default;
  const source = readFileSync(
    new URL("../components/HomeDailyBriefing.tsx", import.meta.url),
    "utf8",
  );
  const ast = ts.createSourceFile(
    "view.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = ast.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "HomeDailyBriefing",
  );
  const code = ts.transpileModule(
    declaration.getText(ast).replace("export default ", ""),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const empty = () => null;
  const bindings = {
    React,
    ...m,
    Link: ({ children, ...p }) => React.createElement("a", p, children),
    ArrowUpRight: empty,
    CalendarDays: empty,
    ShieldCheck: empty,
    quoteTime: () => "",
    styles: {},
  };
  const View = new Function(
    ...Object.keys(bindings),
    `${code};return HomeDailyBriefing;`,
  )(...Object.values(bindings));
  const html = renderToStaticMarkup(
    React.createElement(View, {
      ...base,
      symbols: [],
      prefix: "/preview",
      demo: false,
    }),
  );
  assert.doesNotMatch(html, /href="#home-(earnings|news|coverage)"/);
  assert.match(html, /href="\/preview\/research"/);
  const populated = renderToStaticMarkup(
    React.createElement(
      View,
      { ...base, prefix: "", demo: false },
      React.createElement(
        "section",
        { "data-test": "portfolio" },
        "Portfolio session",
      ),
    ),
  );
  assert.ok(populated.indexOf("Portfolio session") > 0);
  assert.ok(
    populated.indexOf("Portfolio session") <
      populated.indexOf("Source coverage"),
  );
});
