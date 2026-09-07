# AURYN V4.1 — Canonical Decision & Stock Experience

## Release purpose

V4.1 makes the stock research experience use one canonical AURYN decision and one aligned evidence shell from the top of the page through every research tab.

## Decision-engine corrections

- Missing numeric evidence (including valuation) is no longer coerced from `null` to `0`.
- Missing valuation is treated as unavailable evidence, not as an automatic bearish `0/100` input.
- AI/HPC data-center hybrids can override a legacy mining label when explicit business evidence supports the transition.
- Power infrastructure remains in the infrastructure valuation path instead of falling through to a generic hypergrowth model.
- AI/data-center infrastructure valuation can derive a preliminary price-to-sales cross-check from reported annual revenue and market capitalization when provider P/S is missing.
- AI infrastructure does not require a fragile point valuation to form a decision; missing valuation reduces evidence coverage/confidence instead.
- SELL is structural: a weighted score alone cannot issue SELL while the long-term thesis remains intact. SELL requires a broken thesis or a hard governance/solvency veto.
- Strong long-term evidence can keep the investment action at HOLD/BUY even when short-term technicals are weak. Technical weakness still affects NOW/SWING timing and position staging.

## Canonical stock-page experience

- One V4 decision surface is the authoritative action.
- Beginner / Pro / Extreme Pro depth controls are compact inside the decision surface.
- Thesis, Business, Earnings, Technicals, Ownership, Catalysts and Options share the same stock-page shell and decision context.
- The Thesis tab consumes the same V4 thesis/action rather than publishing a second legacy WAIT/MIXED verdict.
- Detached legacy market-context, pulse, score and pro-cockpit strips were removed from the global stock page.
- Duplicate technical readouts were consolidated; technical evidence remains supporting evidence rather than a second independent stock verdict.
- Orphan CSS from removed legacy sections was deleted.

## Verification completed in this environment

- `npm test`: 332/332 tests passed.
- `npm run audit:v65`: PASS.
- `git diff --check`: PASS.

## Build-environment note

`npm run build` could not execute in this sandbox because dependencies are not installed and the `next` binary is unavailable (`next: not found`). The ZIP includes `package-lock.json`; run `npm ci && npm run build` in Vercel or a normal networked CI/development environment before promotion.

No `.env.local`, secrets, `.git`, `node_modules`, `.next`, or generated engine-test output is included in the release ZIP.
