import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarketRadar, radarCheckpoints } from '../lib/market-radar.ts';

function bars(rate = .002, count = 90) {
  const result = [];
  for (let day = 0; result.length < count; day++) {
    const date = new Date(Date.UTC(2025, 0, 2 + day));
    if ([0, 6].includes(date.getUTCDay())) continue;
    const close = 100 * (1 + rate) ** result.length;
    result.push({ time: date.toISOString().slice(0, 10), open: close, high: close + 1, low: close - 1, close, volume: 10 });
  }
  return result;
}
function research(symbol, rate = .002, sector = 'Technology', history = bars(rate)) {
  return { company: {symbol, name:symbol, assetType:'stock', sector}, history };
}
const last = bars().at(-1).time;

test('breadth and rotation use the dated loaded sample and equal-weight sample benchmark', () => {
  const model = buildMarketRadar([research('UP', .01), research('DOWN', -.005, 'Energy')], last);
  assert.equal(model.asOf, last);
  assert.equal(model.breadthEligible, 2);
  assert.equal(model.rotationEligible, 2);
  assert.equal(model.sectors.find(x => x.sector === 'Technology').above20Pct, 100);
  assert.equal(model.sectors.find(x => x.sector === 'Energy').above20Pct, 0);
  const up = model.companies.find(x => x.symbol === 'UP');
  assert.ok(Math.abs(up.return20 - ((1.01 ** 20 - 1) * 100)) < 1e-9);
  assert.ok(Math.abs(model.benchmark.return20 - model.companies.reduce((s, x) => s + x.return20, 0) / 2) < 1e-9);
  assert.equal(up.quadrant, 'Leading');
  assert.equal(model.companies.find(x => x.symbol === 'DOWN').quadrant, 'Lagging');
});

test('historical checkpoints ignore later bars and align comparison endpoints', () => {
  const history = bars();
  const date = history[65].time;
  const model = buildMarketRadar([research('A'), research('B', .004)], date);
  assert.equal(model.asOf, date);
  assert.equal(model.start20, history[45].time);
  assert.equal(model.start60, history[5].time);
  assert.equal(model.companies[0].observations, 66);
  assert.ok(radarCheckpoints([research('A')], date).every(x => x <= date));
});

test('stale, sparse, malformed, duplicate, demo and crypto histories cannot inflate coverage', () => {
  const history = bars();
  const bad = history.map(x => ({...x, open: 0, high: 0, low: 0}));
  const input = [research('GOOD'), research('STALE', .01, 'Energy', history.slice(0,-1)), research('SPARSE', .01, 'Energy', history.filter((_,i) => i % 3 === 0)), research('BAD', .01, 'Energy', bad), {...research('DEMO'), demo: true}, {...research('COIN'), company: {symbol:'COIN', assetType:'crypto'}}, research('DUP', .01, 'Energy', [...history, ...history])];
  const model = buildMarketRadar(input, last);
  assert.equal(model.breadthEligible, 1);
  assert.equal(model.rotationEligible, 1);
  assert.equal(model.benchmark, null);
  assert.equal(model.companies[0].quadrant, null);
  assert.equal(model.excluded, 6);
});

test('short histories support breadth without inventing 60-session comparisons', () => {
  const history = bars().slice(-25);
  const model = buildMarketRadar([research('A', 0, 'Technology', history), research('A', 0, 'Technology', history)], last);
  assert.equal(model.loaded, 1);
  assert.equal(model.breadthEligible, 1);
  assert.equal(model.rotationEligible, 0);
  assert.equal(model.companies[0].return60, null);
  assert.equal(model.benchmark, null);
});

test('invalid and future dates, nonfinite prices and empty samples remain unavailable', () => {
  assert.equal(buildMarketRadar([], last).asOf, null);
  assert.equal(buildMarketRadar([research('A')], '2025-02-30').asOf, null);
  const malformed = bars().map(x => ({...x, close: Infinity}));
  assert.equal(buildMarketRadar([research('A', 0, 'Energy', malformed)], last).breadthEligible, 0);
  const future = bars().map(x => ({...x, time: x.time.replace('2025', '2099')}));
  assert.deepEqual(radarCheckpoints([research('F', 0, 'Energy', future)]), []);
});

test('loaded sample filters never allow unsupported companies to define the calendar', () => {
  const valid = research('VALID');
  const later = bars(.002, 100);
  const model = buildMarketRadar([valid, {...research('DEMO', .002, 'Energy', later), demo: true}], later.at(-1).time);
  assert.equal(model.asOf, last);
  assert.equal(model.breadthEligible, 1);
});

test('invalid duplicate endpoints are unavailable instead of keeping an arbitrary quote', () => {
  const history = bars();
  const duplicate = {...history.at(-1), close: 1, open: 1, low: 1, high: 1};
  const model = buildMarketRadar([research('VALID'), research('AMBIGUOUS', .002, 'Energy', [...history, duplicate])], last);
  assert.equal(model.breadthEligible, 1);
  assert.ok(model.exclusions.some(item => item.symbol === 'AMBIGUOUS' && item.reason.includes('checkpoint')));
});

test('sector returns use the same both-window eligible basket as the benchmark', () => {
  const model = buildMarketRadar([research('A'), research('B', -.001), research('SHORT', .01, 'Energy', bars(.01).slice(-25))], last);
  assert.equal(model.breadthEligible, 3);
  assert.equal(model.benchmark.count, 2);
  const energy = model.sectors.find(item => item.sector === 'Energy');
  assert.equal(energy.eligible, 1);
  assert.equal(energy.return20, null);
  assert.equal(energy.return60, null);
});

test('finite extreme prices cannot overflow the sample benchmark', () => {
  const history = bars(0).map((bar, index) => {
    const price = index === 89 ? Number.MAX_VALUE / 100 : 1;
    return {...bar, close: price, open: price, high: price, low: price};
  });
  const model = buildMarketRadar(['A', 'B', 'C'].map(symbol => research(symbol, 0, 'Technology', history)), last);
  assert.ok(Number.isFinite(model.benchmark.return20));
  assert.ok(Number.isFinite(model.benchmark.return60));
  assert.ok(model.companies.every(item => Number.isFinite(item.relative20) && Number.isFinite(item.relative60)));
});
