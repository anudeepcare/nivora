# Free/Pro private-beta implementation

Goal: enforce configurable Free/Pro access, owner-only grants, and non-owner sample mode before licensed launch.

Approved constraints: preserve personal owner access; no real charges, no live data for non-owner beta testers unless external display rights are explicitly configured; retain saved holdings on downgrade; use current Next.js and Supabase. Stripe is not connected: hosted checkout/portal integration is blocked by account provisioning, so no pretend checkout or billing activation will be shipped.

Native tasks:
1. Test and implement a shared pure entitlement policy: defaults, feature gates, grant expiry, owner preview, payload projection.
2. Create a CLI-named SQL migration for private config, complimentary grants, usage and audit. Atomic month-based distinct ticker reservation; caller cannot write plan or grant tables.
3. Add authenticated access and exact-owner admin endpoints. Fail closed when enabled but unavailable. Apply restrictions before vendor calls, and project research payloads. Guard watchlist growth and AI usage server-side.
4. Add a compact plan panel and owner console; gate research, Home and portfolio insights consistently. Sample testing uses synthetic observations explicitly labelled throughout; no vendor fallback.
5. Test SQL permissions/concurrency and access APIs, production build and responsive panels. Document migration/owner setup and Stripe connection remaining.

Review focus: self-promotion; expired grants; parallel quota calls; cache leakage on downgrade; direct API bypass; sample/live confusion; no accidental Stripe charges.
