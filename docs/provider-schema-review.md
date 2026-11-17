# Provider schema review — 2026-11-17

This review uses provider-owned documentation, not live account responses. Credentials
and entitlements remain unavailable, so mappings are `documented-unverified`.

## EODHD fundamentals

Official reference: <https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds>

- New integrations should use `/api/v1.1/fundamentals/{ticker}`. Auryn now does.
- `General.CurrencyCode` is the listing currency. Statement currencies are
  `Financials.Income_Statement.currency_symbol` and
  `Financials.Balance_Sheet.currency_symbol`; all three must explicitly agree.
- Accounting values are commonly decimal strings. Auryn accepts only finite,
  non-empty numeric strings and rejects missing or non-numeric values.
- Financial rows carry `date` and `filing_date`. Scenarios use four contiguous
  quarters only when every filing was available by the requested as-of date.
- `Balance_Sheet.netDebt` is debt less cash, so calculated net cash is its negation.
  The legacy fallback requires both cash and total debt; missing debt is never zero.

## SentiSense analyst data

Official reference: <https://sentisense.ai/docs/api/analyst-ratings/>

- Consensus `currentPrice` is a dated reference price, not a live quote. Analyst
  consensus remains separate from EODHD’s delayed quote and calculated scenarios.
- Price-target analyst counts and rating counts are different populations and are
  not combined into percentages.
- Preview/sample envelopes cannot drive scenarios. Estimates require a non-preview
  response, matching ticker, explicit USD currency, and aligned annual periods.

## Acceptance gaps

- Live v1.1 nullability, restatements, split-adjusted shares, 53-week fiscal years,
  banks/insurers, ADRs, and non-calendar fiscal years are untested.
- SentiSense estimate currency placement and option, ownership, and earnings payload
  variants require live-schema capture from the entitled account.
- Options sentiment, transaction values, and earnings surprise details render only
  when documented fields exist; partial values are not guessed.
- Actual provider coverage remains 0 of the 512-symbol validation manifest.
