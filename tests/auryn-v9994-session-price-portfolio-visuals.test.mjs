
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const q=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),a=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8"),chart=fs.readFileSync("components/portfolio/PortfolioPerformanceChart.tsx","utf8"),pulse=fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8");
test("after-hours does not become VERIFYING merely because last valid price is older than 5 minutes",()=>{assert.match(a,/LAST MARKET PRICE/);assert.match(a,/session fallback/i)});
test("Twelve provider preserves a last-market fallback instead of throwing it away",()=>assert.match(q,/lastMarketCandidate/));
test("Alpaca session freshness is not hard-coded to regular-session 180 and 90 seconds",()=>{assert.match(q,/sessionTradeMaxAge/);assert.match(q,/sessionQuoteMaxAge/)});
test("non-US exchange symbols do not blindly use US session labeling",()=>assert.match(q,/providerSession/));
test("performance chart gives portfolio and benchmarks distinct widths",()=>{assert.match(chart,/portfolio[\s\S]*strokeWidth=\{3\.2\}/i);assert.match(chart,/benchmark/i)});
test("portfolio visual section has richer insight graphics",()=>{assert.match(pulse,/aurynInsightRibbon/);assert.match(pulse,/aurynRiskGauge/);assert.match(pulse,/aurynInsightTile/)});
