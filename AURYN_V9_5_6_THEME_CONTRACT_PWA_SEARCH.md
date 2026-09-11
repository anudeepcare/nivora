# AURYN V9.5.6 — Theme Contract + PWA Search

## Scope
- Layout remains locked.
- Theme names simplified to Classic, Noir, Sapphire, Racing Green, Bordeaux, Arctic, Bronze.
- Theme choice, text size, density and number format persist in localStorage.
- Appearance is restored synchronously in the root layout before first paint to avoid PWA relaunch flashes.
- Theme architecture now uses paired semantic background/foreground contracts for page, card, soft, chrome, hero and chart surfaces.
- Search autocomplete results are isolated in a CSS Module so legacy/global descendant selectors cannot clip or overlap mobile/PWA rows.
- Mobile result rows reserve their own action column and keep ticker/company/exchange text in a constrained left column.
- Financial positive/negative semantics remain independent of decorative themes.

## Verification
Run `npm run gate:v956`.
The V9.5.6 regression suite also checks WCAG-style contrast for the primary theme surface pairs.
