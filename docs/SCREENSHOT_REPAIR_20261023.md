# Screenshot follow-up — 23 October 2026

This update addresses the eleven screenshots supplied after the launch/desks ZIP. It supersedes the earlier 436-test status.

## Root causes and source changes

1. **8:30 AM CDT quote timestamp:** Twelve Data documents `timestamp` as the candle opening time, `last_quote_at` as the latest minute quote and `extended_timestamp` as the extended-price timestamp. The normalizer previously used the candle opening. Regular observations now prefer `last_quote_at`. An available newer extended price is paired with `extended_timestamp`, never the regular close timestamp, and daily change is recomputed only when previous close is supplied. Completed-minute fallback clears incompatible extended fields. Tests reproduce the BE-style opening-time/closing-price mismatch and extended-price pairing. Reference: https://twelvedata.com/docs . This corrects normalization; live provider roundtrip and entitlement are not certified.
2. **Google/X:** A read-only request to the live nivora project's public Auth settings returned Google disabled, legacy Twitter disabled and no enabled X flag. Frontend code cannot enable these or create provider credentials. The new public `/api/auth/providers` route exposes only Google/X enabled booleans (or unknown on outage), caches bounded configuration reads and never returns keys or unrelated settings. Buttons are disabled with an explanatory email alternative when configuration explicitly says disabled; availability automatically changes after providers are enabled and the cache expires. X OAuth2 is not silently mapped to legacy Twitter. Follow `LAUNCH_AUTH_SETUP.md`; do not place provider secrets in frontend code or chat. No live auth configuration was changed.
3. **Actual profile Settings sheet:** The previous revision changed the full Settings page, while the profile button opened the old long sheet. The sheet now has Appearance, Research and Account sections, compact accent/spacing controls, one scroll region and a busy/error state for sign-out. The full Settings page is retained.
4. **Home:** New calendar-led composition: the nearest scheduled report leads with its dated holding exposure; later events are chronological, followed by compact holdings-ranked news. The full returned event/news lists remain reachable with View all updates. Detailed coverage wording is behind one disclosure instead of filling the first screen. No portfolio-total duplicate or fabricated company insight is added.
5. **Public landing:** Replaced the public CSS owner, rather than appending a new layer of old marketing styles. New dark editorial hero, compact header, contrasting interactive sample, simpler feature sections, tighter mobile composition and footer. Sample values remain explicitly fictional; no live-data, subscriber or performance claim was invented.
6. **Stock metric strip:** Compact colored returns/market context and one shared observation caption replace four repeated large date blocks. Underlying measurements remain unchanged and metric dates are accessible on each item.

## Verification

- `npm run verify`: **439 tests**, route generation, TypeScript and production build passed.
- `npm run test:api`: **83 compiled API fixture checks** passed.
- `node scripts/test-auth-provider-api.mjs`: **3 additional compiled route checks** passed (disabled/enabled/unavailable, no configuration leakage).
- **12 local production-server HTTP checks** passed for public/auth/routing behavior.
- `git diff --check`: passed. Production compilation emitted no CSS warnings.

These are code, component SSR, fixture transport and local HTTP checks. They do not establish rendered visual acceptance, live OAuth completion, physical iPhone PWA acceptance or current provider-delivered prices. Google/X require the owner's developer credentials and live configuration. Existing PWA root/header/safe-area geometry, account data and monthly-v4 policy are preserved. No push, deployment, paid subscription purchase or live database write was performed.
