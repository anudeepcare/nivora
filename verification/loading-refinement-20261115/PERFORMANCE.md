# Loading refinement evidence — November 15, 2026

## Implemented, without calculation changes

1. PublicLanding defers the unchanged interactive PaceInstrument until the Pace guide is selected. Before this change, the static public-guide import pulled both frozen Pace models into the catch-all entry JavaScript used by Home, Research and Portfolio.
2. Portfolio requests the selected benchmark before the remaining holding histories. Each active loading effect still advances its queue sequentially, deduplicates a held benchmark, uses the same cache, stops on 401/403/429, and retains available history when a source fails. No request count, provider allowance, decision calculation or policy changed.

The scheduling change moves a cold benchmark from after all holdings to first. It adds no within-queue concurrency. As before, switching benchmarks may start the new benchmark while a shared request from the previous effect remains pending; the superseded effect does not advance its old queue. A slow uncached benchmark can delay the first uncached holding by one request; already cached series stay usable. It does not guarantee benchmark coverage when a provider cannot supply matching dates.

## Measured build payload

The before build is the November 14 system-audit candidate. The isolated after build applies only the two loader edits, identifying their effect independently. The final combined build additionally includes the completed November 15 UX refinements. Values below are bytes after gzip level 9, summed per emitted file, not network-transfer traces or real-user timing.

| Asset group | Before | Isolated loaders | Final combined |
| --- | ---: | ---: | ---: |
| Common layout + catch-all JavaScript, deduplicated | 650,564 | 221,686 | 221,688 |
| Catch-all page's own JavaScript chunk | 443,695 | 14,771 | 14,771 |
| Home including lazy workspace JavaScript | 689,628 | 683,804 | 683,573 |
| Research company including lazy workspace JavaScript | 776,244 | 775,034 | 775,219 |
| Portfolio including lazy workspace JavaScript | 683,826 | 677,651 | 677,686 |

The final shared entry JavaScript is 428,876 bytes smaller, about 66%. This is not a 66% reduction in complete Home/Research/Portfolio payload or a 66% speed claim: those workspaces still require the engine in their later chunks. Next reports the final catch-all First Load JS as 219 kB. Exact per-route JavaScript/CSS measurements and main-chunk hashes are in bundle-baseline.json, bundle-after-isolated.json and bundle-after-combined.json. Re-measure if further imports change.

## Verification

- The new loading-boundary and benchmark-priority regressions were run against the original code and failed for the expected eager-import and request-order reasons.
- 23 focused public/portfolio tests pass. These include click/keyboard guide navigation, pending benchmark switching, ordinary source failure, 401/403/429 queue termination, a held benchmark, cached benchmark and empty portfolio.
- All 1,484 tests pass on the isolated performance-only copy.
- Production build, explicit typecheck, lint and format check pass on that copy. Next emits its existing ESLint-plugin configuration warning.
- The final combined candidate passes 1,492 tests plus lint, formatting, explicit typecheck and production build; its verification log is in ../ux-refinement-20261115/verify.log. API checks are recorded separately in that folder.
- No deployment or live-provider change was performed.

## Observed baseline and remaining work

Read-only preproduction inspection showed a populated Home with priced holdings and loaded company updates while Pace still checked its sequential two-company batches. Portfolio preserved 25 of 28 available holding histories, showed the missing SPY comparison separately, and offered Retry missing history. These observations are pre-change evidence only, not verification of the local changes.

The browser inspection API did not expose the Performance API. LCP, interaction latency, live API waterfalls and physical-device performance are unmeasured.

Additional measured/code-supported bottlenecks remain:
- The common emitted CSS baseline is 932,721 raw bytes. Product imports a 992,390-byte legacy-panels source stylesheet. Safe reduction requires coverage across every supported screen and expanded state; it was not bulk-deleted.
- Home/Portfolio still import the calculation engine through workspace fallback guidance. Their server scan already returns decisions. Future removal of client fallback imports needs explicit preservation of cached/preview/offline behavior, not merely removing features.
- Home feed awaits the complete news fan-out alongside calendar results. The existing events/news endpoint distinction could support independent loading, while keeping source readiness honest and request budgets unchanged.
- Pace scanning checks two symbols per sequential request and calls full research for each. Prioritize visible/held companies and reuse per-symbol summaries before increasing concurrency or changing provider allowances.
- Research's 30-second freshness clock also changes PaceInstrument's evidence timestamp. A synthetic 1,306-bar local fixture showed median 28.95 ms for changing-timestamp paceEvidence calls versus 0.0033 ms for repeated calls on the same timestamp. These are Node microbenchmarks, not browser timings. Separating immutable calculation time from freshness time requires settlement and freshness regression coverage before editing; no such calculation change was made here.
