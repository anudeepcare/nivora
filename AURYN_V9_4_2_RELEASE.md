# AURYN V9.4.2 — Mobile Experience Repair + Responsive Technicals

## Mobile Research
- Removes dead space around search/security masthead.
- Explicit mobile masthead grid prioritizes identity and current market price.
- Bounds AURYN Call height while retaining action atmosphere and proof rail.
- Prevents horizontal page overflow.

## Technicals — desktop + mobile
- Dedicated responsive indicator grid.
- RSI has a 30/50/70 scale.
- MACD has a zero-centered positive/negative histogram treatment.
- Volume has a visible 1x baseline.
- Bollinger has lower/mid/upper position scale.
- Metrics without a valid normalized scale remain numeric/textual.
- Desktop uses balanced four-column evidence geometry; mobile uses two columns.

## Portfolio mobile
- Add Investment remains visible and unclipped.
- Portfolio section navigation scrolls horizontally rather than clipping the page.
- Holdings use compact mobile cards with a visible action menu.
- Action menu exposes View research, Edit position and Delete position.
- Portfolio and holdings are explicitly overflow-safe.

No scoring, Market Truth, fast quote, portfolio math or Trading Lab engine changes.

Verification: npm run gate:v942
