# Auryn clean presentation architecture

The user rejects another surface patch and authorizes rebuilding the entire presentation, including public, login/loading, Home, every Research tab, Portfolio, Watchlist, Settings and supporting screens. Existing reference images define proportions and hierarchy. The goal is a coherent, simple investment-research product, not a second visual skin or a copy of another company's branding.

## Boundaries
Preserve financial model/provider data contracts, auth/session, account/access, payments, mutation semantics, saved route/tab IDs, portfolio accounting, availability/freshness and source provenance. No production deployment, subscription or new API expense. No fabricated prices, performance or comparison parity. Clean ZIP only after validation; a test suite is not a substitute for visual acceptance.

## Architectural evidence
Product.tsx imports compatibility.css, which imports 43,294 lines of legacy-panels.css. There are 120 important declarations and repeated named compatibility-layer blocks. Important layer priority can beat unlayered component declarations, contrary to the file's introductory comment. Examples include .filter-input radius, .watchlist-toolbar input background/padding and mobile .holding-actions-cell placement. app/layout.tsx also imports foundation, appearance, surfaces, readability, mobile-glass and studio-glass. 85 component stylesheets coexist. Several primary stylesheets have long successive correction blocks. This does not prove every reported visual defect, but it explains why more overrides cannot establish a stable contract.

## Chosen direction
Use a new presentation foundation within existing Next/React architecture. Do not delete data or reset the application. Build explicit reusable frame/header/navigation/card/metric/table/form/dialog/loading/error/empty components with scoped CSS. Use neutral paper/navy text, sapphire navigation and blue Pace depth, semantic red/green/amber, restrained translucent surfaces with opaque accessible fallbacks. No large backdrop blur on entire scrolling pages. Canonical spacing 4/8/12/16/24/32 and12/16px radius. Numeric values use tabular numerals. Mobile375–430px first, then768 and1440 desktop layouts.

Rebuild layouts rather than wrapping every old component in another card. Each screen gets one primary answer, one evidence tier and optional detail. Research uses chart/decision, four summaries and compact metrics; cases remain distinct from analyst opinion. Public uses product promise + clear CTA + labelled illustrative chart, five-stage Pace overview, four workflows and evidence boundaries. No live-looking fabricated public stock values.

All screens migrate, not only one vertical slice. A first complete public+Research slice proves the primitives; Home/Portfolio/Watchlist/Settings and supporting routes follow in the same project. Each renderer must leave the legacy dependency before the compatibility import can be removed. Deleting the import wholesale before migration risks unstyled forms and inaccessible layouts.

## Acceptance
Contract tests pin every existing action and absent/loading/error/fresh data state. Source tests ensure rewritten entry points no longer import deprecated styles and no generic important overrides leak. Render acceptance should compare actual1440x1000,390x844 and320px pages, light/dark, focus/keyboard dialog behavior, content overflow, zoom and PWA safe areas. Current browser is unavailable: local Chromium socket permission failure and explicit cloud ERR_BLOCKED_BY_CLIENT. Do not bypass; any source progress must be labelled source-only until an authorized renderer is available.
