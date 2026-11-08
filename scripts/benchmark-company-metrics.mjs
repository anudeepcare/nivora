// Local synthetic helper benchmark only. No account, provider or browser calls.
// Run: node --experimental-strip-types scripts/benchmark-company-metrics.mjs
import { performance } from 'node:perf_hooks';
import { demoData } from '../tests/fixtures/demo.ts';
import { overviewEvidence } from '../lib/overview-evidence.ts';
const sample = demoData.research.MSFT;
for (let i = 0; i < 20; i++) {
  overviewEvidence(sample);
  overviewEvidence(sample, { includeTechnical: false });
}
const timings = { fullOverview: [], companyOnly: [] };
for (let i = 0; i < 100; i++) {
  // Alternate order to reduce systematic warm-up/order bias.
  const variants = i % 2 ? ['companyOnly', 'fullOverview'] : ['fullOverview', 'companyOnly'];
  for (const variant of variants) {
    const start = performance.now();
    overviewEvidence(sample, { includeTechnical: variant === 'fullOverview' });
    timings[variant].push(performance.now() - start);
  }
}
const summary = Object.fromEntries(Object.entries(timings).map(([name, values]) => {
  values.sort((a, b) => a - b);
  return [name, { samples: values.length, medianMs: values[50], p95Ms: values[94] }];
}));
console.log(JSON.stringify({ fixture: 'MSFT synthetic', ...summary, scope: 'Warmed Node helper comparison; not page load, browser, physical iPhone latency or production telemetry.' }, null, 2));
