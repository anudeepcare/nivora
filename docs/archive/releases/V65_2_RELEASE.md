# NIVORA V65.2 — Decision-first UX

## Product direction
- First-glance decisions, evidence on demand. NIVORA should feel like an investment product, not an admin dashboard.
- Long-term thesis, today's entry action and owner action stay distinct.
- Fundamentals and technicals remain deep underneath the simple decision surface.

## UX
- Replaced large information-icon controls with a subtle 16px `?` help affordance.
- Help is concise: meaning + why it matters. Internal formula/version/source/UNVALIDATED terminology is removed from consumer help.
- Removed user-facing `UNVALIDATED · heuristic` labeling.
- Reduced Portfolio metric density; secondary health-component wall is hidden from the primary experience.
- Portfolio uses stronger financial hierarchy, compact opportunity surfaces and financial-number alignment.
- Trading Lab prioritizes execution state, actual paper activity and proof; secondary empty performance metrics and redundant legends are removed from the primary experience.
- Mobile help uses a compact bottom sheet; primary grids collapse cleanly.
- Ticker/action emphasis and selective green accents improve scan speed without turning the product into a colorful dashboard.

## Engine integrity
- V65.2 preserves thesis/timing separation, starter-buy paths, falling-knife guard, hard vetoes, quote-integrity gates, portfolio risk gates and champion/challenger learning controls.
- Engine/policy versions are advanced to V65.2 so new evidence is not silently mixed with V65.1.

## Verification
- 192/192 engine and product-contract tests pass in the build workspace.
- A full Next.js build could not be completed in the packaging environment because dependency installation timed out and left the local Next binary unavailable. Vercel remains the final Next.js/strict-TypeScript build gate.
