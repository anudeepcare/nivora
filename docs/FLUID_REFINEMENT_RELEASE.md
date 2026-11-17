# AURYN Fluid — full-source preprod release

Based on the approved third all-metrics study. This release refines every screen family with neutral surfaces, consistent sans-serif typography, less repeated blue styling, compact controls and graphical metric groups. It preserves existing data and account functions. Mock figures are never substituted for real research.

## What changed

- **Overview:** one compact assessment/Pace header, followed by operating metrics and actual annual charts, price scenarios/multiples, the price chart with technical readings, and ownership/next-event context. Crosscheck, risk, holder context, methodology and destinations remain available.
- **Metric explanations:** operating, valuation, ownership and technical values have contextual help. Missing values are omitted rather than turned into zero. Negative free cash flow remains a risk colour. Bank/REIT/crypto model applicability remains explicit.
- **Scenario integrity:** historical price-risk cases keep their own reference price, date, horizon and sample caveat even if a quote is absent. They are never labelled business fair value. A missing reference produces no invented zero-percent return. Company cases and analyst targets remain distinct.
- **Research tabs:** Business, Financials, Value, Technicals, Analysts, News, Advanced and Options retain their full tools. Unnecessary gradients and heavy containers are reduced; unavailable market multiples no longer create an empty pricing section. Financial charts, statements, technical formulas, scenario assumptions and options education remain available.
- **Home:** compact greeting, investment/session context, focus, contributor chart, exposure, calendar, news and companies without the recurring tinted panel grid. First-use and watchlist-only paths remain separate from portfolio accounts.
- **Portfolio/Watchlist:** clearer summaries and rows, consistent headings, retained balances/managed investments/margin, allocation/risk views, filters/editors and quote freshness.
- **Settings/Plans/Owner/support:** consistent reading width, controls and account navigation, retaining membership/access tools and real checkout/manage destinations.
- **Public/auth/help/legal:** coherent type and neutral surfaces, preserved mobile and social/email flows; the explicitly illustrative research preview remains readable under dark theme.
- **Mobile:** same information hierarchy with readable metric rows, compact identity and clear assessment/Pace. Existing PWA viewport and safe-area mechanism is preserved.

## Deployment — preprod only

No new SQL migration, API key, environment variable or paid subscription is needed for this UI release. Keep all existing environment settings. Do not rerun old migrations simply to install this ZIP.

1. In your existing repo, switch to your preprod branch **before** copying files:

   ```bash
   cd ~/Downloads/AURYN
   git switch preprod
   git pull --ff-only origin preprod
   ```

   If your branch has another name, use that existing branch. If Git reports local changes or divergence, stop and inspect it; do not force-push or reset.

2. Extract the ZIP. Copy the contents of its `AURYN` folder into that repo root. Preserve `.git` and your local `.env` files; there is no `product` subfolder.
3. Verify:

   ```bash
   npm ci --include=dev
   npm run verify
   npm run test:api
   git status --short
   git diff --stat
   ```

4. Review the changed files. Then:

   ```bash
   git add -A
   git commit -m "Refine AURYN all-metrics experience across app"
   git push origin preprod
   ```

   Never stage private `.env` files, keys or user exports. Existing ignore rules exclude generated output and dependencies.

5. Test the Vercel preprod URL with a real account. Confirm quote timestamps, a company with negative FCF, a bank, crypto, supported and unsupported valuation cases, portfolio totals, settings persistence and membership access. Check installed iPhone PWA at initial launch, while searching with the keyboard open, after returning from another app and across tab changes. Exercise payment/email/OAuth acceptance separately with appropriate account permissions and preview safeguards.
6. Promote to production only after those acceptance checks and separate approval. This delivery does not push or deploy code.

## Verification and limits

See `verification/REPORT.json` for current counts and commands. Automated market/auth/database transports are fixtures; browser checks use the isolated illustrative preview. No real account write, payment, email, broker order or provider-entitlement purchase was made during this build.

This is a presentation refinement with specific data-display correctness fixes, not a new validated market-prediction engine. No competitor DCA parity, all-ticker data availability, universal fair-value calculation, pixel-perfect equivalence or zero-defect guarantee is claimed. Physical installed iPhone and live account/payment/email/provider acceptance remain external checks.
