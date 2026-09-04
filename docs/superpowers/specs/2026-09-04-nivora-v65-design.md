# NIVORA V65 Coherence, Proof, Portfolio & UX Design

**Date:** 2026-09-04

## Goal
Turn V64.2 into a coherent, auditable, mobile-first decision platform whose numbers are traceable, long-term thesis is stable unless evidence changes, portfolio supports equities/crypto/cash, and Trading Lab visibly proves execution and calibration.

## Core architecture
Evidence providers feed independently versioned **Slow Thesis** and **Fast Market** engines. An archetype-aware Valuation/Scenario engine consumes point-in-time fundamentals. Decision Policy combines thesis, opportunity, timing, valuation, risk and portfolio context without allowing price movement alone to rewrite slow evidence. Trading Lab consumes frozen decisions and records an immutable path: snapshot → decision → intent/no-intent → risk gates → broker event → fill/cancel → P&L/alpha → matured outcome.

Calibration uses champion/challenger. V65 production parameters remain frozen; historical point-in-time replay and forward paper results may create challengers, but promotion requires explicit evidence gates and a new engine version.

## Product requirements
- Three explicit decisions: **Long-term** (BUY/STARTER BUY/HOLD/REDUCE/AVOID), **Today/New Money** (BUY NOW/BUY IN ZONE/WAIT FOR CONFIRMATION/DO NOT CHASE/NO NEW CAPITAL), **Existing Owner** (ADD/HOLD/TRIM/EXIT).
- Every score includes provenance: current/prior value, evidence-as-of, last meaningful change, why it changed, validation state.
- Company Quality/slow Thesis changes only from new fundamental evidence or corrected source data; quotes alone can alter Timing/Opportunity/Entry/Risk Pressure.
- Valuation shows Bear/Base/Bull with assumptions when defensible; otherwise show the appropriate alternative valuation framework instead of a large empty panel.
- Portfolio asset model is EQUITY/CRYPTO/CASH. Cash contributes to value/allocation/deployable capital but receives no equity score. Crypto uses crypto-compatible market logic.
- Portfolio Health is rebuilt from measurable concentration, diversification/effective positions, liquidity/cash, position risk, scorable thesis quality and action burden. No arbitrary floor.
- Trading Lab distinguishes broker connectivity from execution and learning. `CONNECTED` means connectivity only; `LEARNING` requires matured outcomes. Every no-order path exposes a concrete reason.
- Production weights cannot silently self-modify. Challenger promotion is explicit and versioned.
- One responsive design system provides MetricCard, MetricInfo, DecisionBadge, SectionHeader, ResponsiveGrid and EvidenceStatus across the app.
- MetricInfo works by tap/click/keyboard, Escape and outside-close; small screens use a readable sheet/popover.
- Money uses locale grouping; unavailable values are not zero; zones collapse duplicate/meaningless ranges; precision is economically meaningful.
- Dead/legacy code is removed only after static/dynamic reference, test, typecheck and production-build verification. Useful history moves to docs/archive.

## Proof requirements
Historical validation must be point-in-time/no-lookahead, net of realistic spread/slippage assumptions, benchmark-relative, and split into train/tune vs untouched out-of-sample periods. Forward Alpaca paper evidence remains separate. The UI must never mix backtest, OOS and forward-paper results as if equivalent.

## Mobile acceptance
Validate at 320, 375, 390, 430, 768, 1024 and desktop widths. No horizontal overflow, clipped popovers, hover-only information, tiny tap targets, broken two-line action labels, or competing card styles.

## Release gate
V65 ships only when typecheck/build/tests pass; mixed-asset portfolio works; score provenance and horizon-specific decisions are visible; valuation fallback is useful; Trading Lab diagnostics prove its actual state; and dead-code/design-consistency audits pass.
