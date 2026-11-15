# Mobile layout repair — 2026-11-04

Corrected collapsed mobile search caused by a broad 42px search-box selector; form inputs now remain full width with 16px text. Restored visible portfolio holdings cells hidden by obsolete global mobile table rules, with responsive labeled cards and a two-column summary. Avatar has equal 44px dimensions. Discover remains available in account tools and is removed from primary navigation. Research tab scroll offset uses measured header height. Viewport requests initial/maximum scale 1 and userScalable false at the user's explicit request.

Verification: 886 tests pass; production build including type validation passes. Browser checks in a 390px iframe confirm portfolio document width equals its available viewport, all holdings cells are visible, and search APP returns results. Switching Business, Valuation, Technicals, Overview produced no horizontal overflow. Screenshot shows illustrative preview holdings. Temporary iframe test page and development-only frame-header override were removed before build.

Limitations: this was not a physical iPhone test. iOS/browser accessibility policies can override zoom restrictions; keyboard, pinch and installed-PWA behavior still need physical-device confirmation. No production deployment performed.
