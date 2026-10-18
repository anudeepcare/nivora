import test from "node:test";
import assert from "node:assert/strict";
import { financialPeriods } from "../lib/engine.ts";
const module = await import("../lib/eodhd-normalize.ts").catch(() => null);
function lib() {
  assert.ok(module, "EODHD normalization must exist");
  return module;
}
const stamp = "2026-10-17T12:00:00Z";
const raw = {
  General: {
    Code: "APP",
    Exchange: "NASDAQ",
    CurrencyCode: "USD",
    CountryISO: "US",
    Name: "AppLovin",
    UpdatedAt: "2026-10-16",
  },
  Financials: {
    Income_Statement: {
      currency_symbol: "USD",
      quarterly: {
        "2026-06-30": {
          date: "2026-06-30",
          filing_date: "2026-08-10",
          totalRevenue: "100",
          netIncome: "0",
          grossProfit: "75",
          operatingIncome: "30",
        },
      },
    },
    Cash_Flow: {
      currency_symbol: "USD",
      quarterly: {
        "2026-06-30": {
          date: "2026-06-30",
          filing_date: "2026-08-10",
          totalCashFromOperatingActivities: "40",
          capitalExpenditures: "-10",
          stockBasedCompensation: "5",
        },
      },
    },
    Balance_Sheet: {
      currency_symbol: "USD",
      quarterly: {
        "2026-06-30": {
          date: "2026-06-30",
          filing_date: "2026-08-10",
          cash: "80",
          shortLongTermDebtTotal: "0",
          totalAssets: "300",
          totalLiab: "100",
          commonStockSharesOutstanding: "20",
        },
      },
    },
  },
  Earnings: {
    History: {
      q: {
        date: "2026-09-30",
        reportDate: "2026-11-05",
        epsActual: 99,
        epsEstimate: 1.2,
      },
    },
    Trend: {
      Annual: {
        y: {
          date: "2027-12-31",
          period: "+1y",
          currency: "USD",
          revenueEstimateAvg: "600",
          earningsEstimateAvg: "8",
        },
      },
    },
  },
};
test("EOD identity keeps crypto separate from same-code ETFs and rejects wrong fundamentals", () => {
  const m = lib();
  assert.equal(m.eodTicker("ETH/USD"), "ETH-USD.CC");
  assert.equal(m.eodTicker("SAP"), "SAP.US");
  assert.equal(m.eodTicker("BRK.B"), "BRK-B.US");
  assert.throws(
    () => m.normalizeEodFundamentals("HIMS", raw, stamp),
    /instrument/i,
  );
});
test("EOD financials preserve zero, compatible currency and positive spending", () => {
  const { facts } = lib().normalizeEodFundamentals("APP", raw, stamp);
  const rows = financialPeriods(facts, "quarterly", stamp);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].revenue, 100);
  assert.equal(rows[0].netIncome, 0);
  assert.equal(rows[0].fcf, 30);
  assert.equal(rows[0].cash, 80);
  assert.equal(rows[0].debt, 0);
  assert.equal(rows[0].basis, "Provider");
  assert.equal(facts.find((x) => x.metric === "shares").unit, "shares");
});
test("EOD does not expose future actual earnings or fabricate missing financial fields", () => {
  const d = lib().normalizeEodFundamentals("APP", raw, stamp);
  assert.equal(d.evidence.earnings[0].actual, null);
  assert.equal(d.evidence.estimates[0].revenue, 600);
  assert.equal(
    d.facts.some((f) => f.metric === "eps"),
    false,
  );
  assert.equal(
    d.facts.some((f) => f.metric === "buybacks"),
    false,
  );
});
test("EOD split adjustment applies to all OHLC values without double adjusting volume", () => {
  const rows = lib().normalizeEodBars(
    [
      {
        date: "2020-08-28",
        open: 400,
        high: 420,
        low: 380,
        close: 400,
        volume: 1000,
      },
      {
        date: "2020-08-31",
        open: 100,
        high: 105,
        low: 95,
        close: 100,
        volume: 1200,
      },
    ],
    false,
    [{ date: "2020-08-31", split: "4/1" }],
    stamp,
  );
  assert.equal(rows[0].close, 100);
  assert.equal(rows[0].high, 105);
  assert.equal(rows[0].volume, 1000);
  assert.equal(rows[1].close, 100);
});
test("EOD quotes retain provider time and refuse instrument substitution", () => {
  const m = lib();
  const now = Date.parse(stamp);
  const q = m.normalizeEodQuote(
    "ETH/USD",
    {
      code: "ETH-USD.CC",
      timestamp: now / 1000 - 60,
      close: "2000",
      change_p: "2",
    },
    now,
  );
  assert.equal(q.price, 2000);
  assert.equal(q.currency, "USD");
  assert.match(q.source, /EODHD/);
  assert.throws(
    () => m.normalizeEodQuote("ETH/USD", { code: "ETH.US", close: 20 }, now),
    /instrument/i,
  );
  assert.equal(
    m.normalizeEodQuote("APP", { code: "APP.US", close: "NA" }, now).price,
    null,
  );
});
test("EOD search excludes foreign currency collisions and keeps USD crypto", () => {
  const rows = lib().normalizeEodSearch([
    {
      Code: "SAP",
      Exchange: "XETRA",
      Currency: "EUR",
      Type: "Common Stock",
      Name: "SAP Germany",
    },
    {
      Code: "SAP",
      Exchange: "US",
      Currency: "USD",
      Type: "Common Stock",
      Name: "SAP ADR",
    },
    {
      Code: "ETH-USD",
      Exchange: "CC",
      Currency: "USD",
      Type: "Crypto",
      Name: "Ethereum",
    },
  ]);
  assert.deepEqual(
    rows.map((x) => x.symbol),
    ["SAP", "ETH/USD"],
  );
});
const { evidenceFor } = await import("../lib/report.ts");
test("AI evidence accepts normalized EODHD financial records without accepting arbitrary source URLs", () => {
  const facts = lib().normalizeEodFundamentals("APP", raw, stamp).facts;
  const r = { facts, retrievedAt: stamp };
  assert.ok(
    evidenceFor(r).length > 0,
    "Provider financials must reach the evidence analyst",
  );
  assert.equal(
    evidenceFor({
      ...r,
      facts: facts.map((f) => ({
        ...f,
        sourceUrl: "https://untrusted.example/claim",
      })),
    }).length,
    0,
  );
});

test("EOD annual forecasts inherit reported statement currency when the trend omits it", () => {
  const input = structuredClone(raw);
  input.Earnings.Trend.Annual.y = {
    date: "2027-12-31",
    period: "+1y",
    earningsEstimateAvg: "8",
    earningsEstimateLow: "6",
    earningsEstimateHigh: "10",
  };
  const { evidence } = lib().normalizeEodFundamentals("APP", input, stamp);
  assert.equal(evidence.estimates[0].currency, "USD");
  input.Financials.Income_Statement.currency_symbol = "EUR";
  assert.equal(
    lib().normalizeEodFundamentals("APP", input, stamp).evidence.estimates[0]
      .currency,
    "EUR",
  );
  delete input.Financials.Income_Statement.currency_symbol;
  assert.equal(
    lib().normalizeEodFundamentals("APP", input, stamp).evidence.estimates[0]
      .currency,
    null,
  );
});

test('additional accounting fields reuse normalized fundamentals with currency and period evidence',()=>{
 const input=structuredClone(raw);
 input.Financials.Cash_Flow.quarterly['2026-06-30'].depreciation='8';
 input.Financials.Balance_Sheet={currency_symbol:'USD',quarterly:{'2026-06-30':{date:'2026-06-30',filing_date:'2026-08-10',netReceivables:'12',inventory:'3',accountsPayable:'5',retainedEarnings:'-2'}}};
 const {facts}=lib().normalizeEodFundamentals('APP',input,stamp);
 for(const [metric,value] of Object.entries({depreciation:8,receivables:12,inventory:3,payables:5,retainedEarnings:-2})){
  const fact=facts.find(f=>f.metric===metric);assert.ok(fact,metric);assert.equal(fact.value,value);assert.equal(fact.unit,'USD');assert.equal(fact.end,'2026-06-30');
 }
});
