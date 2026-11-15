import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from './fixtures/demo.ts';
import { aurynDecision, fundedGrowthCase } from '../lib/auryn-decision.ts';
import { financingContext } from '../lib/research-integrity.ts';

// Synthetic values only. Current business has 35% revenue growth, margin
// improves from -20% to -10%, 60 months operating / 30 months investment
// runway, net cash, and confirmed P2. Dilution is the only changing gate.
function fundedResearch(shares) {
  const r = structuredClone(demoData.research.MSFT);
  r.evidence = undefined;
  r.facts = [];
  for (const year of [2025, 2026]) {
    const values = {
      revenue: year === 2025 ? 1000 : 1350,
      operatingIncome: year === 2025 ? -200 : -135,
      operatingCashFlow: -100,
      capex: 100,
      cash: 500,
      debt: 400,
      equity: 500,
      weightedShares: year === 2025 ? 100 : shares,
    };
    for (const [metric, value] of Object.entries(values)) {
      if (value == null) continue;
      const instant = ['cash', 'debt', 'equity'].includes(metric);
      r.facts.push({
        id: `${year}-${metric}`, metric, value,
        unit: metric === 'weightedShares' ? 'shares' : 'USD',
        currency: metric === 'weightedShares' ? null : 'USD',
        start: instant ? '' : `${year - 1}-07-01`,
        end: `${year}-06-30`, filed: `${year}-07-30`,
        accession: `x${year}`, form: '10-K', sourceUrl: '', basis: 'GAAP',
        scope: instant ? 'instant' : 'annual',
      });
    }
  }
  r.history = r.history.map(row => {
    const close = row.time >= '2026-10-01' ? 60 : row.time >= '2026-09-01' ? 85 : 100;
    return { ...row, close, open: close, high: close * 1.01, low: close * .99 };
  });
  r.quote = { ...r.quote, price: 60, asOf: r.retrievedAt, stale: false };
  return r;
}
for (const shares of [null, 0, -100]) {
  test(`invalid latest diluted shares ${shares} cannot authorize funded-growth buying`, () => {
    const r = fundedResearch(shares);
    const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
    assert.equal(d.pace.eligibleLevel, 2);
    assert.equal(financingContext(r).dilution, null);
    assert.equal(d.growthAssessment.eligible, false);
    assert.equal(d.action, 'Review');
    assert.equal(d.actions.holding, 'Review');
  });
}
test('valid modest dilution and valid buybacks remain distinct from impossible shares', () => {
  for (const shares of [95, 105]) {
    const r = fundedResearch(shares);
    const d = aurynDecision(r, { now: Date.parse(r.retrievedAt) });
    assert.equal(d.growthAssessment.eligible, true);
    assert.equal(d.action, 'Buy');
    assert.equal(d.actions.holding, 'Add');
  }
});
test('funded-growth standalone gate rejects impossible dilution at or below minus 100%', () => {
  const base = { applicable: true, financialsUsable: true, growth: 35,
    margin: -10, priorMargin: -20, cash: 500, netDebt: -100,
    operatingCashFlow: -100, freeCashFlow: -200,
    operatingRunway: 60, investmentRunway: 30, dilution: 5 };
  for (const dilution of [-100, -200, -Infinity, NaN])
    assert.equal(fundedGrowthCase({ ...base, dilution }).eligible, false, `${dilution}`);
  assert.equal(fundedGrowthCase({ ...base, dilution: -5 }).eligible, true);
});
