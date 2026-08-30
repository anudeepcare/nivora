# NIVORA V45 — Market Intelligence + Mobile Reliability

V45 focuses on the two problems that matter before wider testing: the scanner must be real and transparent, and mobile must never hide or corrupt the decision.

## Product changes

### Today is no longer Discover
- **Today** shows only signals that changed enough to deserve attention: actionable setups, exit/risk signals and watchlist changes. It is allowed to show zero opportunities.
- **Discover** is the market opportunity board. It reads from a persisted rolling US-stock scanner and ranks qualified candidates by setup quality, entry quality, evidence confidence, risk safety and validated reward/risk.

### Full-market scanner architecture
1. `scripts/scan_us_market.py` syncs the eligible United States stock universe from Twelve Data `/stocks`.
2. A rolling batch is scanned on each GitHub Actions run and persisted to `nivora_market_scan`.
3. `app/api/discover/route.ts` reads the latest persisted scan.
4. The UI explicitly reports scan coverage. It does **not** claim a full-market scan until at least 90% of the active universe has been refreshed.
5. If the persisted scanner is not configured yet, NIVORA falls back to a seed scan and labels it as fallback/partial.

This architecture is deliberate because a free Twelve Data plan cannot refresh thousands of daily histories instantly. Increase the configured batch size / lower the pause only when your Twelve Data plan supports the required credits.

## Price-plan safety
Reward/risk is now sanity checked before it is shown:
- thesis break must be below the planned entry midpoint;
- target must be above the planned entry midpoint;
- risk distance must be at least 0.4% of the planned entry;
- computed R:R above 12x is treated as invalid instead of being displayed;
- invalid geometry shows `—` / `Pending` and receives a ranking penalty.

This removes cases like 4,490x or 8,633x R:R from the Discover board.

## Mobile fixes
- fixed active bottom-nav text/icon disappearing on the dark selected tile;
- added bottom safe-area padding so fixed navigation never covers decision content;
- compressed horizon / position / Simple-Investor-Pro controls;
- made the decision hero shorter;
- fixed research tabs covering the first evidence row;
- changed Decision evidence to a compact 2x2 grid on phones;
- improved touch sizes and active/focus states.

## Required setup
1. Run `supabase/migrations/20260830_nivora_v45_market_scanner.sql` in Supabase.
2. Add these GitHub **Production environment secrets** if they are not already there:
   - `TWELVE_DATA_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Optional GitHub environment variables:
   - `NIVORA_SCAN_BATCH_SIZE` (default `24`)
   - `NIVORA_SCAN_PAUSE_SECONDS` (default `8`)
4. Run **NIVORA Market Scanner** manually once from GitHub Actions. The hourly schedule then continues the rolling refresh on weekdays.

For a low-credit Twelve Data plan, use a small batch and accept slower full-universe refresh. For a production paid plan, raise the batch size and reduce the pause according to your actual credit allowance.

## Accuracy language
V45 improves consistency and removes known geometry/ranking bugs. It does **not** claim 99% investment accuracy. Accuracy must be established by the existing forward-validation / Decision Ledger infrastructure using frozen decisions and subsequent outcomes.
