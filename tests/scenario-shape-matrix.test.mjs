import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEodFundamentals } from "../lib/eodhd-normalize.ts";
import { researchOutlook } from "../lib/outlook.ts";
const stamp = "2026-10-17T00:00:00Z";
// Synthetic normalization-to-model coverage, never a live ticker valuation claim.
for (const shape of ["nested-annual", "flat-fiscal", "flat-relative"])
  for (const pattern of ["complete", "missing-eps", "incomplete-nearer"])
    for (const business of [
      "software",
      "infrastructure",
      "bank",
      "insurance",
      "foreign-software",
    ]) {
      test(`scenario pipeline: ${shape}, ${pattern}, ${business}`, () => {
        const estimate = {
          date: "2028-12-31",
          period: shape === "flat-relative" ? "+2y" : "FY2028",
          currency: "USD",
          earningsEstimateLow: 6,
          earningsEstimateAvg: 8,
          earningsEstimateHigh: 10,
          revenueEstimateLow: 1e9,
          revenueEstimateAvg: 2e9,
          revenueEstimateHigh: 3e9,
        };
        if (pattern === "missing-eps") estimate.earningsEstimateLow = null;
        const rows = { "2028-12-31": estimate };
        if (pattern === "incomplete-nearer")
          rows["2029-10-17"] = {
            ...estimate,
            date: "2029-10-17",
            period: "FY2029",
            earningsEstimateLow: null,
            revenueEstimateLow: null,
          };
        const industry = {
          software: "Software - Application",
          infrastructure: "Data Centers",
          bank: "Banks - Diversified",
          insurance: "Healthcare Plans",
          "foreign-software": "Software - Application",
        }[business];
        const raw = {
          General: {
            Code: "QATEST",
            Name: "Synthetic company",
            Exchange: "NASDAQ",
            CurrencyCode: "USD",
            CountryISO: business === "foreign-software" ? "NL" : "US",
            UpdatedAt: "2026-10-16",
            Sector: business === "bank" ? "Financial Services" : "Technology",
            Industry: industry,
          },
          Highlights: { MarketCapitalization: 5e9, RevenueTTM: 1.06e9 },
          SharesStats: { SharesOutstanding: 1e8 },
          Valuation: {
            EnterpriseValueRevenue: 5,
            EnterpriseValue: 5.3e9,
            ForwardPE: 20,
          },
          Financials: {
            Income_Statement: { currency_symbol: "USD" },
            Balance_Sheet: {
              currency_symbol: "USD",
              quarterly: {
                "2026-06-30": {
                  date: "2026-06-30",
                  filing_date: "2026-08-01",
                  cashAndEquivalents: 2e8,
                  shortLongTermDebtTotal: 5e8,
                },
              },
            },
          },
          Earnings: {
            Trend: shape === "nested-annual" ? { Annual: rows } : rows,
          },
        };
        const normalized = normalizeEodFundamentals("QATEST", raw, stamp);
        const r = {
          ...normalized,
          quote: {
            price: 50,
            currency: "USD",
            stale: false,
            asOf: "2026-10-16",
          },
          history: [],
          retrievedAt: stamp,
        };
        const expected =
          business !== "insurance" &&
          !(business === "bank" && pattern === "missing-eps");
        const shareDependent =
          business === "infrastructure" ||
          business === "foreign-software" ||
          (business === "software" && pattern === "missing-eps");
        // A dataset update date is not a cap/share observation date. The normalized
        // fixture must retain that missing provenance instead of inventing a bridge.
        assert.equal(normalized.evidence.listingObservations, undefined);
        assert.equal(researchOutlook(r).available, expected && !shareDependent);
        // This synthetic extension describes economic observations at the quote's
        // date to test the downstream model. It is not an actual vendor payload.
        r.evidence.listingObservations = {
          marketCap: {
            asOf: "2026-10-16",
            currency: "USD",
            shareBasis: "QATEST",
          },
          shares: { asOf: "2026-10-16", unit: "shares", shareBasis: "QATEST" },
        };
        const result = researchOutlook(r);
        assert.equal(result.available, expected, result.reason);
        if (result.available) {
          assert.equal(result.cases.length, 3);
          assert.ok(result.cases.every((c) => Number.isFinite(c.target)));
          assert.ok(
            result.cases[0].target <= result.cases[1].target &&
              result.cases[1].target <= result.cases[2].target,
          );
          assert.equal(result.end, "2028-12-31");
          // Invalid observation dates cannot be repaired by otherwise complete ranges.
          for (const change of [
            (x) => (x.evidence.updatedAt = "2027-01-01"),
            (x) => (x.quote.asOf = "2027-01-01"),
            (x) =>
              x.evidence.estimates.forEach((e) => {
                e.date = "2035-12-31";
                e.period = "FY2035";
              }),
          ]) {
            const bad = structuredClone(r);
            change(bad);
            assert.equal(researchOutlook(bad).available, false);
          }
          if (shareDependent)
            for (const change of [
              (x) =>
                (x.evidence.listingObservations.shares.asOf = "2026-09-01"),
              (x) =>
                (x.evidence.listingObservations.marketCap.asOf = "2027-01-01"),
              (x) =>
                (x.evidence.listingObservations.marketCap.currency = "EUR"),
              (x) =>
                (x.evidence.listingObservations.shares.shareBasis =
                  "QATEST-ADR"),
            ]) {
              const bad = structuredClone(r);
              change(bad);
              assert.equal(researchOutlook(bad).available, false);
            }
        }
      });
    }
