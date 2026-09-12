# AURYN V9.8 — Three-Clock Valuation

## Engine change
V9.8 makes a hard distinction between:
1. Thesis clock (3–7+ years)
2. Valuation clock (1–5 years)
3. Tactical clock (days–months)

Technical price action can alter deployment/timing but cannot directly rewrite long-term thesis quality or independent fundamental Bull/Base/Bear values.

## Independent fundamental scenarios
`lib/auryn/v98/fundamental-scenarios.ts` accepts externally computed independent Bear/Base/Bull intrinsic values. Market price is deliberately not an input to value construction; it is used only afterward to compute implied annual return.

If independent values are missing, the engine returns no fundamental scenario rather than fabricating values from technical levels/current price.

## Thesis persistence
`lib/auryn/v98/three-clock.ts` separates durable business evidence from revisions/catalysts and tactical price evidence. Corroborated weakness across several durable evidence families raises deterioration; isolated technical weakness does not alter thesis score.

## Anti-anchoring gate
`lib/auryn/v98/valuation-audit.ts` measures how often independent Base values fall within ±2%, ±5% and ±10% of current market price. Large samples with suspicious ±5% clustering are flagged rather than silently adjusted.

## CIO integration
V9.7 CIO assessment can optionally consume an independent valuation-clock Base value. Expected annual return influences deployment quality while leaving Compounder Quality unchanged.

## UX lock
No app, component, CSS, navigation, PWA or layout changes were made in V9.8.
