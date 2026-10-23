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

test('overview exposes dated confirmed and forming DCA readings without replacing one with the other', async () => {
  const { perspective } = await import('../lib/analysis.ts');
  const p = perspective(r), b = researchBrief(r);
  assert.equal(b.accumulation.version, p.dca.version);
  assert.deepEqual(b.accumulation.forming, p.dca.forming);
  assert.equal(b.accumulation.multiplier, p.dca.confirmed?.multiplier ?? null);
  if (p.dca.confirmed) {
    assert.equal(b.accumulation.drawdown, p.dca.confirmed.drawdown);
    assert.equal(b.accumulation.deviation, p.dca.confirmed.deviation);
  }
});

test('overview financial chart series use reported annual values and exclude future filings and mixed currencies', () => {
  const b = researchBrief(r);
  assert.ok(b.trajectory.length >= 3);
  assert.ok(b.trajectory.length <= 5);
  assert.ok(b.trajectory.every(x => x.currency === b.businessNumbers.currency && x.end <= r.retrievedAt.slice(0,10)));
  const bad = {...r, facts: [...r.facts, ...r.facts.filter(f => f.scope === 'annual').map(f => ({...f,id:'future-'+f.id,end:'2027-06-30',filed:'2027-07-30',value:1e30}))]};
  assert.deepEqual(researchBrief(bad).trajectory, b.trajectory);
  const mixed = {...r, facts: r.facts.map(f => f.scope === 'annual' && f.end === '2023-06-30' ? {...f, currency:'EUR', unit:'EUR'} : f)};
  assert.ok(researchBrief(mixed).trajectory.every(row => row.currency === "USD" && row.end !== "2023-06-30"));
  const crypto = {...r,company:{...r.company,assetType:'crypto'}};
  assert.deepEqual(researchBrief(crypto).trajectory, []);
});


test('quote refresh state does not rewrite settled accumulation or reported financial trends', () => {
  const before=researchBrief(r);
  const after=researchBrief({...r,quote:{...r.quote,price:null,asOf:null,stale:true}});
  assert.deepEqual(after.accumulation,before.accumulation);
  assert.deepEqual(after.trajectory,before.trajectory);
});
