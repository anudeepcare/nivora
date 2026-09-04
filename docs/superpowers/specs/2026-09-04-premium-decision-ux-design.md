# NIVORA V65.4 Premium Decision UX Design

## Goal
Make every primary NIVORA screen decision-first: a non-expert should understand what to do, why, at what price, and what changes the decision within seconds.

## Product rules
- Preserve V65.4 engine, safety, calibration, paper-trading, provider and portfolio business logic.
- Present decisions before metrics. Avoid dashboard-like walls of cards.
- Use green for constructive/actionable, amber for wait/selective, red for risk/reduce/avoid, and neutral ink for facts.
- Numbers retain useful precision and thousands separators; do not round price zones into misleading whole-number ranges.
- Explain thresholds in plain English instead of exposing unexplained formulas.
- Deep research is progressive disclosure but must look unmistakably interactive.
- Help uses one small inline information glyph. Popovers must stay within the viewport on desktop and become a bottom sheet on mobile.
- Mobile first, desktop polished; no hidden click targets or overlapping help.

## Analyze / stock decision
The first viewport shows long-term view, today's action, concise reason, current price, preferred entry, owner action and reassessment condition. A bullish company above its preferred range becomes BUY ON PULLBACK rather than a contradictory BUY NOW. Research opens through a strong CTA and uses clear section pills: Fundamentals, Valuation, Technicals, Risks and Outlook. Each section provides decision-relevant evidence rather than duplicate scores.

Threshold language is translated into meaning. Instead of only `Thesis ≥ 72 · Company quality ≥ 65 · Opportunity ≥ 65`, the UI explains that the business case, company quality and current setup must each clear the minimum required for new capital. Where useful, the exact current value and threshold remain visible.

## Portfolio
Remove the redundant “Start here” framing. Lead with total value, deployable cash, attention and concentration, followed immediately by priorities when evidence exists. Empty priority placeholders are hidden. Holdings expose an obvious Decision action and the add-investment interaction is explicit.

## Trading Lab
Keep it paper-only and operational. Lead with one status sentence and one Run paper check action. Show checked, actionable, paper orders and realized result. Each recent decision states traded/no trade/blocked and a plain-language blocker/change condition. System plumbing remains behind one clearly labeled disclosure.

## Authentication and legal
Login/register use a premium split layout, strong hierarchy and concise product value. Legal links remain accessible and copy avoids performance guarantees. Public legal/methodology/calibration surfaces keep evidence-before-confidence language.

## Testing
Add UI contract tests for help behavior, research navigation, plain-language threshold explanations, portfolio simplification, Trading Lab blocker clarity and auth modernization. Run the full engine/UI suite and production Next.js build before packaging.
