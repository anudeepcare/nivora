import test from "node:test";
import assert from "node:assert/strict";
import { overviewEvidence } from "../lib/overview-evidence.ts";
import { demoData } from "./fixtures/demo.ts";

test("overview groups actual financial, price, technical and ownership observations without invented zeros", () => {
  const r = structuredClone(demoData.research.MSFT);
  const result = overviewEvidence(r);
  assert.ok(result.business.some((x) => x.key === "revenue"));
  assert.ok(result.technical.some((x) => x.key === "rsi"));
  for (const row of [
    ...result.business,
    ...result.valuation,
    ...result.technical,
    ...result.ownership,
  ]) {
    assert.ok(Number.isFinite(row.value));
    assert.ok(row.help.length > 10);
    assert.ok(row.unit);
  }
  r.facts = [];
  r.evidence = undefined;
  const missing = overviewEvidence(r);
  assert.equal(missing.business.length, 0);
  assert.equal(missing.ownership.length, 0);
});

test("zero ownership remains visible, negative cash flow is risk and unsupported multiples are omitted", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = {
    ...r.evidence,
    ownership: { institutions: 0, insiders: null, float: null },
    multiples: { ForwardPE: -1, EnterpriseValueRevenue: NaN },
  };
  r.facts = r.facts.map((f) =>
    f.metric === "operatingCashFlow" ? { ...f, value: -Math.abs(f.value) } : f,
  );
  const d = overviewEvidence(r);
  assert.equal(d.ownership.find((x) => x.key === "institutions").value, 0);
  assert.equal(d.business.find((x) => x.key === "fcf").tone, "risk");
  assert.equal(
    d.valuation.some((x) => x.key === "ForwardPE"),
    false,
  );
});

test("crypto and banks do not inherit operating-company FCF interpretation", () => {
  const r = structuredClone(demoData.research.MSFT);
  r.company.assetType = "crypto";
  assert.equal(overviewEvidence(r).business.length, 0);
  assert.equal(overviewEvidence(r).valuation.length, 0);
  r.company.assetType = "stock";
  r.company.symbol = "BANK";
  r.company.sector = "Financial Services";
  r.evidence = {
    ...r.evidence,
    profile: {
      ...r.evidence?.profile,
      sector: "Financial Services",
      industry: "Banks - Regional",
    },
  };
  assert.equal(
    overviewEvidence(r).business.some((x) => x.key === "fcf"),
    false,
  );
});

function operatingResearch() {
  const r = structuredClone(demoData.research.MSFT);
  r.facts = [2024, 2025].flatMap((year) => {
    const current = year === 2025;
    const values = {
      revenue: current ? 120 : 100,
      operatingIncome: current ? 30 : 20,
      netIncome: current ? 24 : 10,
      grossProfit: current ? 84 : 60,
      operatingCashFlow: current ? 36 : 30,
      capex: current ? -12 : -10,
      stockCompensation: current ? 6 : 5,
      interestExpense: current ? 5 : 4,
      weightedShares: current ? 12 : 10,
      cash: current ? 30 : 20,
      debt: 50,
      equity: current ? 80 : 40,
      assets: current ? 140 : 100,
      currentAssets: current ? 40 : 30,
      currentLiabilities: current ? 20 : 10,
    };
    return Object.entries(values).map(([metric, value]) => {
      const instant = [
        "cash",
        "debt",
        "equity",
        "assets",
        "currentAssets",
        "currentLiabilities",
      ].includes(metric);
      return {
        id: `${year}:${metric}`,
        metric,
        value,
        unit: metric === "weightedShares" ? "shares" : "USD",
        currency: metric === "weightedShares" ? null : "USD",
        start: instant ? null : `${year}-01-01`,
        end: `${year}-12-31`,
        filed: `${year + 1}-02-01`,
        accession: `annual-${year}`,
        form: "10-K",
        sourceUrl: `https://example.com/report-${year}`,
        basis: "GAAP",
        scope: instant ? "instant" : "annual",
      };
    });
  });
  return r;
}
const businessMetrics = (r) =>
  Object.fromEntries(overviewEvidence(r).business.map((row) => [row.key, row]));

test("operating overview calculates comparable growth, diluted per-share cash and reported funding ratios", () => {
  const rows = businessMetrics(operatingResearch());
  for (const [key, value] of Object.entries({
    revenueGrowth: 20,
    operatingCashFlow: 36,
    capex: 12,
    fcfPerShare: 2,
    netDebt: 20,
    interestCoverage: 6,
    currentRatio: 2,
    sbcRevenue: 5,
    dilutedShareGrowth: 20,
    cashConversion: 150,
    roe: 40,
    roa: 20,
  })) {
    assert.ok(rows[key], key);
    assert.ok(
      Math.abs(rows[key].value - value) < 1e-9,
      `${key}: ${rows[key].value}`,
    );
  }
  assert.match(rows.fcfPerShare.label, /diluted/i);
  assert.match(rows.fcfPerShare.help, /weighted|average/i);
  assert.equal(rows.fcfPerShare.currency, "USD");
  assert.equal(rows.capex.tone, "neutral");
  assert.equal(rows.dilutedShareGrowth.tone, "caution");
  assert.equal(rows.revenueGrowth.tone, "positive");
  assert.equal(rows.roe.period, "2025-12-31");
  assert.equal(rows.roe.basis, "GAAP");
  assert.ok(rows.roe.sourceUrls.includes("https://example.com/report-2024"));
  assert.ok(rows.roe.sourceUrls.includes("https://example.com/report-2025"));
  assert.match(rows.roe.help, /2025-01-01.*2025-12-31/);
  assert.equal(rows.revenue.sourceUrl, "https://example.com/report-2025");
});

test("operating runway measures historical operating cash burn in months without treating capex alone as burn", () => {
  const r = operatingResearch();
  assert.equal(businessMetrics(r).operatingRunway, undefined);
  const investment = structuredClone(r);
  investment.facts = investment.facts.map((f) =>
    f.end === "2025-12-31" && f.metric === "capex" ? { ...f, value: 60 } : f,
  );
  assert.equal(businessMetrics(investment).operatingRunway, undefined);
  assert.equal(businessMetrics(investment).fcf.tone, "risk");
  r.facts = r.facts.map((f) =>
    f.end === "2025-12-31" && f.metric === "operatingCashFlow"
      ? { ...f, value: -24 }
      : f,
  );
  const rows = businessMetrics(r);
  assert.ok(rows.operatingRunway);
  assert.ok(Math.abs(rows.operatingRunway.value - 14.989733059548255) < 1e-9);
  assert.match(rows.operatingRunway.label, /months/i);
  assert.match(rows.operatingRunway.help, /historical|forecast/i);
  assert.equal(rows.operatingCashFlow.tone, "risk");
  assert.equal(rows.fcfPerShare.tone, "risk");
  assert.equal(rows.operatingRunway.tone, "caution");
});

test("returns need positive beginning and ending balances and a comparable prior period", () => {
  for (const change of [
    (r) => (r.facts = r.facts.filter((f) => f.end !== "2024-12-31")),
    (r) =>
      (r.facts = r.facts.map((f) =>
        f.end === "2024-12-31" ? { ...f, basis: "IFRS" } : f,
      )),
    (r) =>
      (r.facts = r.facts.map((f) =>
        f.end === "2024-12-31" && ["assets", "equity"].includes(f.metric)
          ? { ...f, value: 0 }
          : f,
      )),
    (r) =>
      (r.facts = r.facts.map((f) =>
        f.end === "2025-12-31" && ["assets", "equity"].includes(f.metric)
          ? { ...f, value: -1 }
          : f,
      )),
  ]) {
    const r = operatingResearch();
    change(r);
    const rows = businessMetrics(r);
    assert.equal(rows.roe, undefined);
    assert.equal(rows.roa, undefined);
  }
  const r = operatingResearch();
  r.facts = r.facts.map((f) =>
    f.end === "2025-12-31" && f.metric === "netIncome"
      ? { ...f, value: -24 }
      : f,
  );
  const rows = businessMetrics(r);
  assert.ok(rows.roe);
  assert.equal(rows.roe.value, -40);
  assert.equal(rows.roe.tone, "risk");
  assert.equal(rows.roa.value, -20);
});

test("banks show book returns without generic operating funding metrics or invented regulatory capital", () => {
  const r = operatingResearch();
  r.company.symbol = "BANK";
  r.company.sector = "Financial Services";
  r.evidence = {
    profile: { sector: "Financial Services", industry: "Banks - Regional" },
    reportingCurrency: "USD",
  };
  const rows = businessMetrics(r);
  assert.ok(rows.roe);
  assert.ok(rows.roa);
  assert.equal(rows.roe.value, 40);
  assert.equal(rows.roa.value, 20);
  assert.match(rows.roe.help, /regulatory|credit|tangible/i);
  for (const key of [
    "fcf",
    "fcfPerShare",
    "netDebt",
    "interestCoverage",
    "currentRatio",
    "operatingRunway",
    "roic",
    "ffo",
    "cet1",
  ])
    assert.equal(rows[key], undefined, key);
});

test("net cash is not painted as debt risk and negative earnings coverage remains risk", () => {
  const r = operatingResearch();
  r.facts = r.facts.map((f) =>
    f.end !== "2025-12-31"
      ? f
      : f.metric === "cash"
        ? { ...f, value: 70 }
        : f.metric === "operatingIncome"
          ? { ...f, value: -30 }
          : f,
  );
  const rows = businessMetrics(r);
  assert.equal(rows.netDebt.value, -20);
  assert.equal(rows.netDebt.tone, "positive");
  assert.equal(rows.interestCoverage.value, -6);
  assert.equal(rows.interestCoverage.tone, "risk");
});
