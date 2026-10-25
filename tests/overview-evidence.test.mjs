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
