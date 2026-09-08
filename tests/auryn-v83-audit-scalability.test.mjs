import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

let helpers;
try { helpers = await import('../.engine-test/auryn/v83/audit-helpers.js'); } catch {}

test('audit numeric parsing preserves null/undefined instead of coercing them to zero',()=>{
  assert.ok(helpers, 'V8.3 audit helpers must exist');
  assert.equal(helpers.finiteNumberOrNull(null), null);
  assert.equal(helpers.finiteNumberOrNull(undefined), null);
  assert.equal(helpers.finiteNumberOrNull(''), null);
  assert.equal(helpers.finiteNumberOrNull('12.5'), 12.5);
  assert.equal(helpers.finiteNumberOrNull(0), 0);
});

test('blocked Market Truth is critical only when it truly exposes a finite numeric decisionPrice',()=>{
  assert.ok(helpers, 'V8.3 audit helpers must exist');
  assert.equal(helpers.blockedDecisionPriceLeak(false, null), false);
  assert.equal(helpers.blockedDecisionPriceLeak(false, undefined), false);
  assert.equal(helpers.blockedDecisionPriceLeak(false, 0), true);
  assert.equal(helpers.blockedDecisionPriceLeak(false, 42.5), true);
  assert.equal(helpers.blockedDecisionPriceLeak(true, 42.5), false);
});

test('canonical/analyze price mismatch remains a hard critical when both prices are decision-usable',()=>{
  assert.ok(helpers, 'V8.3 audit helpers must exist');
  assert.equal(helpers.canonicalAnalyzeGapPct(100, 111.94), 11.94);
  assert.equal(helpers.isCanonicalAnalyzeGapCritical(true,100,111.94,3), true);
  assert.equal(helpers.isCanonicalAnalyzeGapCritical(false,100,111.94,3), false);
  assert.equal(helpers.isCanonicalAnalyzeGapCritical(true,null,111.94,3), false);
});

test('500-stock live audit retries 429 responses using Retry-After/backoff instead of marking the ticker immediately critical',()=>{
  const src=fs.readFileSync('scripts/run_v8_live_100_audit.mjs','utf8');
  assert.match(src,/Retry-After/i);
  assert.match(src,/status\s*===\s*429/);
  assert.match(src,/AUDIT_MAX_RETRIES|V8_LIVE_AUDIT_MAX_RETRIES/);
  assert.match(src,/retry|backoff/i);
  assert.doesNotMatch(src,/const decisionPrice=Number\(snap\?\.decisionPrice\)/);
});

test('audit exposes rate-limit retries separately from true critical failures in summary',()=>{
  const src=fs.readFileSync('scripts/run_v8_live_100_audit.mjs','utf8');
  assert.match(src,/rateLimitRetries/);
  assert.match(src,/quarantined/);
  assert.match(src,/critical/);
});

test('upstream provider 429 is transient rate-limit state, not missing-history quarantine',async()=>{
  const coverage=await import('../.engine-test/auryn/v82/provider-coverage.js');
  const c=coverage.assessHistoryCoverage('TEST',{code:429,status:'error',message:'Too many requests'});
  assert.equal(c.code,'PROVIDER_RATE_LIMITED');
  assert.equal(c.analysisAllowed,false);
});

test('analyze route preserves upstream provider-rate limits as HTTP 429 so the audit can retry them',()=>{
  const src=fs.readFileSync('app/api/analyze/[symbol]/route.ts','utf8');
  assert.match(src,/PROVIDER_RATE_LIMITED/);
  assert.match(src,/status:429|\{status:429/);
});
