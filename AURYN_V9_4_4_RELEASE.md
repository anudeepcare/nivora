# AURYN V9.4.4 — Mobile-First App / iOS PWA Repair

This release treats the installed iPhone PWA as a first-class app surface.

- One safe-area-aware sticky AURYN header.
- Search remains in normal document flow and no longer floats over Portfolio/Research.
- Account popover is viewport-fixed, bounded, and closes on route changes.
- Stock identity and live price are forced visible in the mobile masthead.
- Research home first viewport is compact.
- Login/Create Account use one compact mobile brand area; duplicate product-link footer is removed on mobile.
- Portfolio intro is single-column and width-safe.
- Bottom navigation and page content both account for iOS safe-area bottom inset.
- Technical evidence is sequential on mobile to eliminate paired-row whitespace; desktop evidence cards are compact.
- No scoring/Market Truth/portfolio math/trading engine changes.

Verification: npm run gate:v944
