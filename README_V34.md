# NIVORA V34 — Institutions + Technical Intelligence

## What changed

### Dedicated Institutions tab
Investor and Pro modes now expose a first-class **Institutions** tab instead of burying 13F research inside Fundamentals.

The Simple `Institutions` tile is clickable. It switches to Investor view, opens the Institutions tab, and scrolls directly to the evidence.

The tab shows:
- Report period
- Prior comparison period
- SEC dataset-through date
- QoQ reported share change
- Current vs prior reported shares
- Managers adding vs trimming
- New positions and exits
- Institutional score
- Add/trim breadth
- Reported value change
- Largest reported holders
- Biggest reported adders
- Biggest reported trimmers
- New reported positions
- Reported exits
- Per-manager current/prior shares, absolute change, % change, status, report/filing date
- Each manager's share of NIVORA's aggregated reported 13F shares

Important: the per-manager percentage of the reported 13F pool is NOT the institution's ownership percentage of the entire company. True company ownership % requires a period-matched shares-outstanding denominator.

### Correct 13F dates
The previous sync used the SEC dataset ZIP window end as `period_end`. V34 instead:
- reads `REPORTCALENDARORQUARTER`
- selects the dominant report quarter in each SEC filing-window dataset
- compares the latest dominant quarter with the previous one
- optionally reads actual filing dates from `submission.tsv`
- stores the separate SEC dataset-through date

The institutional API orders by newest `synced_at`, so the corrected re-sync wins over older cache rows.

### Technical intelligence
Investor mode now has a readable **Technical** tab. Pro mode keeps the deeper **Technical Lab**.

New actual technical metrics:
- RSI (14) value + plain-English state
- MACD (12/26/9) + histogram + bullish/bearish read
- 20D/50D moving-average alignment
- Current volume vs 20-session average
- ATR (14) as % of price
- DCA / accumulation confluence zone
- Bollinger-band position
- 20D realized volatility
- 52-week drawdown context

Pro retains:
- Confluence chart
- Fibonacci 38.2/50/61.8
- Elliott-style heuristic scenario
- Accumulation proxy
- DCA zone
- Raw NIVORA technical engine evidence

### Decision engine
Verified institutional filing evidence now contributes modestly to NIVORA's intelligence score:
- More weight in Long-term / I-own-it modes
- Less weight in Now / Swing modes because 13F is delayed
- Institutional contradictions can be surfaced (example: strong price trend while reported holdings are reducing)

The engine never treats delayed 13F as today's order flow.

### UX
- Simple remains decision-first and uncluttered.
- `Options` now says **On demand** before the options API is intentionally loaded.
- Long-term mode labels the first price area **DCA / Accumulation Zone**.
- Advanced evidence remains behind Investor/Pro.

## Required deployment step

Run this migration in Supabase SQL Editor:

`supabase/migrations/20260829_nivora_v34_institutional_dates.sql`

Then deploy V34 and manually re-run:

`GitHub Actions → NIVORA SEC 13F Sync → Run workflow`

The new sync should end with JSON similar to:

`{"ok": true, "symbols": ..., "reportPeriod": "...", "previousPeriod": "...", "datasetThrough": "..."}`

## Validation performed here
- TypeScript/TSX syntax transpilation passed for StockClient, intelligence engine, institutional API, and health API.
- Python compile check passed for `sync_sec_13f.py`.
- A complete Next.js production build could not be run in this isolated environment because dependency installation timed out before the `next` executable was installed.
