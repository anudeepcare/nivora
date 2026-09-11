# AURYN Final Mobile UX Consolidation Design

## Goal
Deliver one coherent iPhone/PWA experience without stacked responsive override layers, while repairing the desktop decision-footer spacing regression.

## Architecture
1. Keep one authoritative `app/auryn-mobile.css` loaded after desktop product/premium styles.
2. Remove versioned mobile CSS imports from layout.
3. Render a purpose-built mobile stock masthead in `StockSecurityHeader`, while preserving the desktop masthead separately.
4. Keep the fixed PWA header / opaque iOS status bar architecture from V9.4.5.
5. Reflow Portfolio, Technicals, Research, auth and app routes inside one viewport contract.
6. Add an explicit desktop decision footer layout for ownership note, action buttons and market levels.

## Mobile Stock Masthead
- Row 1: logo + ticker + tiny position badge on left; price + change/live state right.
- Row 2: company/sector metadata.
- Row 3: four compact market facts.
- No centered position pill.
- Tabs directly follow the facts strip.
- Header/search/company/hero composition should use materially less vertical space.

## Mobile App Chrome
- 50px app header content height + safe area.
- 44px search.
- Fixed header; app shell reserves one exact top slot.
- Bottom navigation remains safe-area aware.
- No horizontal page overflow.

## Portfolio / Technicals
Preserve the structural one-column and compact-card fixes from V9.4.5, but place them in the single authoritative mobile stylesheet.

## Desktop Decision Footer
Ownership note, Add to Watchlist, Track Position, Plan/Confirm levels sit in one compact aligned footer directly under decision logic. No large dead vertical band.

## Non-goals
No engine, scoring, Market Truth, pricing, portfolio math, or Trading Lab decision changes.
