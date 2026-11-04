# Website activation

Source includes public SEO, a sitemap, robots.txt, social image, About and Pace guides, and support@auryninvest.com. No deployment, DNS edit, account creation, email or analytics transmission was performed by this build.

## Deployment settings
- Set `AURYN_APP_URL=https://www.auryninvest.com`; verify both apex and www redirect consistently to the www canonical.
- Keep `AURYN_ENABLE_PREVIEW` unset in production. The route also checks localhost hostnames; preview is never a production data fallback.
- Search Console: verify the domain through its DNS method, or set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` with your actual verification token and rebuild. Submit `https://www.auryninvest.com/sitemap.xml` after deploying. Private routes explicitly return noindex; only public routes appear in the sitemap. Do not block private routes in robots if crawlers need to read their noindex directive.
- Run `node scripts/check-website.mjs https://www.auryninvest.com` after deployment to validate public responses. This is read-only.

## Optional analytics
1. Create/select the GA4 web stream for https://www.auryninvest.com and set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to its actual G- identifier. The default is blank and no analytics script loads.
2. **Disable all Enhanced Measurement in the GA4 stream**, including browser-history page views, site search, outbound clicks, form interactions, scrolls and downloads. AURYN emits its own sanitized events. Do not add a second Analytics/GTM snippet or enable Google Signals, ads personalization, user-provided data collection or User-ID.
3. Rebuild and deploy. Before consent, confirm no googletagmanager.com or google-analytics.com requests. Decline must leave all product features usable. Accept loads the script. Privacy/Settings → Analytics preferences → Decline stops future events and clears accessible _ga cookies.
4. Check DebugView/Realtime using a test session: one page_view per coarse route transition, plans_view, signup_start, research_open, search_select, search_result (success/empty/error and duration bucket), and page_performance (LCP rating). Research ticker paths are reduced to /research; queries/fragments/referrers/titles contain no user data. No event includes emails, holdings, balances, tickers, search strings or support messages. GA itself receives network/device metadata after consent.
5. Observe signup intent → plan view and search error/latency trends. No fabricated account/payment completion events are emitted; actual conversions need explicit integration at the verified successful account/payment boundary.

## Support email
`NEXT_PUBLIC_AURYN_SUPPORT_EMAIL` defaults to support@auryninvest.com. Public and account surfaces expose the same address. Existing support requests still require durable database save; email failure cannot report a sent receipt.
For delivery, configure a verified sending domain, `RESEND_API_KEY`, `AURYN_SUPPORT_FROM`, and set `AURYN_SUPPORT_EMAIL_ENABLED=true` deliberately. `AURYN_SUPPORT_NOTIFY_EMAIL` defaults to support@auryninvest.com. Preview environments never send. Verify SPF/DKIM/DMARC in the mail account before enabling; those DNS/provider settings are outside the source archive.

## Evidence and limits
Local tests cover deterministic rules and guarded transport failures. Browser QA uses labelled synthetic preview data. No GA ID, mail-domain credentials or independent production quote feed were supplied for activation. This build does not claim verified live analytics collection, live email delivery, universal security coverage or investment outperformance.
