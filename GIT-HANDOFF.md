# AURYN 1.0.0 — company identity and portfolio hierarchy

This is the complete application source, not a patch. Approved public landing, pricing and authentication source files are unchanged. Existing features, mobile metric correction, Research chart paging, removed Watchlist panels and control contrast isolation are retained.

## Current UX

- Company cards use filled rounded gradients, without top strips. Featured company palettes cover the supplied screenshots. Other symbols receive stable decorative fallback colors rather than the same gray.
- Where possible, cards sample a representative color from the existing loaded logo image at 24×24 pixels. White/transparent canvas pixels are excluded. Cross-origin, invalid and unavailable images retain the fallback without new network requests. This is decorative identity, not performance or a claim about an issuer's official brand guide.
- Dark-theme logo tint is reduced and company names stay fully opaque.
- Portfolio summary: charcoal net-value gradient; signed return gets a soft red/green treatment; cash and margin receive restrained category gradients. The chart/table canvases remain clear. Falling/rising historical series use red/green independently from unrealized return.
- Allocation identity is stable by symbol. Company logos and fallback palettes do not encode a recommendation.
- Watchlist rows use a compact action/Pace link plus entry/holding context. Full evidence remains available through the research link. Large inline Pace instruments and the lime row wash are removed. The two previously removed note/guidance panels remain absent; existing note data is not deleted.

## Data and activation

No new dependencies, schema migration, market-data entitlement, paid feed, broker action or production deployment is introduced by this UX revision.

Existing research-workspace document/observation/alert-event tables and RLS must already be installed. For account checkpoints and signed exposure-alert baselines, configure a stable server-only `AURYN_MARKET_SNAPSHOT_SIGNING_KEY` of at least 32 characters. Existing service-role key or sufficiently long cron secret remains a fallback. Rotation invalidates prior signatures; never use a `NEXT_PUBLIC_` prefix.

Options trade tape remains disabled unless `AURYN_OPTIONS_FLOW_ENABLED=true` and existing Alpaca credentials, data access and display rights are configured. It is a bounded historical page with optional polling, not a streaming feed. Saved checkpoints are discrete recorded views. Alerts use the existing check/cron paths; simulation is not broker execution. See the area-by-area coverage document for retained features and operational boundaries.

## Validation

- Full suite: 1,055 tests passed, zero failures/skips.
- Final focused identity/paging/logo checks: 9 passed.
- TypeScript, production build and changed CSS Modules passed.
- Nine API regression scripts use synthetic/mocked transport; final results are recorded in the verification report.
- Public/auth/pricing files compared unchanged against the prior source package.
- Archive CRC, per-file SHA256 manifest, required-source presence and private configuration exclusions are checked by `scripts/package-source.py`.

Browser preview is unavailable: no fresh screenshot, installed-iPhone/PWA or whole-app visual/accessibility certification is claimed. No production deployment occurred.

The managed verification host intermittently returns `ENOTEMPTY` when Next removes `.next/export` after static generation. Verification uses a temporary external Node preload adding bounded `fs.rm` retries. Neither application source nor Next dependencies are patched; the helper is excluded from the package.
