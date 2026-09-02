# NIVORA V64.1 — Consistency & Correctness Rebuild

V64.1 is a correctness/decision-coherence release on top of V64. It does not loosen the model to create more BUY calls.

## What changed

- New-money states now distinguish `AVOID` from `WAIT`.
  - `AVOID`: bearish/broken/vetoed evidence blocks new capital.
  - `WAIT`: thesis may be investable, but entry conditions are not ready.
  - `BUY`: thesis/opportunity/company/timing all satisfy the canonical policy.
- Owner states remain `ADD`, `HOLD`, `TRIM`, `SELL`.
- A deterministic policy matrix proves BUY and ADD are reachable. This proves policy reachability only; it is not evidence that any current ticker deserves BUY.
- Bearish/vetoed screens no longer advertise a primary `Path to BUY`; they show a recovery/reassessment path.
- Entry levels are action-aware:
  - BUY/ADD → `ACTIONABLE ENTRY`
  - WAIT/HOLD → `POTENTIAL ENTRY`
  - AVOID/SELL/TRIM → `REFERENCE ONLY`
- Equal/rounded zones such as `$28–$28` render as `~$28`.
- Technical risk level and fundamental thesis invalidation are separate.
- Bear/Base/Bull valuation scenarios are restored whenever decision-grade valuation exists, including delta vs spot.
- Unsupported/failed valuation remains `Not established` rather than zero.
- Metric info buttons are click/tap accessible and show meaning, inputs, freshness, source, formula version and validation status.
- Duplicate Company Quality / Opportunity / Analyst Consensus / Data Coverage strip was removed from the Overview screen.
- Analysts are now explicitly `EXTERNAL ANALYST CONTEXT`.
- A cross-system consistency engine blocks/flags contradictory states before they reach the user.
- Ticker identity guards reject provider quotes for the wrong requested symbol.
- V64 backtest, Wilder indicators, validation gates, Alpaca/Twelve integrity and paper-only Trading Lab remain intact.

## Cross-system consistency failures

V64.1 detects:
- bearish + BUY/ADD
- hard veto + BUY/ADD
- Bear > Base or Base > Bull
- support > resistance
- malformed price-zone ordering
- unavailable valuation represented as numeric zero
- missing proof metadata on the thesis headline

An error forces the new-money Today decision into `AVOID` (or a risk-reducing/holding owner state) rather than displaying a contradictory recommendation.

## Policy reachability audit

A deterministic synthetic grid over thesis, opportunity, company quality and timing produced all expected new-money families, including BUY. It is a software-policy test, not performance validation.

The permanent regression suite also contains explicit fixtures for:
`BUY`, `ADD`, `WAIT`, `HOLD`, `TRIM`, `SELL`, `AVOID`, and `NO ACTION`.

## Deployment

No new Vercel cron is introduced. `vercel.json` remains `{}`.

V64.1 intentionally has a new engine/policy version so its decision outcomes are not silently mixed with older policy generations.
