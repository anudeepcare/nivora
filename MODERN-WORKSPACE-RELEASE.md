# Modern workspace update — 2026-11-06

Cumulative source release, including prior navigation, recovery-routing and mobile cleanup fixes.

- Business: concise KPI row and cash-generation chart replace repeated introductory prose.
- Admin: compact statistics, member table, aligned feature settings and responsive mobile rows.
- Holdings: accumulation Pace badges and P0–P4 filtering.
- Home: qualifying P4/P3/P2 holdings and watchlist grouped together.
- Pace scan: authenticated, access-checked two-symbol batches; 15-minute summary reuse; background work stops scheduling when the view unmounts.
- Removed Changes since your last visit and the redundant research holdings-warning strip in the cumulative release.

## Verification

Production build passed. Full regression suite passed 1,082 tests; subsequently added Pace display/cache cases passed in the focused 10-test run. Browser checks at 390px and 1440px passed for public menu, home, research, financial charts, portfolio filters and locked password-reset entry. No client errors or horizontal overflow on those checked pages. Admin table layout checked with synthetic members; no live grants or billing actions executed.

## Deployment and remaining live checks

Apply source to preprod, deploy and check, then merge preprod into main. Do not copy environment files or dependencies from another environment.

Production AURYN_SUPPORT_NOTIFY_EMAIL was updated to support@auryninvest.com. This takes effect on the next production deployment. Zoho mailbox delivery has not been verified; send a contact-form message after deployment and check the support inbox. Owner login and notification recipient remain separate.

Production navigation performance, real password-recovery email flow and native iOS PWA behavior require live verification after deployment. Preview checks do not certify those flows. No database migration is introduced by this update.

## Follow-up refinement

- Mobile dock uses a 96% opaque surface, readable labels and a clearly bounded selected item.
- Holdings Pace selector uses a full-width mobile row; desktop holdings are denser.
- Watchlist and Holdings use consistent Pace chips; confirmed dates remain in chip tooltips. Crypto does not show an unsupported stock Pace warning.
- Admin has icon tabs, restrained category accents, compact summary counts, aligned grant inputs and shorter member rows.
- Earnings snapshot uses actual/estimate/surprise metrics. Scenario controls use directional and balance icons.
- Public home requests a light browser theme color; iOS web-app status style changes to default. Native iOS behavior still needs a device check.
- Admin Support now shows configured notification inbox/sender, disabled/test configuration and actionable provider errors after a manual retry. Provider acceptance is not claimed as inbox delivery. No migration required.

Email delivery remains an open production issue. Vercel settings are present but secret values were not readable; the cause of the latest missing email was not established. No real messages were sent during verification. Use Admin > Support after deployment to inspect configuration and retry, then check Resend delivery events for rejection, delay, bounce or suppression. If a test sender is configured, verify the sender domain before changing it to a domain address. Keep Zoho receiving records intact.

## Compact Admin structural rewrite

Admin now uses one scoped stylesheet replacing the previous stacked overrides. Removed summary cards and the wide preview band. Inline member counts and a small preview selector share the header; slim tabs lead directly to the member toolbar and table. Grant and Extend use one native modal with focus containment, Escape handling and close-on-success. Features use aligned setting rows; Payments and Support use the same compact section system. Existing authorization, API payloads and billing behavior are preserved.

Focused owner authorization and grant/extend interaction tests passed. Real grants and payments were not executed. Contact email delivery remains unresolved as documented above.
