// Exercise compiled Next handlers with identity and provider fixtures. No external or paid calls.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  load = (p) =>
    require(`../.next/server/app/api/${p}/route.js`).routeModule.userland;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://account.example.invalid";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-public";
process.env.TWELVE_DATA_API_KEY = "test-twelve";
process.env.EODHD_API_KEY = "test-eodhd";
delete process.env.EODHD_API_TOKEN;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.AURYN_REQUIRE_DISTRIBUTED_BUDGET;
const headers = {
  Authorization: "Bearer fixture",
  "Content-Type": "application/json",
};
const calls = [],
  checks = [];
const financial = (symbol) => ({
  General: {
    Code: symbol,
    ...(symbol === "PEERBASE" ? { Sector: "Technology", Industry: "Software" } : {}),
    Name: symbol === "SAP" ? "SAP SE" : symbol,
    Exchange: "NYSE",
    CurrencyCode: "USD",
    CountryISO: symbol === "SAP" ? "DE" : "US",
    CIK: "0000320193",
    UpdatedAt: "2026-10-16",
    LogoURL: "/img/logos/US/aapl.png",
  },
  Financials: Object.fromEntries(
    ["Income_Statement", "Cash_Flow", "Balance_Sheet"].map((name) => [
      name,
      {
        currency_symbol: symbol === "SAP" ? "EUR" : "USD",
        yearly: {
          "2025-12-31": {
            date: "2025-12-31",
            filing_date: "2026-02-01",
            totalRevenue: "1200",
            netIncome: "150",
            operatingIncome: "200",
            totalCashFromOperatingActivities: "300",
            capitalExpenditures: "-50",
            stockBasedCompensation: "20",
            totalAssets: "1000",
            totalLiab: "400",
            totalStockholderEquity: "600",
            shortLongTermDebtTotal: "100",
            cash: "200",
            commonStockSharesOutstanding: "100",
          },
        },
      },
    ]),
  ),
  Valuation: { TrailingPE: 20, ForwardPE: 18 },
  Highlights: { MarketCapitalization: 2000 },
  AnalystRatings: { Buy: 8, Hold: 2, TargetPrice: 21 },
  Earnings: {
    History: {
      next: {
        date: "2099-01-01",
        reportDate: "2099-02-01",
        epsActual: 2,
        epsEstimate: 1.5,
      },
    },
    Trend: {},
  },
  Holders: {
    Institutions: {
      one: {
        name: "Example fund",
        date: "2026-06-30",
        currentShares: 20,
        totalShares: 2,
      },
    },
  },
});
globalThis.fetch = async (input) => {
  const u = new URL(String(input));
  calls.push(u);
  if (u.pathname === "/auth/v1/user")
    return Response.json({
      id: "00000000-0000-4000-8000-000000000001",
      email_confirmed_at: "2026-01-01",
    });
  if (u.hostname === "api.twelvedata.com") {
    const symbol = u.searchParams.get("symbol");
    if (u.pathname === "/profile")
      return Response.json({
        symbol: u.searchParams.get("symbol"),
        name: "Fallback company",
        sector: "Technology",
        industry: "Software",
        exchange: "NASDAQ",
        currency: "USD",
        country: "United States",
      });
    if (u.pathname === "/symbol_search")
      return Response.json({
        data: [
          {
            symbol: "CRM",
            instrument_name: "Salesforce",
            exchange: "NYSE",
            currency: "USD",
            country: "United States",
            instrument_type: "Common Stock",
          },
        ],
      });
    if (u.pathname === "/quote")
      return Response.json({
        symbol,
        name: symbol,
        exchange: "NYSE",
        currency: "USD",
        close: "200",
        percent_change: "1.2",
        timestamp: Math.floor(Date.now() / 1000),
      });
    if (u.pathname === "/time_series")
      return Response.json({
        meta: { symbol },
        values: [
          {
            datetime: "2026-10-16 15:00:00",
            open: "200",
            high: "203",
            low: "199",
            close: "202",
            volume: "40",
          },
        ],
      });
  }
  if (u.hostname === "eodhd.com") {
    if(u.pathname==='/api/screener') return Response.json({data:[{code:'PEERBASE',name:'Base company',exchange:'US',industry:'Software',sector:'Technology',market_capitalization:1000000000},{code:'PEERONE',name:'Peer one',exchange:'US',industry:'Software',sector:'Technology',market_capitalization:900000000}]});
    if(u.pathname.includes('/sec-companies/')&&u.pathname.endsWith('/segments')) {
      if(u.pathname.includes('/DENIED.')) return new Response('',{status:403});
      return Response.json({data:[{axis:'ProductOrService',member:'Services',concept:'Revenue',value:1000000,unit:'USD',period_end:'2025-12-31'}]});
    }

    if (u.pathname === "/api/calendar/earnings")
      return Response.json({
        earnings: [
          {
            code: "HIMS.US",
            report_date: new Date(Date.now() + 2 * 86400000)
              .toISOString()
              .slice(0, 10),
            date: "2026-06-30",
            before_after_market: "AfterMarket",
          },
        ],
      });
    if (u.pathname === "/api/calendar/splits")
      return Response.json({
        splits: [
          {
            code: "HIMS.US",
            split_date: new Date(Date.now() + 3 * 86400000)
              .toISOString()
              .slice(0, 10),
            old_shares: 1,
            new_shares: 2,
          },
        ],
      });

    assert.equal(u.searchParams.get("api_token"), "test-eodhd");
    if (u.pathname.startsWith("/api/v1.1/fundamentals/")) {
      const symbol = u.pathname.split("/").at(-1).replace(/\.US$/, "");
      if (["LEGACY", "FALLBACK"].includes(symbol))
        return new Response("", { status: 403 });
      const data = financial(symbol);
      return Response.json(u.searchParams.has("filter") ? data.General : data);
    }
    if (u.pathname.startsWith("/api/fundamentals/")) {
      const symbol = u.pathname.split("/").at(-1).replace(/\.US$/, "");
      if (symbol === "FALLBACK") return new Response("", { status: 403 });
      const data = financial(symbol);
      data.Earnings.Trend = {
        "2027-12-31": {
          date: "2027-12-31",
          period: "+1y",
          earningsEstimateAvg: "8",
          earningsEstimateLow: "6",
          earningsEstimateHigh: "10",
        },
      };
      return Response.json(u.searchParams.has("filter") ? data.General : data);
    }
    if (u.pathname.startsWith("/api/eod/"))
      return Response.json([
        {
          date: "2026-10-01",
          open: 400,
          high: 440,
          low: 380,
          close: 420,
          volume: 100,
        },
        {
          date: "2026-10-16",
          open: 100,
          high: 110,
          low: 95,
          close: 105,
          volume: 100,
        },
      ]);
    if (u.pathname.startsWith("/api/splits/"))
      return Response.json([{ date: "2026-10-08", split: "4/1" }]);
    if (u.pathname.startsWith("/api/div/"))
      return Response.json([{ date: "2026-10-01", value: 0.5 }]);
    if (u.pathname === "/api/real-time/HIMS.US") return new Response("", {status:503});
    if (u.pathname.startsWith("/api/intraday/")) return Response.json([{datetime:new Date(Date.now()-600000).toISOString().slice(0,19).replace("T"," "),timestamp:Math.floor(Date.now()/1000)-600,open:100,high:110,low:95,close:105,volume:100}]);
    if (u.pathname.startsWith("/api/real-time/"))
      return Response.json({
        code: u.pathname.split("/").at(-1),
        close: 105,
        timestamp: Math.floor(Date.now() / 1000) - 30,
        change_p: 0,
      });
    if (u.pathname === "/api/search/CRM")
      return new Response("", { status: 403 });
    if (u.pathname.startsWith("/api/search/"))
      return Response.json([
        {
          Code: "SAP",
          Name: "SAP SE",
          Exchange: "US",
          Currency: "USD",
          Type: "Common Stock",
        },
        {
          Code: "SAP",
          Name: "Wrong currency",
          Exchange: "XETRA",
          Currency: "EUR",
          Type: "Common Stock",
        },
        {
          Code: "BTC",
          Name: "Bitcoin ETF",
          Exchange: "US",
          Currency: "USD",
          Type: "ETF",
        },
        {
          Code: "ETH-USD",
          Name: "Ethereum",
          Exchange: "CC",
          Currency: "USD",
          Type: "Crypto",
        },
      ]);
    if (u.pathname === "/api/news")
      return Response.json([
        {
          date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
          title: "Reported event",
          link: "https://example.com/report",
        },
        { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), title: "Unsafe", link: "javascript:alert(1)" },
        {
          date: "2099-01-01",
          title: "Future",
          link: "https://example.com/future",
        },
      ]);
    if (u.pathname.startsWith("/api/sec-filings/"))
      return Response.json({
        data: [
          {
            accession_number: "0000320193-26-000001",
            filed_at: "2026-02-01",
            item_sections: [{ title: "Results of operations" }],
          },
        ],
      });
  }
  throw Error("Unexpected target " + u.hostname + u.pathname);
};
const get = (path, query = "", symbol = "APP") =>
  load(path).GET(
    new Request("https://test.invalid/api/test" + query, { headers }),
    { params: Promise.resolve({ symbol }) },
  );
async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, passed: true });
  } catch (e) {
    checks.push({ name, passed: false, error: e.message });
  }
}
await check(
  "settings detect both providers without exposing credentials",
  async () => {
    const r = await get("provider-status"),
      d = await r.json();
    assert.equal(d.marketProvider, "hybrid");
    assert.equal(d.configured, true);
    assert.doesNotMatch(JSON.stringify(d), /test-eodhd|test-twelve/);
  },
);
await check(
  "research uses EODHD quote, financials and one intact split-adjusted history",
  async () => {
    const r = await get("research/[symbol]"),
      d = await r.json();
    assert.equal(r.status, 200);
    assert.match(d.quote.source, /EODHD/);
    assert.equal(d.quote.price, 105);
    assert.equal(d.historySource, "EODHD");
    assert.equal(d.history[0].close, 105);
    assert.equal(d.history[0].volume, 100);
    assert.equal(d.facts.find((x) => x.metric === "revenue").value, 1200);
    assert.equal(d.evidence.consensus.buy, 8);
    assert.equal(d.evidence.earnings[0].actual, null);
    assert.equal(calls.filter(x=>x.pathname === "/api/real-time/APP.US").length,1);
    assert.ok(!calls.some(x=>x.hostname==="api.twelvedata.com"&&x.pathname==="/quote"&&x.searchParams.get("symbol")==="APP"));
    assert.ok(
      !calls.some(
        (x) =>
          x.hostname === "api.twelvedata.com" &&
          x.searchParams.get("interval") === "1day",
      ),
    );
  },
);
await check(
  "1D charts use EODHD intraday and identify their own source",
  async () => {
    const r = await get("chart/[symbol]", "?range=1D"),
      d = await r.json();
    assert.equal(r.status, 200);
    assert.equal(d.source, "EODHD");
    assert.equal(d.candles[0].close, 105);
    assert.ok(calls.some((x) => x.pathname.startsWith("/api/intraday/")));
  },
);
await check(
  "EODHD quote failure falls back once to a clearly labelled Twelve quote",
  async () => {
    const r = await get("quotes", "?symbols=HIMS"),
      d = await r.json();
    assert.equal(d.HIMS.quote.price, 200);
    assert.match(d.HIMS.quote.source, /Twelve Data.*fallback/);
    assert.equal(calls.filter(x=>x.pathname==="/api/real-time/HIMS.US").length,1);
  },
);
await check("repeated quotes reuse cached results", async () => {
  const before = calls.filter(
    (x) => x.hostname !== "account.example.invalid",
  ).length;
  await get("quotes", "?symbols=HIMS,APP");
  assert.equal(
    calls.filter((x) => x.hostname !== "account.example.invalid").length,
    before,
  );
});
await check(
  "ETH resolves to crypto before same-name funds and SAP stays USD listing",
  async () => {
    const d = await (await get("search", "?q=ETH")).json();
    assert.equal(d.results[0].symbol, "ETH/USD");
    assert.equal(d.results.find((x) => x.symbol === "SAP").currency, "USD");
    assert.ok(!d.results.some((x) => x.exchange === "XETRA"));
  },
);
await check(
  "crypto research has crypto price/history and no corporate financial request",
  async () => {
    const d = await (await get("research/[symbol]", "", "ETH-USD")).json();
    assert.equal(d.company.symbol, "ETH/USD");
    assert.equal(d.company.assetType, "crypto");
    assert.equal(d.facts.length, 0);
    assert.ok(calls.some((x) => x.pathname === "/api/eod/ETH-USD.CC"));
    assert.ok(!calls.some((x) => x.pathname.includes("fundamentals/ETH-USD")));
  },
);
await check(
  "SAP retains EUR statements separately from the USD quote",
  async () => {
    const d = await (await get("research/[symbol]", "", "SAP")).json();
    assert.equal(d.quote.currency, "USD");
    assert.equal(d.facts.find((x) => x.metric === "revenue").currency, "EUR");
    assert.equal(d.company.foreignListing, true);
  },
);
await check("headlines reject unsafe and future links", async () => {
  const d = await (await get("news", "?symbol=APP")).json();
  assert.equal(d.items.length, 1);
  assert.equal(d.items[0].url, "https://example.com/report");
});
await check(
  "filings use validated SEC links and corporate actions are available",
  async () => {
    const d = await (await get("filings", "?symbol=APP")).json();
    assert.equal(d.filings.length, 3);
    assert.ok(
      d.filings.every((f) => f.url.startsWith("https://www.sec.gov/Archives/")),
    );
    const actions = await (
      await get("company-data", "?symbol=APP&dataset=dividends")
    ).json();
    assert.equal(actions.dividends[0].amount, 0.5);
  },
);
await check(
  "version-specific access denial retries the legacy whole fundamental payload",
  async () => {
    const d = await (await get("research/[symbol]", "", "LEGACY")).json();
    assert(
      d.facts.length > 0,
      "authorized legacy fundamentals must reach research",
    );
    assert.equal(d.evidence.estimates[0].frequency, "Annual");
    assert.equal(d.evidence.estimates[0].currency, "USD");
    assert(calls.some((x) => x.pathname === "/api/fundamentals/LEGACY.US"));
  },
);
await check(
  "CRM search survives an EODHD failure through configured Twelve Data and caches its result",
  async () => {
    const d = await (await get("search", "?q=CRM")).json();
    assert.equal(d.results?.[0]?.symbol, "CRM");
    assert.equal(d.results[0].name, "Salesforce");
    const before = calls.length;
    await get("search", "?q=CRM");
    assert.equal(
      calls.filter(
        (x) => x.hostname === "eodhd.com" && x.pathname === "/api/search/CRM",
      ).length,
      1,
    );
  },
);
await check(
  "fundamentals outage preserves the available Twelve Data company profile",
  async () => {
    const d = await (await get("research/[symbol]", "", "FALLBACK")).json();
    assert.equal(d.company.name, "Fallback company");
    assert.equal(d.company.sector, "Technology");
    assert.equal(d.quote.price, 105);
    assert(d.issues.length > 0);
    assert.equal(d.evidence, undefined);
  },
);
await check(
  "home feed separates report dates, filters news and bounds coverage",
  async () => {
    const r = await get("home-feed", "?symbols=HIMS,CRM,APP,MSFT");
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.events.length, 2);
    assert.equal(d.news.length, 1);
    assert.equal(d.newsFollowed, 4);
    assert(calls.some(x=>x.pathname==='/api/news'&&x.searchParams.get('s')==='MSFT.US'));
    const calendar = calls.filter((x) =>
      x.pathname.startsWith("/api/calendar/"),
    );
    assert.equal(calendar.length, 2);
    assert(
      calendar.every(
        (x) => x.searchParams.has("from") && x.searchParams.has("to"),
      ),
    );
  },
);
await check("Home calendar and news can load independently",async()=>{
 const newsCalls=()=>calls.filter(x=>x.pathname==='/api/news').length;
 const calendarCalls=()=>calls.filter(x=>x.pathname.startsWith('/api/calendar/')).length;
 const beforeNews=newsCalls();const events=await get('home-feed','?kind=events&symbols=NVDA,IBM');assert.equal(events.status,200);assert.equal((await events.json()).newsFollowed,0);assert.equal(newsCalls(),beforeNews);
 const beforeCalendar=calendarCalls();const news=await get('home-feed','?kind=news&symbols=NFLX');assert.equal(news.status,200);assert.equal((await news.json()).newsFollowed,1);assert.equal(calendarCalls(),beforeCalendar);
});
await check("repeated home feed reuses provider cache", async () => {
  const count = () => calls.filter((x) => x.hostname === "eodhd.com").length;
  const before = count();
  await get("home-feed", "?symbols=HIMS,CRM,APP,MSFT");
  assert.equal(count(), before);
});
await check(
  "home feed rejects crypto pairs without provider calls",
  async () => {
    const before = calls.filter((x) => x.hostname === "eodhd.com").length;
    const r = await get("home-feed", "?symbols=ETH/USD");
    assert.equal(r.status, 400);
    assert.equal(
      calls.filter((x) => x.hostname === "eodhd.com").length,
      before,
    );
  },
);

await check('research context rejects unauthenticated access',async()=>{const r=await load('research-context/[symbol]').GET(new Request('https://test.invalid/api/research-context/APP?kind=peers'),{params:Promise.resolve({symbol:'APP'})});assert.equal(r.status,401);});
await check('peer discovery uses bounded industry candidates and cache',async()=>{const r=await get('research-context/[symbol]','?kind=peers','PEERBASE'),d=await r.json();assert.equal(r.status,200);assert.equal(d.candidates[0].symbol,'PEERONE');assert.equal(d.field,'industry');const before=calls.filter(x=>x.pathname==='/api/screener').length;await get('research-context/[symbol]','?kind=peers','PEERBASE');assert.equal(calls.filter(x=>x.pathname==='/api/screener').length,before);});
await check('segments normalize the documented response',async()=>{const r=await get('research-context/[symbol]','?kind=segments','APP'),d=await r.json();assert.equal(r.status,200);assert.equal(d.rows[0].value,1000000);assert.equal(d.rows[0].unit,'USD');});
await check('segments fail closed on denied entitlement',async()=>{const r=await get('research-context/[symbol]','?kind=segments','DENIED');assert.equal(r.status,503);});
await check('corporate context rejects crypto without provider calls',async()=>{const before=calls.length,r=await get('research-context/[symbol]','?kind=segments','ETH-USD');assert.equal(r.status,400);assert.equal(calls.filter(x=>x.hostname==='eodhd.com').slice(-1)[0]?.pathname.includes('ETH'),false);});
console.log(
  JSON.stringify(
    {
      checks,
      passed: checks.filter((x) => x.passed).length,
      total: checks.length,
    },
    null,
    2,
  ),
);
if (checks.some((x) => !x.passed)) process.exitCode = 1;
