# Useful Free access and real account data

This update removes the automatic demo workspace from authenticated accounts. NVDA, MSFT, AAPL and the sample cash balance remain only in the explicitly opened public/design preview. No database records are deleted or seeded. Each signed-in user sees their own saved workspace; a new account starts empty.

Free now includes the full Overview, company news and Home, with 100 distinct researched companies per UTC month. Basic portfolio holdings remain usable. Business, Financials, Value, Technicals, Analysts, Advanced, richer portfolio insights and AI retain their configured Pro gates. Owner feature rules can still override defaults. Pro retains unlimited company research and its existing separate watchlist/AI allowances.

Research tab names no longer repeat Pro. Opening a paid tab provides one contextual explanation and a Plans link. Free portfolio pages hide duplicate locked insight boxes. Settings provides Membership access; Plans explains Stripe checkout and links to payment terms/privacy. The terms describe renewal, period-end cancellation, billing references and card handling. AURYN stores account/portfolio and subscription metadata, not full card numbers or card security codes. Do not tell users that AURYN stores no data.

## Deployment
Deploy and push the changed source, then wait for that commit's Vercel Production deployment. No new SQL migration is required for these changes. Existing rules with only news:free inherit the new Overview/Home defaults.

Market access is separate from subscriptions. If `AURYN_EXTERNAL_DATA_LICENSED=false`, the deployment intentionally refuses external market requests for nonowners. Neither a Free upgrade nor a Pro purchase fixes that setting. After confirming your provider permissions for this use, set `AURYN_EXTERNAL_DATA_LICENSED=true` in Vercel Production and redeploy. Both Free and Pro use the real provider pipeline. No global sample-data banner is rendered; any unavailable data is identified by the affected section. Prices retain actual observation timestamps and are never relabeled live merely because the deployment is enabled. Missing data remains missing rather than replaced with demo data.

Live Stripe setup remains in STRIPE_PRODUCTION_LAUNCH.md. This update does not alter secrets, activate live billing, grant free Pro automatically, or process a real charge.
