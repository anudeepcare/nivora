# AURYN V9.9.9.32 — One Decision + Horizon-Aware Research

## Product architecture
- One canonical brain, one visible AURYN Call.
- Standalone CIO hero removed. CIO remains an internal explanation/sizing layer and modal.
- AURYN Call now contains canonical New Money / Owner / Long Term, position sizing, active entry, confirm, setup invalidation, confidence/evidence, Why This Decision and What Changes It.

## Valuation
- Partial Fundamental Value placeholder replaced by compact adaptive Valuation Snapshot.
- Displays only evidence that exists, a concise AURYN read, and the exact inputs still needed.
- Bear/Base/Bull remains withheld until decision-grade.
- Full scenario presentation remains when fair value is decision-grade.

## Long-term roadmap
- Explicitly labeled WEEKLY PRICE STRUCTURE, not long-term investment rating.
- Separates ACTIVE WEEKLY SUPPORT from DEEP CYCLE SUPPORT.
- Deep-cycle support is explicitly not today's buy zone.
- Dynamic pivot semantics: HOLD ABOVE when price is already above the level; FUTURE RECLAIM when below.
- LONG-TERM STRUCTURAL FAILURE is separate from daily SETUP INVALIDATION.
- Volume participation and Accumulation / Distribution are separate metrics.
- Upside extensions remain gated by validated regime extension eligibility.

## What Matters Now
- Active daily entry is shown before deep-cycle structural context.
- Daily setup invalidation and long-term structural failure are described separately.

## Verification
- V9.9.9.32 tests pass.
- Full V31.1 -> legacy price-truth regression chain passes.
- TypeScript transpile diagnostics for modified TS/TSX files: 0 syntax diagnostics.
- Full Next build cannot run from this source ZIP because project dependencies/node_modules are not packaged.
