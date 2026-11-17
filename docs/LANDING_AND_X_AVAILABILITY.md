# Landing actions and X availability correction — 23 October 2026

Supersedes the earlier statement that a missing X flag proves the provider is disabled.

The supplied Supabase dashboard screenshot shows Google and X / Twitter OAuth 2.0 enabled. A subsequent read-only public Auth-settings request shows Google true but omits X entirely. The application's availability parser incorrectly mapped omission to false. This was a source-code defect, not evidence of missing X credentials.

The parser now distinguishes explicit true, explicit false and absent/unknown. An absent X field allows the ordinary Supabase OAuth2 sign-in attempt; an explicit false still disables the button. Legacy Twitter is not substituted. The provider settings endpoint returns no-store responses and bounds its upstream settings cache to 60 seconds, avoiding a second CDN/browser layer of stale capability flags. No secrets or full Auth settings are returned.

Landing changes: larger primary/nav action buttons with mobile tap sizes; removed the complete “Before you begin” FAQ section; restored explicit blue SVG-bar fills and teal unfilled line-chart strokes so previews do not render as black bars/filled wedges. Legal/help pages and disclosures remain available in the footer.

The owner does not need to re-enter X credentials based on the old “not enabled” message. Deploy this source, reload login, and complete the X OAuth flow. Enabled configuration is not proof of valid credentials or a completed consent roundtrip; those remain live acceptance checks.

Tests cover explicit off/on, omitted X despite Google on/legacy Twitter off, and unavailable configuration. See `verification/landing-x-verify.log`, `verification/landing-x-api.log` and `verification/REPORT.json` for command results. No deployment, provider-configuration mutation or database write was performed.
