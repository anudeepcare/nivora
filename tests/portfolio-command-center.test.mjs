import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
import fs from "node:fs";
function read(input) {
  let model;
  try {
    model = sourceModule("components/portfolio-read.ts");
  } catch {}
  assert.ok(model, "Portfolio read model is available");
  return model.portfolioRead(input);
}
const base = {
  missing: 0,
  older: 0,
  largest: { symbol: "MSFT", weight: 42 },
  limit: null,
  earnings: 0,
  ready: true,
  holdings: 3,
};
test("missing prices take priority over a concentration conclusion", () => {
  const result = read({ ...base, missing: 2, limit: 30 });
  assert.equal(result.title, "Complete the picture first");
  assert.match(result.detail, /2 holdings/);
});
test("concentration conclusion uses the owner threshold only", () => {
  assert.equal(read(base).title, "Know what drives your portfolio");
  const result = read({ ...base, limit: 30 });
  assert.equal(result.title, "Review your largest position");
  assert.match(result.detail, /MSFT.*42.0%.*30%/);
});
test("empty and loading portfolios never imply an assessment", () => {
  assert.equal(
    read({ ...base, ready: false }).title,
    "Building your portfolio view",
  );
  assert.equal(
    read({ ...base, holdings: 0 }).title,
    "Start with your holdings",
  );
});
test("portfolio composition promotes the chart before the position decisions", () => {
  const source = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
  assert.ok(
    source.indexOf("<ApprovedPortfolioChart") <
      source.indexOf("<DecisionAttention"),
  );
  assert.match(source, /Priced investments/);
  assert.match(source, /portfolioRead/);
});
test("market comparison offers direct SPY and QQQ controls with a stated basis", () => {
  const source = fs.readFileSync(
    "components/ApprovedPortfolioChart.tsx",
    "utf8",
  );
  assert.match(source, /aria-label="Choose comparison benchmark"/);
  assert.match(source, /onClick=\{\(\) => setBenchmark\(symbol\)\}/);
  assert.match(source, /Not your account return/);
});
test("earnings count represents unique held stocks, not lots or other assets", () => {
  const model = sourceModule("components/portfolio-read.ts");
  assert.equal(typeof model.portfolioEarningsCount, "function");
  const positions = [
    { symbol: "MSFT", assetType: "stock", quantity: 2 },
    { symbol: "MSFT", assetType: "stock", quantity: 3 },
    { symbol: "AAPL", assetType: "stock", quantity: 1 },
    { symbol: "NVDA", assetType: "stock", quantity: 0 },
    { symbol: "USD", assetType: "cash", quantity: 10 },
    { symbol: "BTC", assetType: "crypto", quantity: 1 },
    { symbol: "AMZN", assetType: "stock", quantity: 1 },
  ];
  assert.equal(
    model.portfolioEarningsCount(
      positions,
      new Set(["MSFT", "AAPL", "NVDA", "USD", "BTC"]),
    ),
    2,
  );
  assert.equal(model.portfolioEarningsCount(positions, new Set()), 0);
  assert.equal(model.portfolioEarningsCount([], new Set(["MSFT"])), 0);
  const source = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
  assert.match(
    source,
    /const earningsCount = portfolioEarningsCount\(positions, earnings\)/,
  );
});
test("holdings precede scenarios in source and every command-center breakpoint", () => {
  const page = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
  const chart = fs.readFileSync(
    "components/ApprovedPortfolioChart.tsx",
    "utf8",
  );
  assert.ok(
    page.indexOf('id="portfolio-holdings"') <
      page.indexOf("</ApprovedPortfolioChart>"),
    "holdings are passed before the chart's trailing scenario panel",
  );
  assert.ok(
    chart.indexOf("{children}") <
      chart.indexOf('className="card portfolio-range-panel"'),
    "source order puts holdings before scenarios",
  );
  const css = fs
    .readFileSync("components/PortfolioWorkspace.module.css", "utf8")
    .split("/* Portfolio command center:")[1];
  const rows = (panel) =>
    [
      ...css.matchAll(
        new RegExp(
          `:global\\(\\.portfolio-grid > \\.portfolio-${panel}-panel\\)\\s*\\{([^}]+)\\}`,
          "g",
        ),
      ),
    ].map((match) => Number(match[1].match(/grid-row:\s*(\d+)/)[1]));
  assert.deepEqual(rows("holdings"), [3, 4]);
  assert.deepEqual(rows("range"), [4, 5]);
});
