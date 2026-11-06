# AURYN Decision Canvas — preprod handoff

This full-source build changes the Overview, Home, public entry, authentication presentation, Value workbench, technical layout and shared controls. Existing financial calculation functions and account flows are retained.

## Visible changes
- AURYN View presents an assessment, business/price/timing evidence, the principal counter-case, completed and developing Pace, chart, supported scenarios and checkpoints.
- Business warnings no longer overwrite the completed price-only Pace multiplier. Forming readings remain separate and provisional.
- Optimistic scenario sensitivities carry a visible caution rather than implying an established entry cushion.
- First-use Home offers a clean research path without fabricated holdings. Watchlist and holdings paths use different wording.
- Value separates model scenarios from optional editable assumptions. Yield figures include percent units.
- Technical studies retain their formulas and help; desktop pairs chart with evidence and mobile stacks them.
- Public/login screens explain AURYN; contact starts with an empty reply address. Public legal pages link to support rather than exposing the owner's address.
- Congressional disclosures load on demand for stocks, retain reported ranges, dates and original official filings, and distinguish stock/options records. This requires provider entitlement; it is not a real-time trade feed.

## Scope and limits
No production deployment, real account mutation, billing charge, email or live provider request was made. Browser checks use isolated illustrative previews. Physical iPhone Add to Home Screen acceptance remains required; existing PWA shell geometry was preserved, not certified as universally fixed. Existing DCA rules are not proven to outperform ordinary DCA and are not numerically equivalent to competitors. No new cited filing AI, broker connection, automatic thesis-monitoring service or historical performance edge is claimed. Unsupported valuations are not invented.

## Preprod deployment
1. In your existing repository, switch to your preprod branch before copying this source into it.
2. Keep your environment settings and account data. Do not copy node_modules or .next.
3. Run `npm ci --include=dev`, then `npm run verify`, then `npm run test:api`.
4. Inspect `git diff --stat` and `git status --short`; do not stage secrets.
5. Commit and push your preprod branch. Test the Preview URL with a real account.
6. Confirm login/logout, free/Pro access, quote freshness, portfolio totals, stock/crypto search, mobile keyboard, and iPhone installed-PWA safe areas before promoting.

No new database migration is introduced by this build. Existing support-inbox setup is documented in docs/SUPPORT_SETUP.md.
