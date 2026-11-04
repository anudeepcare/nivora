## October 23 alignment refinement

Selected admin labels now use defined blue/blue-soft tokens in both themes. Preview precedes section navigation; grants use aligned responsive fields and a labeled member list. Settings membership/admin shortcuts are fixed-height compact rows, with membership state visible. No account grants, subscription rules or payment behavior changed.

Validation: 489 tests, TypeScript and production build passed. 18 Chromium component-layout checks cover all admin sections at 1440, 402 and 320 pixels, in light/dark themes, using synthetic member data. Physical iPhone and live account actions were not exercised.

# Owner controls

Open Settings → Admin controls, or /owner. The shortcut is shown only to the configured owner. Paid and complimentary members cannot access owner APIs.

- People: enter an existing account email, choose 7/30/90 days or a custom expiry, and grant complimentary Pro. Friends retain access while voluntarily subscribing. End an individual grant or use the existing group action when needed; group revocation keeps its confirmation.
- Features: choose Everyone, Pro, Complimentary members or Off for each feature. Save explicitly. Separate watchlist and AI allowances remain owner-controlled; research tiers stay Free 100 companies/month and Pro unlimited.
- Payments: check Stripe connection and the monthly price without creating a charge, or open Stripe's dashboard. The result reports the actual connected mode; the UI does not assume live payments are verified.
- Preview access: view the app as Free or Pro without changing payments. Return to Owner for full access.
- Recent activity: collapsed by default, preserving the existing audit and usage records.

This is a presentation update; it does not change permissions, secrets, provider entitlements, database schemas, existing grants or subscriptions. No new SQL is needed. Deploy the source by committing and pushing it to your production branch. Physical-device visual acceptance and real-money payment lifecycle testing remain separate from local tests.
