# Secondary Research: new presentation hierarchy

These are internal implementation decisions grounded in the user's existing requirements, not visual acceptance.

## Business / financials
A single reporting-period switch controls the whole view. Lead with three real business measures (sales, operating margin, cash after capital spending), then one full-width interactive financial trend explorer. Below the chart pair cash conversion with statement details. Keep advanced ratio interpretation and raw statements in an explicit disclosure, not another screen of default panels. Mobile retains all three period choices in one 44px touch row. Missing periods are never substituted silently.

## Valuation
Lead with the editable price-expectations model as the primary canvas. Directly below, place visible Bear/Base/Bull next to a concise pricing metric strip. Do not compare P/E and EV/sales by arbitrary bar length. Earnings yields stay within P/E. Manual projection is a secondary expandable tool; preserve entered state on collapse. Methodology remains in detail dialogs.

## Options
A command bar owns the view, expiration and advanced tools. A compact factual ribbon shows expiration/contract count, option-priced range when supplied, and two-sided quote coverage. Remove a redundant instructional 30-second card. Positioning chart is primary; chain remains a readable full-width table; volatility/gamma are reachable directly. Do not fabricate contracts for previews.

## News
Lead with the latest source-linked story and subsequent dated headlines in an open reading column. Company/broader relevance remains explicit. Earnings and filings stay in the supporting rail. Shorten permanent instruction text, preserving the relevance limitation in accessible help. No invented summaries or catalysts.

## Validation gates
Type/lint/test checks are necessary, not visual approval. Required desktop/mobile screenshots and actual controls must be checked on a permitted browser. Current local browser launch/connect failure blocks that validation. Live provider and authenticated states require independent checks beyond fixture previews.
