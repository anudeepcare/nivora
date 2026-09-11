# AURYN V9.5.7 — Search Architecture + Appearance Studio

## Root-cause PWA search repair
- Autocomplete results are now navigation links instead of buttons, so legacy `.aurynSearch ... button` rules cannot collapse result rows on iPhone/PWA.
- Analyze-arrow styling is scoped only to the form action button.
- Legacy `.aurynSearchResults` global rules were removed.
- Result rows are isolated in `SearchBox.module.css`, full-width, keyboard-safe and vertically constrained on mobile.

## Appearance Studio
- Simple theme names remain: Classic, Noir, Sapphire, Racing Green, Bordeaux, Arctic, Bronze.
- Live preview added.
- Readability size, density, number format, and motion preferences are grouped in one studio.
- Motion preference persists as `auryn-motion`; reduced motion disables decorative transitions/animations without touching data updates.
- Theme and personalization values continue to restore before first paint via localStorage for browser/PWA relaunch persistence.

## Theme contract hardening
- Added explicit foreground/background ownership for thesis/evidence/model-audit surfaces that previously inherited dark-theme text incorrectly.
- Approved product geometry and decision/market engine behavior are unchanged.

## Verification
Run `npm run gate:v957`.
