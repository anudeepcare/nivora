# AURYN Fast Market Data Architecture

## Goal
Make active-ticker price display behave like a real-time market product: fast research price first, independent execution verification second, deep research progressive.

## Architecture
A new server-only Fast Quote Lane retrieves a lightweight provider price without exposing provider credentials. It is research-display data, not execution authorization. StockClient requests it immediately and caches/coalesces it independently of `/api/analyze` and `/api/canonical`.

The canonical Market Truth layer remains authoritative for decision price and execution authorization. A fast quote may update the displayed live price while the canonical decision remains anchored to a verified live price or verified regular close. The UI labels this distinction quietly rather than replacing the price with a warning.

Search prefetch warms the fast quote endpoint for likely selections.

## Rules
- Never expose Twelve Data API keys to the browser.
- Fast quote can power display/research price, never automatic execution.
- Canonical decision price remains separate from display price.
- Missing change is `—`, never `0.00%`.
- Deep history/fundamentals/news/options never block the fast quote lane.
- Same-symbol requests share in-flight work and short-lived caches.
- If fast quote fails, existing canonical/reference price remains available.
