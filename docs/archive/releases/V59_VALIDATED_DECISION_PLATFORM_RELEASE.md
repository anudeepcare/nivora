# NIVORA V59 — Validated Decision Platform

V59 consolidates V58 long-term intelligence into a versioned and measurable decision platform. It preserves the thesis-first engine and adds deterministic Today actions, frozen point-in-time decisions, Arena outcome grading, evidence-based reliability, provider request coalescing, and security-clean release packaging.

## Canonical versions
- Engine: `v59`
- Weights: `v59-thesis-1`
- Valuation: `v59-archetype-3`
- Today policy: `v59-today-1`

## Decision separation
Company quality, long-term thesis, opportunity, valuation, timing, Today action and portfolio sizing are separate concerns. Price action may change timing/opportunity but cannot directly rewrite company quality. Missing valuation remains unavailable evidence, not a bearish zero.

## Today
The V59 Today layer emits `BUY / ADD / HOLD / WAIT / TRIM / SELL / NO ACTION`. Fundamental vetoes and consistency conflicts take precedence over attractive timing. Owners and new-capital users receive different actions without changing the underlying company thesis.

## Arena
V59 freezes the exact decision, evidence fingerprint, engine/weights/valuation/policy versions and benchmark context. Arena supports 30D, 90D, 180D, 1Y and 2Y grading with raw return, SPY-relative alpha, optional sector-relative alpha and max drawdown. Reliability stays Collecting until minimum version-matched samples mature.

## Provider resilience
Identical in-flight upstream requests are coalesced. Provider-health primitives expose consecutive failures and degraded status; missing/stale upstream evidence must be surfaced as degraded confidence rather than silently scored bearish.

## Safety boundary
V59 does not include unrestricted autonomous live execution. A future broker layer must remain downstream from frozen research decisions and deterministic risk controls.

## Release hygiene
The distributable V59 ZIP excludes `.env.local`, `.next`, `node_modules`, `.git`, `.DS_Store` and `__MACOSX`. Only `.env.example` is shipped for configuration guidance.

## Verification performed in this release
- Engine regression suite: 28/28 passing.
- Engine TypeScript compilation: passing with `tsconfig.engine.json`.
- V59 tests include Today policy, frozen fingerprints, Arena grading, reliability sample gating, request coalescing and provider degradation.
- Full `next build` was attempted but could not run in the packaging environment because Next/React/Supabase dependencies were not available and dependency installation timed out. The source-level parse check reported dependency/type-resolution errors only. Run `npm ci && npm run build` in the normal project/deployment environment before production deployment.
