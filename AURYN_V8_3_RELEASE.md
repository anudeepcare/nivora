# AURYN V8.3 — Canonical State & Audit Scalability

V8.3 is the scale/reliability hotfix on top of V8.2 Security Master. It addresses the failure classes exposed by the deployed 500-symbol audit: nullable Market Truth fields were being coerced into numeric zero inside the audit, transient 429 provider/rate-limit responses were being misclassified as history coverage failures, and the live audit did not retry rate limits before declaring a critical error.

## Canonical nullable-price semantics

The audit now uses explicit nullable-number parsing. `null`, `undefined`, and empty values remain unavailable instead of becoming `0` through JavaScript `Number(...)` coercion.

A blocked Market Truth snapshot is critical only if the deployed response actually exposes a finite decision price. A blocked snapshot with `decisionPrice: null` is correctly treated as blocked, not as a false critical.

## Canonical/analyze mismatch remains hard-fail

If both canonical Market Truth and `/api/analyze/:symbol` expose valid research prices, a material price divergence remains `CRITICAL`. V8.3 does not weaken this gate. Real cases such as the deployed ADAP mismatch must still be investigated and resolved before promotion.

## Rate-limit semantics

Provider/history payloads with 429/rate-limit semantics are now classified as `PROVIDER_RATE_LIMITED`, not `MARKET_HISTORY_UNAVAILABLE`.

`/api/analyze/:symbol` preserves this transient state as HTTP 429 with `Retry-After`, allowing the audit runner to retry rather than quarantine or immediately fail the ticker.

The live audit now:

- retries 429 responses with `Retry-After` or exponential fallback backoff
- tracks `rateLimitRetries` separately from critical failures
- defaults to a more conservative per-symbol delay for broad audits
- preserves provider/history quarantines separately from true critical defects

## Validation commands

Closed/live 100:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v83-live | tee audit-100-v83.txt
```

Closed/live 500:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v83-live -- --limit=500 | tee audit-500-v83.txt
```

Optional tuning for a slower provider plan:

```bash
V8_LIVE_AUDIT_DELAY_MS=2200 V8_LIVE_AUDIT_MAX_RETRIES=3 AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v83-live -- --limit=500 | tee audit-500-v83.txt
```

## Release gates

- full regression suite green
- fixed 100-ticker offline Reality Audit 100/100
- production/dead-code audit pass
- deployed 100/500 audit: zero true critical invariants before paper-execution expansion
- provider quarantines and rate-limit retries are not conflated with market-model failure
- live-money autonomous execution remains disabled
