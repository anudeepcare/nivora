import test from "node:test";
import assert from "node:assert/strict";
import { modelCoverage } from "../lib/research-depth.ts";
import { normalizeEodFundamentals } from "../lib/eodhd-normalize.ts";

test("provider bank industries route arbitrary symbols to bank economics", () => {
  for (const [symbol, industry] of [
    ["USB", "Banks - Regional"],
    ["PNC", "Banks - Diversified"],
    ["TESTBANK", "regional banks"],
    ["OTHERBANK", "Savings & Cooperative Banks"],
  ]) {
    const coverage = modelCoverage(symbol, "stock", {
      sector: "Financial Services",
      industry,
    });
    assert.equal(coverage.family, "financial", symbol);
    assert.equal(coverage.classificationSource, "provider-profile");
    assert.match(coverage.method, /bank valuation anchor/);
  }
});

test("normalized provider profile preserves the classification used for REIT routing", () => {
  const { company, evidence } = normalizeEodFundamentals(
    "O",
    {
      General: {
        Code: "O",
        CurrencyCode: "USD",
        CountryISO: "US",
        Sector: "Real Estate",
        Industry: "REIT - Retail",
      },
    },
    "2026-10-17",
  );
  const coverage = modelCoverage(
    company.symbol,
    company.assetType,
    evidence.profile,
  );
  assert.equal(coverage.family, "real-estate");
  assert.match(coverage.method, /property|REIT/i);
  assert.match(coverage.method, /not available|not established|not suitable/i);
});

test("insurance industries never inherit a bank calculator or generic DCF", () => {
  for (const [sector, industry] of [
    ["Financial Services", "Insurance - Life"],
    ["Financial Services", "Insurance - Property & Casualty"],
    ["Healthcare", "Healthcare Plans"],
    ["Health Care", "Health Care Plans"],
  ]) {
    const coverage = modelCoverage("UNLISTED", "stock", { sector, industry });
    assert.equal(coverage.family, "insurance", industry);
    assert.match(coverage.method, /insurance/i);
    assert.match(
      coverage.method,
      /not available|not established|not suitable/i,
    );
  }
});

test("financial and real estate sectors with incomplete industry data use conservative guards", () => {
  for (const sector of ["Financial Services", "Financials", "Finance"]) {
    const coverage = modelCoverage("UNLISTED", "stock", { sector });
    assert.equal(coverage.family, "specialized-financial", sector);
    assert.match(
      coverage.method,
      /not available|not established|not suitable/i,
    );
  }
  assert.equal(
    modelCoverage("UNLISTED", "stock", { sector: "Real Estate" }).family,
    "real-estate",
  );
});

test("nonbank financial industries do not get a bank scenario even for legacy symbols", () => {
  for (const industry of [
    "Asset Management",
    "Capital Markets",
    "Investment Banks/Brokers",
    "Credit Services",
    "Financial Data & Stock Exchanges",
    "Insurance Brokers",
    "Mortgage Finance",
  ]) {
    assert.equal(
      modelCoverage("GS", "stock", { industry }).family,
      "specialized-financial",
      industry,
    );
  }
});

test("classification tolerates provider punctuation and whitespace", () => {
  assert.equal(
    modelCoverage("UNLISTED", "stock", {
      sector: "  FINANCIAL SERVICES ",
      industry: " BANKS—REGIONAL ",
    }).family,
    "financial",
  );
  assert.equal(
    modelCoverage("UNLISTED", "stock", { industry: "Diversified REITs" })
      .family,
    "real-estate",
  );
});

test("ordinary provider sectors do not trigger unrelated specialty models", () => {
  for (const [sector, industry] of [
    ["Technology", "Software - Infrastructure"],
    ["Healthcare", "Biotechnology"],
    ["Industrials", "Aerospace & Defense"],
  ]) {
    const coverage = modelCoverage("UNLISTED", "stock", { sector, industry });
    assert.equal(coverage.family, "operating-company", industry);
    assert.equal(coverage.classificationSource, "provider-profile");
  }
});

test("explicit frontier and infrastructure exceptions retain priority over broad provider labels", () => {
  const profile = { sector: "Financial Services", industry: "Capital Markets" };
  for (const symbol of ["IREN", "CIFR", "CORZ", "CRWV", "NBIS"]) {
    const coverage = modelCoverage(symbol, "stock", profile);
    assert.equal(coverage.family, "infrastructure", symbol);
    assert.equal(coverage.classificationSource, "known-symbol");
  }
  for (const symbol of ["ASTS", "RKLB", "JOBY", "ACHR"])
    assert.equal(
      modelCoverage(symbol, "stock", profile).family,
      "frontier",
      symbol,
    );
  assert.equal(modelCoverage("BTC/USD", "crypto", profile).family, "crypto");
});

test("missing classification preserves compatibility but marks the fallback provisional", () => {
  for (const profile of [undefined, {}, { sector: "", industry: null }]) {
    const coverage = modelCoverage("UNLISTED", "stock", profile);
    assert.equal(coverage.family, "operating-company");
    assert.equal(coverage.classificationSource, "fallback");
    assert.match(coverage.method, /provisional|classification.*unavailable/i);
  }
  const legacy = modelCoverage("NU", "stock");
  assert.equal(legacy.family, "financial");
  assert.equal(legacy.classificationSource, "known-symbol");
});
