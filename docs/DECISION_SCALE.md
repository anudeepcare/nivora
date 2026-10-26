# Evidence scale on Overview — added October 25, 2026

Adds one interactive panel, **Weigh the evidence yourself**, at the top of the Overview (Snapshot) tab. Nothing existing was removed or reordered below it.

## What it does
- Each "stone" is evidence AURYN already computes for the company: reported-financial strengths and risks (`researchDecision().forCase` / `.against`), rule flags (severe flags weigh 3), the completed-price trend against the 50- and 200-day averages, and the eligible conditional Base case versus the quote (weight 2, only when the existing model is eligible and in the quote currency).
- When no eligible conditional case exists, one cautionary stone states that no company-specific value is established. This restates existing status; it adds no data.
- The reader can take any stone off. The beam tilts with the weights that remain and a plain sentence says the scale leans supportive, close to even or cautious.
- The existing rule labels (`decisionGuide`: "Considering a buy" and "If you already own it") are shown unchanged beside the scale, so the scale never replaces or contradicts them.
- Missing evidence creates no stone. If the guide reports missing or stale price/financial evidence, the panel says so. It never sets an order, position size, target or recommendation.

## Files
- `lib/decision-scale.ts` — pure logic (stones, balance, pan layout). Imports only existing lib modules.
- `components/DecisionScale.tsx` — presentation (SVG scale, toggle buttons with `aria-pressed`, live status text).
- `app/decision-scale.css` — uses shared tokens, so light and dark themes follow the app. Imported last in `app/product.css`; `pwa-shell.css` is untouched.
- `components/DecisionOverview.tsx` — two added lines (import and `<DecisionScale key={symbol} research={r} />`).
- `tests/decision-scale.test.mjs` — four tests against the MSFT fixture and synthetic stones.

## Limits
- Weights are a presentation choice (1 ordinary, 2 eligible conditional case, 3 severe flag), not a validated model. The lean is not evidence of future returns.
- No new dependency, environment variable, migration or endpoint. Not deployed.
- Rendered browser, mobile and installed-PWA appearance has not been checked. See `verification/DECISION_SCALE_CHECKS.md`.
