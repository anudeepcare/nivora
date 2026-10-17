> CURRENT RELEASE: `verification/midnight-release/VERIFICATION_REPORT.md` supersedes the older verification results below.

# Historical verification report

This file records the earlier chart/mobile release. For current product recovery use `../RELEASE_REPORT.md`, `product-recovery/verify-release-final.log`, `next-build/recovery-browser-final/report.json` and `next-build/requirements.json`. The old test counts and live observations below do not certify this update.

---

# AURYN current verification

Current revision: **chart interaction, short-range history and mobile glass-menu fixes — 16 October 2026 UTC**.

| Gate | Result |
| --- | --- |
| Release acceptance | **760 passed, 0 failed, 0 skipped**, across 168 complete test files |
| Production build, lint and TypeScript | **PASS**, rebuilt after final application changes |
| Chart/research browser | **44 tab/theme/width cases**, 11 tabs at 390/1440px in light/dark; no page overflow/runtime errors |
| Chart behavior | Wheel and mobile touch page scrolling, explicit zoom/reset, 1D/1W bars, failure clearing/retry, decision-before-chart, weekly dates and nested spacing passed |
| Mobile menu | **24 navigation transitions across 6 configurations**, 320/390/430px, light/dark; equal widths, readable labels, 44px+ targets, account menu bounds and Escape dismissal passed |
| Live history | **ETH/USD and ZETA: 1D and 1W passed** using the existing Twelve Data account; 96/168 crypto and 26/35 equity observations returned |
| Focused independent review | Cache-error recovery finding fixed; all 8 chart regressions passed independently; no remaining important finding |
| Historical aggregate | Last measured **649 passed / 82 failed** in the prior premium release; not rerun for these focused changes; known failures remain disclosed |
| Full-source archive | Prior package paths retained; current file inventory and hashes in `SOURCE_MANIFEST.json` |

The complete updated source builds locally. **This is not certification of fully operational live production.** The update has not been pushed or deployed by this session. Physical iPhone Safari, deployed authentication/email/CRUD, and actual intended paper submission/fill/cancellation remain unverified. Existing configuration blockers remain in `LIVE_READINESS.md`.

The 44 browser cases use intercepted APIs and synthetic market fixtures; the four live-history probes separately exercised read-only Twelve Data calls through the shipped history-normalization module. No account data or order was changed. No new subscription was added. Browser tests ran against a production build with fixture public Supabase settings; `.next` is excluded and deployment must rebuild with actual settings.

Evidence: `logs/chart-fix-release.log`, `logs/chart-fix-build.log`, `chart-fix-browser-report.json`, `mobile-menu-browser-report.json`, `chart-live-provider-report.json`, `chart-fix-tested-source-hashes.json`, and `chart-fix-source-completeness.json`. Red/green regression logs retain the original range/scroll/cache failures. `CHART_FIX_VISUAL_REVIEW.html` indexes the latest captures; earlier premium captures, approved boards, broad 208-route cases and 41 interaction checks remain historical evidence in the package. `PRE_CHART_FIX_VERIFICATION_REPORT.md` preserves the preceding report.

## Review details

The independent review reproduced an HTTP-200 provider-error body being cached before validation. The route now validates before cache insertion and success recording, keeps request coalescing, and uses a versioned chart cache key. A regression using the actual route/cache implementation proves error → provider recovery → cached valid history, with two provider calls for three requests.

The initial automated touch-scroll helper did not generate native scrolling in this Chromium runtime. A direct touchStart/move/end sequence was then used and passed over the chart. This is browser emulation, not physical Safari evidence. Test startup now waits for initial network settlement to avoid observing a replaced chart during research hydration. Final visual captures use fresh pages (`chart-fix-captures.cjs`) because this headless Chromium runtime retained stale fixed-layer paint after scripted scrolling; DOM positions remained correct.
