# AURYN Mobile System Rebuild Design

## Goal
Make AURYN behave as one coherent iPhone product in Safari and installed Home Screen/PWA mode, from authentication through every authenticated surface.

## Root cause
The current application has years of overlapping responsive rules across product and premium stylesheets. Standalone iOS changes safe-area and viewport behavior, exposing contradictory header/search/content/bottom-nav offsets. Individual pages also impose independent min-width/grid assumptions. The rebuild establishes one shell contract and lets pages compose inside it.

## Shells
### Public/Auth shell
Login, registration/create account, password reset and auth states. No authenticated search or bottom navigation. Uses safe-area-aware centered content and one document scroller.

### App shell
One safe-area-aware sticky header, optional search row in normal document flow, one page content region, one fixed bottom nav, and exactly one matching bottom content reserve.

### Stock shell
App shell plus compact security masthead and horizontally scrollable/sticky evidence navigation. Ticker/logo/current price must remain visible.

## Mobile rules
- `100dvh` for viewport-height behavior; no `100vh` mobile app-shell assumptions.
- Header owns `safe-area-inset-top` exactly once.
- Bottom nav owns `safe-area-inset-bottom` exactly once.
- Account/help menus are viewport overlays and do not affect layout.
- No page may horizontally overflow.
- No fixed-width desktop card/grid is inherited on <=760px.
- PWA standalone and normal Safari use the same geometry.
- 390, 393 and 430px are explicit contracts.
- Desktop behavior remains unchanged except shared Technicals corrections.

## Technicals
Use compact mobile rows rather than equal-height CSS-grid cards. RSI uses 30/50/70 scale; MACD uses zero-centered histogram; Volume uses 1x baseline; Bollinger uses lower/mid/upper. Desktop remains compact and aligned.

## Portfolio
Mobile portfolio hero is one column, section nav scrolls horizontally, allocation and performance never exceed viewport, holdings are mobile cards, and every holding exposes View Research / Edit / Delete.

## Truth
No scoring, Market Truth, fast-price, portfolio calculation, or Trading Lab engine changes.
