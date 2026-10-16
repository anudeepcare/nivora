import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

let module = {};
try {
  const source = await readFile(new URL('../lib/research-structure.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.ESNext },
  });
  module = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

function build(input, options) {
  assert.equal(typeof module.buildResearchStructure, 'function', 'weekly research calculation must be implemented');
  return module.buildResearchStructure(input, options);
}

const WEEK = 7 * 24 * 60 * 60 * 1000;
const day = (start, weeks = 0) => new Date(Date.parse(start) + weeks * WEEK).toISOString().slice(0, 10);
const bar = (time, close, overrides = {}) => ({ time, open: close, high: close + 0.5, low: Math.max(0.1, close - 0.5), close, volume: 10, ...overrides });
const series = (count, start = '2020-01-06') => Array.from({ length: count }, (_, index) => bar(day(start, index), index + 1));
const manual = (direction = 'UP', scale = 'linear') => ({ asOf: '2025-02-03', mode: 'manual', startDate: '2025-01-06', endDate: '2025-01-20', direction, scale });
const upSwing = [bar('2025-01-06', 110, { low: 100, high: 120 }), bar('2025-01-13', 150), bar('2025-01-20', 190, { low: 180, high: 200 })];
const downSwing = [bar('2025-01-06', 190, { low: 180, high: 200 }), bar('2025-01-13', 150), bar('2025-01-20', 110, { low: 100, high: 120 })];
const valueAt = (result, ratio) => result.levels.find((level) => level.ratio === ratio)?.price;
function closeTo(actual, expected, epsilon = 1e-9) { assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≉ ${expected}`); }

test('empty data leaves unavailable values null instead of inventing anchors or averages', () => {
  const result = build([], { asOf: '2025-01-13' });
  assert.deepEqual(result.weeklyBars, []);
  assert.equal(result.coverage.completedWeeks, 0);
  assert.equal(result.coverage.firstDate, null);
  assert.equal(result.coverage.lastDate, null);
  assert.equal(result.anchors, null);
  assert.deepEqual(result.levels, []);
  assert.equal(result.movingAverages.ma50.value, null);
  assert.equal(result.movingAverages.ma200.value, null);
  assert.equal(result.lastClose, null);
  assert.equal(result.lastWeek, null);
  assert.ok(result.reason);
});

test('calendar Monday aggregation crosses the year boundary and uses chronological OHLC after daily deduplication', () => {
  const result = build([
    bar('2021-01-04', 40),
    bar('2020-12-30', 20, { high: 25 }),
    bar('2021-01-01', 30, { high: 32 }),
    bar('2020-12-28', 10, { low: 8, high: 12 }),
    bar('2020-12-30', 22, { high: 27, volume: 15 }),
  ], { asOf: '2021-01-11' });
  assert.deepEqual(result.weeklyBars, [
    { time: '2020-12-28', open: 10, high: 32, low: 8, close: 30, volume: 35, sourceEndDate: '2021-01-01' },
    { time: '2021-01-04', open: 40, high: 40.5, low: 39.5, close: 40, volume: 10, sourceEndDate: '2021-01-04' },
  ]);
  assert.equal(result.coverage.gaps, 0);
  assert.equal(result.coverage.completedWeeks, 2);
});

test('the whole current UTC week remains excluded even after Friday close', () => {
  const result = build([bar('2025-01-03', 100), bar('2025-01-06', 110), bar('2025-01-10', 120), bar('2025-01-13', 200)], { asOf: '2025-01-10T23:00:00Z' });
  assert.equal(result.weeklyBars.length, 1);
  assert.equal(result.lastWeek, '2024-12-30');
  assert.equal(result.lastClose, 100);
  assert.ok(result.warnings.some((warning) => /current.*week/i.test(warning)));
});

test('malformed dates, inconsistent dates, nonnumeric or nonpositive prices and impossible OHLC are rejected', () => {
  const malformed = [
    null, {}, bar('not-a-date', 100), bar('2025-02-30', 100),
    bar('2025-01-06', 100, { open: 0 }), bar('2025-01-06', 100, { close: null }),
    bar('2025-01-06', 100, { high: Infinity }), bar('2025-01-06', 100, { low: -1 }),
    bar('2025-01-06', 100, { close: '100' }), bar('2025-01-06', 100, { high: 99 }),
    bar('2025-01-06', 100, { date: '2025-01-07' }),
  ];
  const result = build([...malformed, bar('2025-01-06', 100)], { asOf: '2025-03-10' });
  assert.equal(result.coverage.invalidBars, 11);
  assert.equal(result.weeklyBars.length, 1);
  assert.equal(result.lastClose, 100);
});

test('ISO dates and Unix seconds or milliseconds describe the same UTC daily observation', () => {
  const timestamp = Date.parse('2025-01-06T00:00:00Z');
  for (const time of ['2025-01-06', timestamp, timestamp / 1000]) {
    const result = build([bar(time, 100)], { asOf: '2025-01-13' });
    assert.equal(result.lastWeek, '2025-01-06');
    assert.equal(result.lastClose, 100);
  }
  const dated = bar(undefined, 100, { date: '2025-01-06' });
  assert.equal(build([dated], { asOf: '2025-01-13' }).lastClose, 100);
});

test('millisecond timestamps before 2001 are not mistaken for far-future Unix seconds', () => {
  const timestamp = Date.parse('2000-01-03T00:00:00Z');
  for (const time of [timestamp, timestamp / 1000]) {
    const result = build([bar(time, 100)], { asOf: '2000-01-10' });
    assert.equal(result.lastWeek, '2000-01-03');
    assert.equal(result.lastClose, 100);
  }
});

test('historical results do not change when future and current-week observations are appended', () => {
  const options = { asOf: '2025-01-27', mode: 'manual', startDate: '2025-01-06', endDate: '2025-01-20', direction: 'UP' };
  const prefix = build(upSwing, options);
  const withFuture = build([...upSwing, bar('2025-01-27', 1000), bar('2027-01-04', 2000)], options);
  assert.deepEqual(withFuture, prefix);
});

test('50-week and 200-week SMA use exactly their full windows of weekly closes', () => {
  const result = build(series(200), { asOf: day('2020-01-06', 200) });
  assert.equal(result.movingAverages.ma50.value, 175.5);
  assert.equal(result.movingAverages.ma200.value, 100.5);
  assert.equal(result.movingAverages.ma50.points.length, 151);
  assert.equal(result.movingAverages.ma200.points.length, 1);
  assert.deepEqual(result.movingAverages.ma50.points[0], { time: '2020-12-14', value: 25.5 });
  assert.equal(result.averageType, 'SMA');
});

test('WMA explicitly weights the newest close most heavily within the complete window', () => {
  const result = build(series(200), { asOf: day('2020-01-06', 200), averageType: 'WMA' });
  closeTo(result.movingAverages.ma50.value, 551 / 3);
  closeTo(result.movingAverages.ma200.value, 401 / 3);
  closeTo(result.movingAverages.ma50.points[0].value, 101 / 3);
  assert.equal(result.averageType, 'WMA');
});

test('199 weeks never produce a shortened 200-week average', () => {
  const result = build(series(199), { asOf: day('2020-01-06', 199) });
  assert.equal(result.movingAverages.ma50.value, 174.5);
  assert.equal(result.movingAverages.ma200.value, null);
  assert.deepEqual(result.movingAverages.ma200.points, []);
  assert.ok(result.warnings.some((warning) => /200/.test(warning)));
});

test('missing calendar weeks invalidate every moving-average window spanning the gap without filling', () => {
  const input = series(201).filter((_, index) => index !== 175);
  const result = build(input, { asOf: day('2020-01-06', 201) });
  assert.equal(result.coverage.completedWeeks, 200);
  assert.equal(result.coverage.gaps, 1);
  assert.equal(result.movingAverages.ma50.value, null);
  assert.equal(result.movingAverages.ma200.value, null);
  assert.equal(result.movingAverages.ma50.points.length, 126);
  assert.equal(result.movingAverages.ma50.points[result.movingAverages.ma50.points.length - 1].time, day('2020-01-06', 174));
});

test('averages resume after enough consecutive completed weeks following a gap', () => {
  const input = series(101).filter((_, index) => index !== 50);
  const result = build(input, { asOf: day('2020-01-06', 101) });
  assert.equal(result.coverage.gaps, 1);
  assert.equal(result.movingAverages.ma50.value, 76.5);
  assert.equal(result.movingAverages.ma50.points.length, 2);
});

test('manual upward swing computes retracements back from its high and extensions forward from its low', () => {
  const result = build(upSwing, manual());
  assert.deepEqual(result.anchors.start, { time: '2025-01-06', price: 100, type: 'LOW' });
  assert.deepEqual(result.anchors.end, { time: '2025-01-20', price: 200, type: 'HIGH' });
  assert.equal(result.anchors.direction, 'UP');
  assert.equal(result.anchors.confirmedAt, null);
  assert.equal(result.reason, null);
  assert.deepEqual(result.levels.map(({ ratio, price, kind }) => ({ ratio, price, kind })), [
    { ratio: 0, price: 200, kind: 'ENDPOINT' },
    { ratio: 0.236, price: 176.4, kind: 'RETRACEMENT' },
    { ratio: 0.382, price: 161.8, kind: 'RETRACEMENT' },
    { ratio: 0.5, price: 150, kind: 'RETRACEMENT' },
    { ratio: 0.618, price: 138.2, kind: 'RETRACEMENT' },
    { ratio: 0.786, price: 121.39999999999999, kind: 'RETRACEMENT' },
    { ratio: 1, price: 100, kind: 'ENDPOINT' },
    { ratio: 1.272, price: 227.2, kind: 'EXTENSION' },
    { ratio: 1.618, price: 261.8, kind: 'EXTENSION' },
  ]);
  assert.match(result.levels.find((level) => level.ratio === 0.5).label, /convention/i);
  assert.ok(result.warnings.some((warning) => /conditional/i.test(warning) && /extension/i.test(warning)));
});

test('manual downward swing retraces up from its low and extends downward in trend direction', () => {
  const result = build(downSwing, manual('DOWN'));
  assert.equal(result.anchors.start.type, 'HIGH');
  assert.equal(result.anchors.end.type, 'LOW');
  closeTo(valueAt(result, 0.236), 123.6);
  closeTo(valueAt(result, 0.5), 150);
  closeTo(valueAt(result, 0.786), 178.6);
  closeTo(valueAt(result, 1.272), 72.8);
  closeTo(valueAt(result, 1.618), 38.2);
});

test('log scale applies the same geometry to logarithms in both swing directions', () => {
  const upward = build(upSwing, manual('UP', 'log'));
  const downward = build(downSwing, manual('DOWN', 'log'));
  closeTo(valueAt(upward, 0.5), 141.4213562373095);
  closeTo(valueAt(downward, 0.5), 141.4213562373095);
  closeTo(valueAt(upward, 1.618), 306.94921920017737);
  closeTo(valueAt(downward, 1.618), 65.15735746816469);
  assert.equal(upward.scale, 'log');
});

test('manual anchor dates map to their containing calendar week', () => {
  const result = build(upSwing, { ...manual(), startDate: '2025-01-10', endDate: '2025-01-24' });
  assert.equal(result.anchors.start.time, '2025-01-06');
  assert.equal(result.anchors.end.time, '2025-01-20');
});

test('reversed, missing, same-week and price-inconsistent manual anchors withhold Fibonacci', () => {
  for (const options of [
    { startDate: '2025-01-20', endDate: '2025-01-06' },
    { startDate: '2025-01-06', endDate: '2025-01-10' },
    { startDate: '2024-12-30' },
    { startDate: '2025-02-30' },
    { startDate: undefined },
    { direction: 'DOWN' },
  ]) {
    const result = build(upSwing, { ...manual(), ...options });
    assert.equal(result.anchors, null);
    assert.deepEqual(result.levels, []);
    assert.ok(result.reason);
  }
});

test('unconfirmed most-recent extremes cannot replace the latest confirmed opposite pivots', () => {
  const prices = [130, 120, 100, 130, 160, 190, 170, 150, 210];
  const input = prices.map((price, index) => bar(day('2025-01-06', index), price, { high: price + 10, low: price - 10 }));
  const result = build(input, { asOf: '2025-03-10' });
  assert.deepEqual(result.anchors.start, { time: '2025-01-20', price: 90, type: 'LOW' });
  assert.deepEqual(result.anchors.end, { time: '2025-02-10', price: 200, type: 'HIGH' });
  assert.equal(result.anchors.direction, 'UP');
  assert.equal(result.anchors.confirmedAt, '2025-03-03');
  assert.match(result.anchors.method, /2.*left.*2.*right/i);
});

test('auto pivots need two consecutive weeks on both sides, so a missing week cannot confirm them', () => {
  const prices = [130, 120, 100, 130, 160, 190, 170, 150];
  const input = prices.map((price, index) => bar(day('2025-01-06', index), price)).filter((_, index) => index !== 1);
  const result = build(input, { asOf: '2025-03-03' });
  assert.equal(result.coverage.gaps, 1);
  assert.equal(result.anchors, null);
  assert.deepEqual(result.levels, []);
  assert.ok(result.reason);
});

test('a monotonic series can provide averages without inventing Fibonacci pivots', () => {
  const result = build(series(200), { asOf: day('2020-01-06', 200) });
  assert.equal(result.anchors, null);
  assert.deepEqual(result.levels, []);
  assert.equal(result.movingAverages.ma200.value, 100.5);
  assert.ok(result.reason);
});

test('coverage warns when the last source observation is over fourteen days old', () => {
  const stale = build([bar('2025-01-03', 100)], { asOf: '2025-01-20' });
  const fresh = build([bar('2025-01-03', 100)], { asOf: '2025-01-13' });
  assert.ok(stale.warnings.some((warning) => /stale/i.test(warning)));
  assert.ok(!fresh.warnings.some((warning) => /stale/i.test(warning)));
});

test('daily-only coverage identifies the limit of certifying complete boundary weeks', () => {
  const result = build([bar('2025-01-08', 100)], { asOf: '2025-01-13' });
  assert.ok(result.warnings.some((warning) => /first.*last/i.test(warning) && /partial/i.test(warning)));
});

test('invalid asOf cannot silently fall back to the current clock or admit observations', () => {
  const result = build(upSwing, { asOf: 'invalid' });
  assert.deepEqual(result.weeklyBars, []);
  assert.equal(result.anchors, null);
  assert.ok(result.reason);
});

test('calculation does not reorder or mutate the supplied daily bars or options', () => {
  const input = Object.freeze(upSwing.slice().reverse().map((item) => Object.freeze({ ...item })));
  const options = Object.freeze(manual());
  const result = build(input, options);
  assert.equal(input[0].time, '2025-01-20');
  assert.equal(result.anchors.start.time, '2025-01-06');
});
