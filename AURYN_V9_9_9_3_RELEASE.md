# AURYN V9.9.9.3 — Portfolio Interactions + Market Data Reliability 8.2

## Market data
- Preserves V9.9.8.1 equity/ETF reliability governor.
- Adds dedicated Coinbase public-market fallback for crypto.
- BTC, ETH, SOL and supported crypto symbols normalize to BASE/USD and use CRYPTO_24X7.
- Twelve Data remains a second crypto source when configured.
- Coinbase's current ticker response uses the fresh server retrieval timestamp for display authority when no provider timestamp is supplied. This is display-only; execution verification remains separate.
- Cross-provider disagreement protections remain intact.
- No API-plan upgrade is assumed.

## Portfolio UX
- Desktop Add Stock/Crypto/Cash is compact; mobile remains full-width.
- Holdings sortable by Name, Value, P/L, P/L %, Weight and AURYN action.
- Holding rows navigate to Research.
- Driver bars navigate to Research.
- Position Matrix bubbles navigate to Research.
- Position Matrix adds hover insight (symbol, weight, P/L) and uses a broader semantic palette for readability.
- Mobile sorting scrolls horizontally and chart interactions remain touch-sized.

## Preserved
- Consolidated same-ticker weighted-average behavior.
- V9.9.9.2 Premium Portfolio UX.
- V9.9.8.1 equity/ETF market-price behavior.
- CIO formulas/thresholds and autonomous workflows.
- No SQL/Supabase migration.
