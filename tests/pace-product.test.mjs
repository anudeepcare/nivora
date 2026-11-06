import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../lib/auryn-decision.ts';
import { researchEdge } from '../lib/edge-research.ts';
import { demoData } from './fixtures/demo.ts';
import { contributionGuide, dcaDisplay, paceCode, pacePresentation, pacePeriods } from '../lib/pace-presentation.ts';

test('the forming and completed readings retain independent dates and levels in a consistent order', () => {
  const rows = pacePeriods({multiplier: 2, date: '2026-09-30', month: '2026-09', forming: {multiplier: 4, date: '2026-10-26', month: '2026-10'}});
  assert.deepEqual(rows.map(r=>[r.key,r.code,r.date]), [['forming','P4','2026-10-26'],['confirmed','P2','2026-09-30']]);
  assert.match(rows[0].label, /Current month/);
  assert.match(rows[1].label, /Completed month/);
  assert.equal(pacePeriods({multiplier: null, forming: null})[1].code, 'Pending');
});

test('Pace uses branded levels and distinguishes missing history from P0', () => {
  for (let n = 0; n <= 4; n++) assert.equal(paceCode(n), `P${n}`);
  for (const n of [null, undefined, NaN, Infinity, -1, 5, 1.5]) assert.equal(paceCode(n), 'Pending');
});
test('DCA display keeps forming readings visible when completed history is unavailable', () => {
  const forming = dcaDisplay({
    confirmed: null,
    forming: { multiplier: 4, month: '2026-10' },
  });
  assert.equal(forming.reading?.multiplier, 4);
  assert.equal(forming.period, 'Current month · forming');
  const confirmed = dcaDisplay({
    confirmed: { multiplier: 1, month: '2026-09' },
    forming: { multiplier: 4, month: '2026-10' },
  });
  assert.equal(confirmed.reading?.multiplier, 1);
  assert.equal(confirmed.period, '2026-09 · confirmed');
  assert.equal(dcaDisplay({ confirmed: null, forming: null }).reading, null);
});
test('contribution guide explains the multiplier against the planned amount', () => {
  assert.deepEqual(contributionGuide('Buy', 2), { multiple: 1, label: '1× your planned contribution', meaning: 'Start with your normal planned amount.' });
  assert.deepEqual(contributionGuide('Add', 3), { multiple: 2, label: '2× your planned contribution', meaning: 'Twice your normal planned amount.' });
  assert.deepEqual(contributionGuide('Buy', 4), { multiple: 4, label: 'Up to 4× your planned contribution', meaning: 'A maximum guide, only within your budget and position limit.' });
  assert.deepEqual(contributionGuide('Watch', 4), { multiple: 0, label: 'P4 zone · entry pending', meaning: 'The price zone is visible, but this assessment does not qualify a contribution. Existing holders should follow the separate holding guidance.' });
});
test('all decisions gate every Pace level without overwriting the raw price reading', () => {
  for (const action of ['Buy', 'Add', 'Hold', 'Wait', 'Review', 'Reduce', 'Sell', 'Avoid']) {
    for (const level of [0, 1, 2, 3, 4, null]) {
      const view = pacePresentation(action, level);
      assert.equal(view.rawLevel, level);
      assert.equal(view.permitted, ['Buy', 'Add'].includes(action));
      if (['Reduce', 'Sell', 'Avoid'].includes(action)) {
        assert.equal(view.status, 'paused');
        assert.equal(view.label, 'Additions paused');
        assert.doesNotMatch(view.label, /Accelerated|Increased|Elevated/);
      }
    }
  }
});

test('every research edge exposes contextual Pace rather than an independent buy instruction', () => {
  const edge = researchEdge(demoData.research.MSFT);
  assert.ok(edge.pacePresentation, 'shared Pace presentation is required');
  assert.equal(edge.pacePresentation.rawLevel, edge.pricePace);
  assert.ok(edge.pacePresentation.explanation.includes('P means Pace'));
  if (edge.assessment === 'Wait') assert.equal(edge.pacePresentation.status, 'context');
});

test('expansion capex with positive operating cash does not alone trigger funding distress', () => {
  assert.equal(typeof policy.fundingRisk, 'function');
  const risk = policy.fundingRisk({ applicable: true, operatingCashFlow: 100, freeCashFlow: -500, interestCoverage: -2, netDebt: 200, operatingRunway: null, cash: 800 });
  assert.equal(risk.distress, false);
  assert.equal(risk.interestPressure, true);
});

test('short operating runway remains a funding risk, including zero cash', () => {
  assert.equal(typeof policy.fundingRisk, 'function');
  for (const months of [0, 5, 11.9]) {
    const risk = policy.fundingRisk({ applicable: true, operatingCashFlow: -100, freeCashFlow: -120, interestCoverage: -2, netDebt: 200, operatingRunway: months, cash: months * 100 / 12 });
    assert.equal(risk.distress, true);
  }
});

test('bank and insurance cash flows are never put through operating-company runway rules', () => {
  assert.equal(typeof policy.fundingRisk, 'function');
  const risk = policy.fundingRisk({ applicable: false, operatingCashFlow: -100, freeCashFlow: -120, interestCoverage: -2, netDebt: 200, operatingRunway: 2, cash: 10 });
  assert.equal(risk.distress, false);
});

test('an eligible business at P1 remains outside accumulation even without a valuation', () => {
 const r = structuredClone(demoData.research.IREN);
 const decision = policy.aurynDecision(r, {now:Date.parse(r.retrievedAt)});
 assert.equal(decision.value, 'unassessed');
 assert.equal(decision.action, 'Watch');
 assert.equal(decision.brief.accumulation.multiplier,1);
 assert.match(decision.changeConditions[0], /completed reading reaches P2/i);
 assert.equal(decision.explanation.code,'zone');
});
test('non-entry states do not collapse every stock into a zero multiplier', () => {
  assert.equal(contributionGuide('Watch', 1).multiple, 0);
  assert.equal(contributionGuide('Watch', 1).label, 'P1 watch zone');
  assert.equal(contributionGuide('Review', 2).label, 'P2 zone · business gate');
  assert.match(contributionGuide('Review', 2).meaning, /confirmed P2 price zone/i);
  assert.match(contributionGuide('Wait', 4).meaning, /price zone is visible/i);
  assert.equal(contributionGuide('Wait', 0).label, '0× · price pause');
});
