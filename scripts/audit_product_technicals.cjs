/* Read-only diagnostic probes. Synthetic inputs; NOT investment-performance tests.
 * Run from repository root: node scripts/audit_product_technicals.cjs
 * Intentionally prints observed behavior rather than blessing it as correct.
 */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, filename);
const root = path.resolve(__dirname, '..');
const { computeTechnicalSnapshot } = require(path.join(root, 'lib/nivora-technical-engine.ts'));
const { buildProfessionalMetrics } = require(path.join(root, 'lib/auryn/v5/metrics.ts'));
const { analyzeTechnicalPatterns } = require(path.join(root, 'lib/auryn/v5/technical-patterns.ts'));
const v4 = { factors: {}, thesis: { strength: null, direction: 'UNASSESSED' }, moat: { score: null, direction: 'UNASSESSED' } };
const rising = Array.from({ length: 60 }, (_, i) => ({
  datetime: new Date(Date.UTC(2026, 0, i + 1)).toISOString().slice(0, 10),
  open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 100000,
}));
function evaluate(bars) {
  const technical = computeTechnicalSnapshot(bars, null, null);
  const metrics = buildProfessionalMetrics({ technical, v4, bars });
  const metric = (id) => metrics.find((item) => item.id === id)?.value ?? null;
  return { technical, metric, patterns: analyzeTechnicalPatterns(bars, technical) };
}
const rise = evaluate(rising);
const zero = evaluate(rising.map((bar) => ({ ...bar, volume: 0 })));
const flat = evaluate(rising.map((bar) => ({ ...bar, open: 100, high: 101, low: 99, close: 100 })));
console.log(JSON.stringify({
  purpose: 'Observed behavior of current source under synthetic edge cases; not a passing release certificate.',
  rising60BarsWithoutBenchmark: {
    benchmark: rise.technical.market.benchmark,
    benchmarkPrice: rise.technical.market.benchmarkPrice,
    relativeStrength: rise.technical.market.relativeStrength,
    relative20: rise.technical.market.relative20,
    sma200: rise.technical.indicators.sma200,
    drawdownLabeled52Week: rise.technical.indicators.drawdown52wPct,
    price: rise.technical.price,
    resistance: rise.technical.levels.resistance,
    confirmedBreakout: rise.patterns.some((item) => item.type === 'BREAKOUT_CONFIRMED'),
  },
  zeroVolume60Bars: {
    relativeVolume: zero.metric('volumeRatio20'),
    participation: zero.metric('participation'),
    moneyFlowIndex: zero.metric('mfi14'),
    volumeProfilePocDistance: zero.metric('volumeProfilePocDistance'),
  },
  unchangedPrices60Bars: {
    rsi: flat.metric('rsi14'),
    moneyFlowIndex: flat.metric('mfi14'),
  },
}, null, 2));
