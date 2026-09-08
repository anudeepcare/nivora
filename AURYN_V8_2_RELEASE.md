# AURYN V8.2 — Security Master & Provider Coverage

V8.2 is the broad-universe hygiene release on top of V8.1 Market Truth. It addresses the next failure class exposed by the deployed 500-symbol closed-market audit: special securities and provider-coverage gaps were being sent through the ordinary common-stock analysis route and surfaced as generic 500 errors, while a warrant price mismatch appeared as a true critical consistency failure.

## Security Master

Before common-equity analysis, AURYN now classifies symbol structure into supported or quarantined security types. The deterministic first-pass Security Master recognizes:

- common stock / class share — supported for the normal equity pipeline
- preferred shares — quarantined from common-equity analysis
- warrants — quarantined
- rights — quarantined
- units — quarantined
- temporary / when-issued securities — quarantined

This is intentionally conservative. It does not manufacture a company thesis for an instrument type that needs its own pricing/model rules.

## Provider coverage semantics

Expected coverage gaps are no longer generic server failures. `/api/analyze/:symbol` returns a structured fail-closed state for:

- `UNSUPPORTED_INSTRUMENT`
- `PROVIDER_COVERAGE_MISSING`
- `MARKET_HISTORY_UNAVAILABLE`
- `INSUFFICIENT_HISTORY`

Those states are research/execution quarantines, not Buy/Hold/Sell decisions.

## 500-symbol audit hygiene

`/api/audit/universe` now filters obvious special instruments through the Security Master and requests a larger raw pool so it can refill the requested 500 supported equity candidates where available.

The live audit now reports three outcomes separately:

- `PASS` — supported instrument and no critical invariant failures
- `QUARANTINED` — unsupported instrument or provider/history coverage unavailable; execution blocked
- `CRITICAL` — true reliability defect such as unsafe tradability, symbol mismatch, or canonical/analyze price divergence

Quarantines do not cause a failing audit exit code; critical invariants still do.

## Canonical price mismatch remains hard-fail

V8.2 does not hide the `AIIOW`-style canonical/analyze price mismatch. The normal common-equity universe excludes warrants before analysis, but any supported security that still produces a canonical/analyze price gap above the audit tolerance remains `CRITICAL` and blocks release promotion.

## Validation commands

Closed-market 100:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v82-live
```

Closed/live 500:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v82-live -- --limit=500 | tee audit-500-v82.txt
```

During normal market hours, the same commands validate live Market Truth/execution eligibility.

## Release gates

- full regression suite: green
- fixed 100-ticker offline reality audit: 100/100
- production/dead-code audit: pass
- live 100/500 audit: zero critical invariants before paper-execution expansion
- live-money autonomous execution remains disabled
