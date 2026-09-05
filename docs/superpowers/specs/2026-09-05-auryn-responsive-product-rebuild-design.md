# AURYN Responsive Product Rebuild Design

## Objective
Rebuild AURYN's presentation layer as one coherent, responsive product system instead of layering new styling over legacy NIVORA/V65/AURYN CSS. Preserve working intelligence, market-data, Supabase, portfolio, authentication, calibration, and paper-trading behavior unless a UI contract must be adapted.

## Problem confirmed from current code and screenshots
- `app/globals.css` is a 1,456-line legacy/global stylesheet and remains loaded before `app/auryn.css`.
- `app/auryn.css` attempts to become authoritative while legacy selectors still exist.
- `app/v65-responsive.css` contains a second responsive/design system and legacy V65 tokens/selectors.
- Login/register use multiple historical class generations (`osAuth`, `v18Auth`, `v44Auth`).
- `StockClient.tsx` is 833 lines and mixes data orchestration with a large presentation tree.
- Desktop structures are being compressed for mobile rather than intentionally recomposed.
- Excessive shells, cards, borders, pills, nested wrappers, and duplicate search affordances obscure hierarchy.
- Portfolio mobile content can overflow/clamp and bottom navigation can cover content.

## Product principles
1. Answer first, evidence second.
2. One visual system and one responsive system.
3. Whitespace, typography, and separators before cards.
4. Cards exist only for genuinely grouped/interactive objects.
5. Desktop and mobile share data/components but may use different composition.
6. No horizontal page overflow at supported phone widths.
7. Bottom navigation never covers content.
8. No fixed-width child may dictate mobile viewport width.
9. Preserve AURYN black/ivory/gold identity with restrained use of gold.
10. Keep legal/risk language clear without dominating primary workflows.

## Architecture

### Styling
Create a clean AURYN design-system layer with tokens for color, typography, spacing, radii, borders, elevation, widths, and responsive breakpoints. New product surfaces must use new scoped classes/components only. Legacy selectors are removed from active rebuilt screens rather than overridden with escalating specificity or `!important`.

`globals.css` becomes reset/base-only. The active AURYN product system lives in focused stylesheets by responsibility. `v65-responsive.css` must not control rebuilt product pages.

### Application shell
`AppShell` owns desktop header, mobile header, primary navigation, account access, and safe content insets. Desktop navigation remains top-level. Mobile uses a fixed bottom navigation with explicit safe-area and page-bottom compensation. Search has one deliberate location per context.

### Authentication
Login/register are rebuilt around a dedicated AuthShell. Desktop may use a restrained two-column composition. Mobile becomes a compact single-column page with branding above the form; no giant black residual canvas, overlap, or clipped logo/title.

### Research landing
One primary search. The page explains the six evidence dimensions without six heavy boxes. Search is the clear action.

### Stock analysis
Split `StockClient` presentation into focused sections while preserving existing data/decision logic:
1. Security header and quote freshness
2. Primary AURYN call
3. New-money and owner action
4. Entry / reassess / risk plan
5. Key evidence
6. Price/technical context
7. Business and fundamentals
8. Valuation
9. Earnings and analyst expectations
10. Catalysts/news
11. Institutional/options evidence when available
12. Thesis, risks, limitations, provenance

Scores are not repeated merely because multiple legacy components expose them. Progressive disclosure provides deeper Investor/Pro evidence without forcing all content into the initial viewport.

### Portfolio
Portfolio is rebuilt as:
- capital summary and condition
- period/performance context
- capital priorities
- visual drivers/allocation/risk
- holdings

Desktop uses density and columns where useful. Mobile uses a true single-column composition. Holdings become scan-friendly rows/cards with bounded content rather than oversized fixed-width structures.

### Monitor and Trading Lab
Adopt the same shell/tokens/spacing/controls. Trading Lab remains explicitly paper-only and preserves execution/risk gates.

## Responsive contract
Target validation widths: 360, 390, 430, 768, 1024, 1440, and 1728 CSS px.
- `document.documentElement.scrollWidth <= clientWidth` on rebuilt pages.
- Touch targets are at least 44px where practical.
- Text does not clip or overlap.
- Fixed bottom nav includes `env(safe-area-inset-bottom)` and matching content padding.
- Horizontal scrolling is allowed only inside an explicitly designed data scroller, never at page level.
- Desktop max-widths are fluid and centered; no mobile fixed widths inherited from desktop.

## Behavior preservation
Do not rewrite investment scoring simply to support the redesign. Existing Supabase calls, auth semantics, market-data providers, engine decisions, portfolio calculations, calibration, and Alpaca Paper execution remain intact unless tests prove an interface adaptation is required.

## Testing
- Existing unit/integration tests must continue to pass.
- Add structural tests for shell/navigation and key decision rendering.
- Add responsive browser tests/screenshots for auth, research, stock analysis, portfolio, monitor, and lab at representative mobile/desktop widths.
- Add overflow assertions.
- Run TypeScript/build validation before packaging.
- Verify no active rebuilt screen imports or depends on the legacy V65 responsive stylesheet.

## Migration strategy
Rebuild shared foundation first, then Auth, Research, Stock, Portfolio, Monitor/Lab. Remove legacy CSS only after each migrated surface no longer depends on it. This prevents visual regression from a destructive one-shot stylesheet deletion while still ending with legacy presentation removed from active product surfaces.

## Non-goals
- No live-money trading.
- No redesign-driven changes to scoring weights.
- No unnecessary provider/database migration.
- No preservation of legacy markup purely to minimize diff size.
