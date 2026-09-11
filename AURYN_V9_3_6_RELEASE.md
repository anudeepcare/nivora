# AURYN V9.3.6 — Premium Product + Opportunity Engine

## Product principle

AURYN should calculate more than it shows. The user gets one clear, premium decision experience; the engine retains deep evidence underneath.

## Data authority

**V9.3.5 canonical snapshot remains the data authority.** V9.3.6 introduces no new price/history/provider fetch path. Market Truth, security identity, persisted research, action map, setup, and canonical decision continue to come from the consolidated V9.3.5 path.

## What changed

- Added deterministic opportunity lens using available evidence only.
- Missing valuation/evidence reduces coverage and conviction instead of acting like a bearish zero.
- Added Bull/Base/Bear **Scenario balance · not probability**. It is explicitly uncalibrated until prospective V10 validation earns probability calibration.
- Rebuilt the Research first screen into a premium decision hero + chart + key metrics + scenario/setup explanations.
- Added one canonical key-metric grid: setup, pattern, entry/recovery zone, confirm, support, major support, T1/T2, invalidation, reward/risk, relative strength, participation, volatility.
- Added a mobile-first two-column metric system with fixed bottom navigation and horizontally scrollable evidence tabs.
- Added a premium stylesheet loaded after legacy styles to eliminate accumulated visual conflicts without changing engine semantics.
- Unified Portfolio, Monitor, and Trading Lab visual hierarchy using the same AURYN palette, spacing, card language, and mobile behavior.
- Runtime AI/Astra remains unnecessary.

## Reliability rule

The V9.3.6 UI is a pure consumer of existing canonical evidence. It must not call Twelve Data, Alpaca, or any other market-data provider directly.

## Release gate

Code readiness requires:
- V9.3.6 opportunity/scenario tests
- V9.3.6 Research/mobile/cross-product UX contracts
- complete AURYN regression suite
- V9.3.5 canonical gate and preserved Market Truth/reliability gates

The code gate intentionally ends at:

`CODE_READY_LIVE_VALIDATION_REQUIRED`

Vercel remains the production compiler/deployment gate, followed by deployed canonical 30 → 100 → 500 audits.

## Visual acceptance mockups

The release includes the approved visual targets under `docs/mockups/`:
- `auryn-v936-desktop-concept.png`
- `auryn-v936-mobile-concept.png`

The values shown in mockups are illustrative; production values must come only from the canonical V9.3.5+ snapshot layer.
