# AURYN V3.8 — Forward Intelligence

## Decision architecture
- Added evidence-gated strategic context built from multi-year fundamentals, growth runway, recent execution, material company/news context, theme/archetype evidence, financing risk and low-weight market regime context.
- Reduced the ability of one weak earnings period or short-term technical weakness to overwrite a strong multi-year business thesis.
- Added canonical decision separation: Long-term thesis, Future & Execution, New Money, Owner Action and Entry Quality.
- REDUCE / EXIT now requires aligned structural deterioration or hard-veto evidence rather than merely weak timing, unavailable valuation or a single weak period.
- Capital-intensive AI infrastructure explicitly separates growth runway from financing/capex risk.
- Business quality now weights multi-year SEC evidence more heavily than a single current snapshot.

## Product / UX
- Stock decision card now leads with long-term thesis and separates new-money and owner actions.
- Scores include qualitative labels and plain-English guidance; Risk Pressure remains inverse (lower is better).
- Ownership control moved beside the stock identity instead of floating below the decision stack.
- Mobile evidence navigation shows four core sections plus a compact More group.
- Mobile global search appears when the primary Research search is not visible; duplicate search is suppressed while the primary search is on screen.
- Search results are keyboard-safe and height-limited on mobile.
- Portfolio map is interactive: allocation and concentration measures explain themselves before linking to holdings.
- Portfolio owner labels no longer blindly repeat a lower-context scan action.
- Desktop and mobile footers are substantially smaller.
- PWA / Apple home-screen icon is generated from the exact AURYN in-app sigil geometry.

## Verification
- V3.8 focused regression suite: 10 / 10 passing.
- Engine TypeScript compilation via `tsc -p tsconfig.engine.json`: passing.
- Modified TS/TSX syntax-transpile check: 10 files, 0 syntax-error files.
- Full legacy engine/product suite remains at its existing baseline: 269 / 286 passing, with the exact same 17 historical failures as V3.7.1; no additional legacy-suite failures were introduced.
- `npm run build` cannot run in this source artifact environment because dependencies are not installed (`next: not found`). Vercel/npm dependency installation remains the production compile gate.
