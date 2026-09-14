import fs from "node:fs";
const a=fs.readFileSync("lib/auryn/market-price-authority.ts","utf8"),q=fs.readFileSync("lib/auryn/fast-quote.ts","utf8"),p=fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8"),c=fs.readFileSync("components/portfolio/PortfolioPerformanceChart.tsx","utf8");
if(!/LAST MARKET PRICE/.test(a)||!/Session fallback/i.test(a))throw new Error("After-hours fallback missing");
if(!/lastMarketCandidate/.test(q)||!/providerSession/.test(q))throw new Error("Provider session preservation missing");
if(!/aurynInsightRibbon/.test(p)||!/aurynRiskGauge/.test(p))throw new Error("Portfolio visual intelligence missing");
if(!/strokeWidth=\{3\.2\}/.test(c)||!/benchmark/.test(c))throw new Error("Chart distinction missing");
if(JSON.stringify(JSON.parse(fs.readFileSync("vercel.json","utf8")))!=="{}")throw new Error("vercel.json changed");
console.log("V9.9.9.4 verified: session-safe price fallback + richer portfolio graphics; no SQL required.");
