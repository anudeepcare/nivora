# AURYN V3.8 Forward Intelligence Design

## Goal
Rebuild AURYN's recommendation semantics so long-term business quality, growth runway, execution trajectory, sector/theme context, macro regime, valuation, and technical timing are evaluated separately and then reconciled into one explainable decision.

## Core model
AURYN must answer four separate questions:
1. Business/Thesis Quality — is this a durable, attractive business over 1–3 years?
2. Future/Execution — is evidence supporting the future path and are milestones being delivered?
3. Entry Quality — is current price/timing attractive enough for new capital?
4. Owner Action — what should an existing holder do, given thesis state and portfolio context?

Current-quarter weakness, missing valuation, or weak technical timing may lower entry quality but must not by themselves convert a strong multi-year thesis into REDUCE/AVOID. REDUCE/EXIT requires structural thesis deterioration, hard vetoes, or repeated forward deterioration.

## Forward intelligence
Add strategic context derived only from available evidence: archetype/theme classification, five-year revenue/profit trend, company fundamentals, recent earnings trend, analyst revisions, material news/catalysts, filing/financing risk, and broad market regime. Strategic context is evidence-gated; it never assumes a theme merely from a ticker.

For capital-intensive AI infrastructure, separate growth runway and execution from financing risk. Negative current free cash flow is not automatically bearish if contracted/forward growth and execution evidence remain constructive; however dilution, leverage, and weak forward evidence can still invalidate the thesis.

## Recommendation semantics
Expose a canonical decision bundle:
- `longTerm`: STRONG / CONSTRUCTIVE / MIXED / WEAK
- `newMoney`: BUY / ACCUMULATE / WAIT / AVOID
- `owner`: ADD / HOLD / WATCH / REDUCE / EXIT
- `entry`: ATTRACTIVE / SELECTIVE / WAIT / OVEREXTENDED / WEAK

Portfolio cards consume `owner`, stock cards show both `longTerm` and `newMoney`, and owner context is shown near the security header.

## UI
- Keep current ivory/black/gold visual language.
- Increase analytical copy and score labels on mobile.
- Show qualitative labels beside scores.
- Global mobile search appears only when the page has no visible primary search; research landing keeps a single primary search.
- Compact desktop and mobile footer; mobile footer is one legal line plus compact links.
- Interactive portfolio composition remains, but each metric opens an explanation before deeper navigation.
- Normalize iOS/PWA icon to the same AURYN mark used in-app.

## Constraints
- No hard-coded recommendations for APP, IREN, MU, or any ticker.
- Themes/macros are contextual modifiers, never standalone buy signals.
- Technicals affect entry/timing more than long-term thesis.
- Missing evidence reduces confidence instead of being treated as negative evidence.
