import test from "node:test";
import assert from "node:assert/strict";
import { researchBrief } from "../lib/research-brief.ts";
import { demoData } from "./fixtures/demo.ts";
const r = demoData.research.MSFT;
test("brief keeps consensus separate and flags inconsistent share/listing inputs", () => {
  const b = researchBrief({
    ...r,
    evidence: {
      ...r.evidence,
      reportingCurrency: "USD",
      ownership: { ...r.evidence?.ownership, outstanding: 100 },
      highlights: { ...r.evidence?.highlights, MarketCapitalization: 1e12 },
    },
  });
  assert.equal(b.conflicting, true);
  assert.equal(b.value.title, "Resolve listing inputs");
  assert.ok(b.checks.some((x) => x.status === "conflicting"));
  assert.ok(b.business.reason.length > 0);
  assert.equal(typeof b.business.reason, "string");
});
test("crypto and unsupported specialist businesses do not inherit generic operating-company claims", () => {
  const crypto = researchBrief({
    ...r,
    company: { ...r.company, symbol: "ETH/USD", assetType: "crypto" },
  });
  assert.equal(crypto.business.title, "Network & exposure review");
  assert.equal(crypto.coverage.family, "crypto");
  assert.match(crypto.value.reason, /Corporate|asset|company|apply/i);
  const bank = researchBrief({
    ...r,
    company: { ...r.company, symbol: "JPM", sector: "Financial Services" },
    evidence: {
      ...r.evidence,
      profile: {
        ...r.evidence?.profile,
        industry: "Banks",
        sector: "Financial Services",
      },
    },
  });
  assert.equal(bank.business.title, "Use the sector-specific lens");
  assert.notEqual(bank.coverage.family, "operating-company");
});
