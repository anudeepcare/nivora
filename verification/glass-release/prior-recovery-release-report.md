# AURYN product recovery — release report

Complete source package, including the earlier intelligence upgrade and the latest approved recovery. **The local software checks pass; some approved capabilities and production acceptance remain incomplete.** This is not a certificate that every metric, entitlement or broker flow is available.

Baseline: `bbdce50b92384acefb3db79978423da92a75e1ea`, branch `codex/auryn-intelligence-upgrade`. Verification: October 16, 2026. No remote push, Vercel deployment, account-role change or order submission occurred. Two research database migrations were applied; the paper-safety migration remains pending after a connector request-state error.

## What changed

- Cleaner mobile-first research: concise takeaway and business/valuation/timing lenses, a persistent interactive chart, financial trend graphics, compact technical summaries and optional evidence details. Mobile navigation has four global destinations; further research tabs live in More. Light/dark styling and logo fallbacks are retained.
- Today shows saved holdings/watchlist quotes, recorded research changes and dated events. Discover reads the current canonical snapshot store instead of relying on an empty legacy table. Available metrics and observation dates are displayed; unsupported/stale records are not promoted to buy calls.
- Shared canonical financial and planning evidence: business and long-term thesis remain separate from technical entry timing. Reported financial charts use compatible periods, currencies and filings. Conflicting/restated values remain flagged. Specialist valuation methods without operating evidence remain unavailable.
- Accumulation proposals use the same stock/portfolio evidence and recorded cash/exposure. Automatic 0/0.5/1/2x proposals and optional manual multipliers remain subject to cash, concentration, budget, funding/thesis and pause gates. Journal originals are immutable. These are research cash-allocation previews, not leverage, orders or validated return promises.
- Technical integrity fixes cover missing volume/benchmarks, date alignment, flat RSI/MFI, crypto annualization, displaced Ichimoku history, full-window VWAP/profile evidence, prior-level breakout confirmation and missing-data weights through the canonical path.
- Charts preserve canvas, zoom and draft planning state through range/section changes; wheel scrolling moves the page. Metric help, URL section restoration, saved research and custom Fibonacci controls are verified.
- Ownership, news, options and optional storage failures retain independent availability states. Missing values are not invented zeros or confident scores. Existing Supabase, Twelve Data, Finnhub, SEC and Alpaca Paper paths remain in the source.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Current full release suite | **936 passed, 0 failed, 0 skipped** | `verification/product-recovery/verify-release-final.log` |
| Production build / TypeScript | **Passed**; final CSS contrast correction rebuilt separately | Same log; `verification/product-recovery/build-final.log` |
| Responsive browser | **112 passed, 0 failed, 0 client runtime errors** | `verification/next-build/recovery-browser-final/report.json` |
| Browser scope | 320/390/1440px, light/dark; 7 routes and 10 research sections, 6 interaction flows, 4 production financial-response renders | Same report |
| Final independent review | Five important findings fixed with regressions; no critical finding reported within scope | `verification/product-recovery/FINAL_REVIEW.md` |
| Direct provider connections | Stock/crypto quote responses; Finnhub profile/logo; Alpaca Paper ACTIVE, unblocked, clock returned | `verification/product-recovery/connections.json` |
| Supabase research storage | Workspace/source-review tables exist with RLS enabled | Deployment status below |
| Historical inventory | Earlier 1,475/1,791 passed; 316 failed, separately investigated; not rerun or relabeled as current success | `verification/next-build/HISTORICAL_REVIEW.md` |
| Production dependency audit | Earlier check found zero known production vulnerabilities; not a future guarantee | `verification/next-build/dependency-audit-final.json` |
| Full-source archive | CRC, every manifest hash and tracked source preservation checked by packager | `SOURCE_MANIFEST.json` and package result |

The final desktop wordmark contrast correction passed 40 additional browser checks with zero client runtime errors after its final production build. Its report is `verification/next-build/recovery-brand-final/report.json`. No standalone lint script is configured; the build/typecheck is not called a separate lint pass. Node 24.19.0 / Next.js 15.5.28 were used. No new paid provider was added.

Browser QA uses a production build with public-only synthetic Supabase settings and intercepted account/database/quote/decision/broker responses. Four MSFT/IREN/ASTS/APP financial-response renders use saved real public production responses, while their surrounding account/quotes/decisions remain fixtures. This tests rendering, not source accuracy or investment performance. `.next`, local secrets and installed dependencies are excluded; deployment must rebuild with the real environment.

## Connections and deployment status

| Connection | Confirmed | Still required |
|---|---|---|
| Twelve Data | Existing private credentials returned MSFT and BTC/USD quotes | Deployed environment parity, every symbol/endpoint entitlement and quota behavior |
| Finnhub | Profile, company name and logo response | Ownership/options/estimate entitlements are independent; missing feeds remain unavailable |
| SEC/company evidence | Real public production company responses retrieved for four companies | Source conflict review, company-specific operating/forward facts and supported valuations |
| Supabase | Reachable; workspace and company-source-review migrations applied with RLS | Live owner-to-owner isolation acceptance, auth/email flow, paper migration |
| Alpaca Paper | Account ACTIVE, trading/account not blocked; read-only clock responds | Trusted administrator setup, scheduler/config parity and controlled order/acknowledgment/fill/reconciliation acceptance |
| Vercel | Existing production remains separate | Push/merge this source, rebuild with real configuration, verify deployed commit and flows |

Research migration live versions are `20261016195707` and `20261016195621`, corresponding to the workspace and source-review source files. The paper migration attempt returned `Invalid or expired requestState`; a subsequent read confirmed `auryn_paper_control` and `auryn_manual_paper_orders` are absent. Apply `supabase/migrations/20261016155025_auryn_paper_execution_safety.sql`; it begins paused. Follow `GIT_AND_VERCEL.md` rather than rerunning the legacy schema. Credentials are not shipped in this ZIP.

## Explicit remaining scope

The approved 104-item ledger is preserved. B02 researched 6–12-month evidence, H02 complete sector/theme/correlation exposure metadata, and H04 complete transaction/benchmark account-performance history remain partial. Specialized infrastructure/space/pipeline valuation, cited moat/operating facts, and calibrated future-return probabilities are not manufactured from price or generic ratios. See `verification/next-build/REMAINING_GAPS.md`.

No real Alpaca Paper order/fill lifecycle, production owner role, physical iPhone/Safari, screen-reader audit or independent unseen-period investment-performance study was verified. The older 661-fixture/27-anonymous results and historical reports are prior upgrade evidence; the current recovery report above supersedes their release claims. Approved boards are illustrative references, not exact pixel exports.

## Delivery

Start with `START_HERE.md`, then `GIT_AND_VERCEL.md`. The ZIP includes all source, the lockfile, workflows, migrations, executable tests, approved boards, current reports and curated visual comparisons. It is not just a patch or build output. Never overwrite your `.git` or private `.env.local` when copying it. The Git instructions address the earlier restore-branch/non-fast-forward issue without force-pushing.
