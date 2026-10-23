# Owner controls

Open Settings → Admin controls, or /owner. The shortcut is shown only to the configured owner. Paid and complimentary members cannot access owner APIs.

- People: enter an existing account email, choose 7/30/90 days or a custom expiry, and grant complimentary Pro. Friends retain access while voluntarily subscribing. End an individual grant or use the existing group action when needed; group revocation keeps its confirmation.
- Features: choose Everyone, Pro, Complimentary members or Off for each feature. Save explicitly. Separate watchlist and AI allowances remain owner-controlled; research tiers stay Free 100 companies/month and Pro unlimited.
- Payments: check Stripe connection and the monthly price without creating a charge, or open Stripe's dashboard. The result reports the actual connected mode; the UI does not assume live payments are verified.
- Preview access: view the app as Free or Pro without changing payments. Return to Owner for full access.
- Recent activity: collapsed by default, preserving the existing audit and usage records.

This is a presentation update; it does not change permissions, secrets, provider entitlements, database schemas, existing grants or subscriptions. No new SQL is needed. Deploy the source by committing and pushing it to your production branch. Physical-device visual acceptance and real-money payment lifecycle testing remain separate from local tests.
