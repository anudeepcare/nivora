# Auryn r32 · Plaid-inspired appearance

This full source snapshot builds on the r31 source deployed to preprod at
`47e0e42893c28f5765673f2e01334e9ee971314a`. It is supplied for manual deployment;
no Git push, account change, database migration or deployment was performed.

## Review paths

- Public: Home, Explore categories and keyboard dismissal, Sample, Sign in,
  Recovery, About, Pace, Track record, Portfolio check, Pricing, Contact,
  Help, Methodology, Terms, Privacy, Risk and Reliability.
- Main workspace: Today, Research and its lenses, Portfolio, Watchlist,
  Compare, Discover and Options/Market (including stock and ETF screeners).
- Secondary workspace: Settings, Owner, Plans, Alerts, Strategy Lab,
  Monthly Plan, Paper Trading where enabled, and Release Notes.

Home has a floating navigation, three-column Explore menu on desktop and
a compact open menu on phones, a contour hero and two-large/three-small
product cards. Signed-in pages share light/dark surfaces and use their
existing controls, layout preferences and route data. The phone retains its
navigation dock and latest Research ticker/quote/compact Pace header.

The public example diagrams are not price data or simulated results. Signed-in
routes still call existing authorized providers and account endpoints. No
data, access entitlement, sign-in method, forecast or financial calculation
was replaced for the redesign.

## Manual deployment and acceptance

Deploy the source to preprod with the existing environment configuration and
sign in there. Check Home + Research > Atlas (e.g. BABA), Market/Screener,
and Portfolio in both themes. Verify live quote freshness/availability,
current Pace, the three scenario values, and actual Portfolio history
against the previous preprod version. Inspect both desktop and a real phone.
For source checks use Node 24, `npm ci`, then `npm run build`.

Do not treat route or component tests as evidence of device rendering or
live account-data verification. The packaged source does not include the
restricted/offline Pace research datasets or runner.
