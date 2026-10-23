export const legalConfiguration = {
  operator:
    process.env.NEXT_PUBLIC_AURYN_OPERATOR || "AURYN personal research project",
  contact: process.env.NEXT_PUBLIC_AURYN_SUPPORT_EMAIL || "",
  updated: "October 23, 2026",
  version: "research-release-20261023",
};
export type DocumentId =
  | "terms"
  | "privacy"
  | "risk"
  | "methodology"
  | "help"
  | "reliability";
export const documents: Record<
  DocumentId,
  { title: string; intro: string; sections: { title: string; text: string }[] }
> = {
  reliability: {
    title: "Data reliability & release notes",
    intro:
      "Understand what is measured, what is missing and which checks have actually run. This page is a release disclosure, not a live uptime monitor.",
    sections: [
      {
        title: "Freshness and coverage",
        text: "Quote timestamps and financial period ends describe different observations. Missing prices are excluded from priced portfolio value; older usable USD observations remain included and are visibly labelled. Holdings without matching USD prices cannot be combined into a dollar total without an FX conversion. A partial total is not the value of every holding.",
      },
      {
        title: "Models are conditional",
        text: "Cash-flow assumptions, forecast-multiple scenarios and analyst consensus answer different questions and can use different horizons. Their central values are not interchangeable. Screening scores use disclosed absolute anchors, not peer ranks or calibrated success probabilities.",
      },
      {
        title: "Known limitations",
        text: "Corporate-action and vendor revision reconciliation is not independently verified for every ticker. Options analytics, universal peer coverage, historical analog probabilities and all-customer continuous alert scheduling are not established in this release. A source link does not prove an independent filing audit.",
      },
      {
        title: "Recent corrections",
        text: "October 19: aligned portfolio exposure and headline inclusion rules for stale quotes and invalid records; separated cash-flow central assumptions from forecast-multiple scenarios; repaired mobile lens and Advanced navigation alignment; made Light the default for new users while preserving saved preferences.",
      },
      {
        title: "Verification scope",
        text: "Automated calculations, type checks and a production build are recorded in the release archive. These checks do not establish live provider entitlements, physical iPhone visual acceptance, payment processing, legal readiness or profitability. No numerical service-level or uptime guarantee is implied.",
      },
    ],
  },
  terms: {
    title: "Terms of use",
    intro:
      "Terms for this personal research release. Read the risk disclosure and privacy notice alongside these terms.",
    sections: [
      {
        title: "Purpose and your decisions",
        text: "AURYN provides research tools and general educational information. You remain responsible for choosing investments, checking facts, assessing suitability and obtaining professional advice where appropriate. Nothing here guarantees a result or creates a fiduciary or advisory relationship.",
      },
      {
        title: "Payments and card details",
        text: "Stripe hosts checkout and processes subscription payments. AURYN does not collect or store full payment-card numbers or card security codes. AURYN stores account and billing references, subscription status and paid-through dates to provide access. Stripe processes payment information under its own terms and privacy policy. No charge is made simply for creating a Free account.",
      },
      {
        title: "Accounts and responsible use",
        text: "Keep your credentials secure and provide information you have permission to use. Do not attempt unauthorized access, disrupt the service, scrape restricted datasets or upload another person’s private financial information without authority.",
      },
      {
        title: "Data and models",
        text: "Quotes may be delayed, financial data may be revised, and coverage varies. Scores are reproducible screening rules, not recommendations or calibrated probabilities. User-entered assumptions are not company guidance. Review dates, reporting currency and model scope before acting.",
      },
      {
        title: "Paper trading",
        text: "Paper transactions and simulations are hypothetical. They may differ materially from real fills, liquidity, costs, taxes and market conditions. Connecting credentials does not itself authorize unrestricted live trading. Review the controls and permissions for each integration.",
      },
      {
        title: "Access and service changes",
        text: "Features and data availability can change or be interrupted. This release does not make an uptime, accuracy or investment-performance warranty. Free and paid features are described on Plans. Pro renews monthly at the price shown at checkout until canceled. Cancel future renewals through Manage subscription; paid access continues to the end of the paid billing period. Cancellation does not automatically refund past payments. Contact support for billing errors or refund requests; applicable consumer rights remain unchanged.",
      },
      {
        title: "Content and permissions",
        text: "You retain rights in your own submitted content. The service processes it to deliver the features you request. Third-party market data remains subject to its owners’ rights; access here does not grant redistribution rights.",
      },
      {
        title: "Changes and applicable rights",
        text: "Material revisions should be published with a new date and version. Nothing in these terms excludes rights that applicable law does not allow to be excluded. These terms do not select a court, compel arbitration or establish a regulatory exemption.",
      },
    ],
  },
  privacy: {
    title: "Privacy notice",
    intro:
      "What this research application processes, and the controls available in this deployment.",
    sections: [
      {
        title: "Billing information",
        text: "When you subscribe, Stripe processes your payment-card details. AURYN stores your account ID, Stripe customer and subscription references, payment-event references, plan status and billing dates; it does not store full card numbers or security codes. Payment and invoice information may be retained as required for billing, fraud prevention and applicable law. Stripe privacy information is available at https://stripe.com/privacy.",
      },
      {
        title: "Information you provide",
        text: "The application processes account identifiers, saved holdings, quantities, costs, watchlists, research requests and any notes or strategy information you submit. Avoid including credentials, government identifiers or information about other people in notes or AI prompts.",
      },
      {
        title: "Google and X sign-in",
        text: "If you choose Google or X, the authentication service processes the account identifier, verified email when supplied and basic profile information needed to sign in. The provider handles its own consent process under its privacy policy. AURYN does not request permission to post on your behalf or access your brokerage through social sign-in. Accounts use the identity verified by the authentication service; financial records are not merged merely because an email address was typed.",
      },
      {
        title: "How information is used",
        text: "Account and portfolio records support sign-in, saved research and portfolio displays. Market-data requests use instrument identifiers. Brokerage integrations use their configured credentials and permissions. Hosting and authentication services can record operational and security logs.",
      },
      {
        title: "Device storage",
        text: "This device stores session information and preferences such as appearance, text size, motion and research style. Some caches and research tools retain local state. Clearing site data or removing an installed web app can remove device-only information. Confirm server-saved holdings before doing so.",
      },
      {
        title: "AI processing",
        text: "When you explicitly request AI research, the research input and supplied context may be transmitted to the configured AI provider. Do not assume that AI output is accurate or that a source citation validates its interpretation. Provider processing and retention depend on the operator’s actual configuration.",
      },
      {
        title: "Service providers and sharing",
        text: "Authentication, database, hosting, market-data, AI and explicitly connected brokerage services process information needed for their functions. This notice does not promise that those services have identical retention, residency or security practices. Commercial operators must publish an accurate provider and sharing inventory.",
      },
      {
        title: "Your controls and requests",
        text: "You can edit or remove saved positions and watchlist entries through the application and change device preferences. Account deletion, data access and correction requests must be handled by this deployment’s operator. A contact address is shown below when configured. No automatic retention deadline is promised by this private release.",
      },
      {
        title: "Security and changes",
        text: "Use a unique password and protect devices and API credentials. No system is risk-free. The operator must maintain access controls, respond to incidents and keep this notice aligned with actual processing. This service is not intended for children to submit personal financial information.",
      },
    ],
  },
  risk: {
    title: "Investment risk disclosure",
    intro:
      "Understand the limits before relying on research, charts, simulations or model outputs.",
    sections: [
      {
        title: "Loss and uncertainty",
        text: "Investments can lose some or all of their value. Volatility, concentration, leverage, liquidity, issuer failure, currency movements and changing market conditions can produce losses. A good business can be an expensive investment.",
      },
      {
        title: "Hypothetical models",
        text: "Bear, base and bull cases are sensitivities to assumptions, not promised outcomes. Historical backtests are hypothetical and depend on data quality, universe selection, corporate actions, fees, taxes and slippage. Past performance does not predict future results.",
      },
      {
        title: "Signals and multipliers",
        text: "DCA multipliers scale a hypothetical baseline contribution. They are not leverage, return multiples or personal position-size instructions. A forming monthly signal can change; stronger daily-close readings do not rewrite the confirmed month.",
      },
      {
        title: "Data and AI",
        text: "Data can be missing, stale, restated or misclassified. Ownership and reported transaction data can be delayed and may lack role or transaction context. AI may make mistakes. Verify material conclusions against primary company disclosures.",
      },
      {
        title: "Options, positioning and hypothetical payoffs",
        text: "Options can lose the full premium. Short options may be assigned before expiry and can create stock, cash or margin obligations. Illustrated spreads assume both legs are managed together; realized losses can differ with assignment, execution and fees. Gamma exposure is a model under stated positioning assumptions, not observed dealer inventory or guaranteed support or resistance. End-of-day chains are not live executable quotes. Probability and volatility estimates are model-dependent; delta is not an exact probability of profit.",
      },
      {
        title: "Personal circumstances",
        text: "The service does not establish suitability for your financial situation, tax position, liquidity needs or investment objectives. Seek qualified advice when needed. A disclosure alone does not determine the operator’s regulatory obligations.",
      },
    ],
  },
  methodology: {
    title: "How AURYN reaches a view",
    intro:
      "Deterministic calculations, separate evidence and explicit limitations. Current screening version: evidence-lenses-v1.",
    sections: [
      {
        title: "Three separate questions",
        text: "Business evidence, valuation and timing are shown separately. Short-term weakness does not by itself invalidate a long-term business case. Published analyst opinions remain distinct from assumption-driven sensitivities.",
      },
      {
        title: "Eight evidence lenses",
        text: "Valuation, profitability, growth, financial health, cash quality, owner returns, moat and ownership/expectations organize the evidence. Numeric scores use published absolute anchor rules in lib/decision-research.ts. They are screening scores, not validated stock-return predictors. Missing metrics do not become zero. A composite requires at least four scored lenses.",
      },
      {
        title: "Style and coverage",
        text: "Balanced, Value, Growth, Income and Quality change the blend of available category scores, not the underlying facts or category calculations. Peer percentiles, own-history percentiles, model agreement and probability-like confidence are omitted unless their supporting data and evaluation exist. An evidence count is not a probability of success.",
      },
      {
        title: "Period and currency discipline",
        text: "Financial comparisons use compatible period scope, reporting basis and currency. Flow metrics use comparable annual or complete trailing periods. ROE, ROA and accruals require comparable beginning/end balance data. Ratios with non-positive denominators are withheld rather than set to zero.",
      },
      {
        title: "Cash-flow sensitivity",
        text: "The interactive tool starts from a reconciled OCF-less-capex proxy per current share. Growth fades to terminal growth across ten years. It discounts each cash flow plus the terminal perpetuity. It is not a full enterprise DCF or a claim that reported FCF is distributable equity cash flow. Defaults are assumptions; no calculated WACC is implied.",
      },
      {
        title: "Reverse and implied calculations",
        text: "Bisection solves for initial growth or a discount rate only when the target lies inside a valid bracket. The implied discount rate is not a prediction of realized return. Banks, insurers, crypto and unreconciled foreign listings are excluded from the generic sensitivity model.",
      },
      {
        title: "Methodology changelog",
        text: "October 18, 2026: evidence-lenses-v1 introduced disclosed absolute anchors and five style blends. October 19, 2026: source-status details, observed-view comparison, financial crossing alerts, cash-runway and working-capital context were added. No historical scores are recalculated and presented as observations made at the time.",
      },
      {
        title: "Worked examples",
        text: "If revenue is 100 and operating profit is 20 in the same currency and period, operating margin is 20%. If operating cash flow is 10 and capex is 30, cash after capex is −20 and FCF margin is −20%. A negative margin can exceed 100% in magnitude when spending exceeds revenue. These are arithmetic illustrations, not company data.",
      },
      {
        title: "Flags and review levels",
        text: "Flags apply disclosed deterministic thresholds to available data, including thin interest coverage, cash use, high stock pay, dilution and liquidity. Review levels are on-screen prompts, not automatic trading rules or proof of business failure. They do not certify that untested risks are absent.",
      },
      {
        title: "Timing and DCA",
        text: "Daily technicals use completed dated observations. The monthly accumulation policy requires consecutive month-end closes and distinguishes confirmed from forming readings. Technicals help describe entry conditions; they do not establish business value or a moat.",
      },
      {
        title: "Cycle-relative monthly policy",
        text: "Monthly-v4 uses the mean of the previous 12 completed monthly closes and their sample standard deviation, with a spread floor of 10% of the mean. Eligibility retains 24 consecutive prior months. The 2×/3×/4× pullback gates require 10%/25%/40% below that mean and 0.5/1.35/1.5 spread units. Upper extension reviews retain the v3 robust-trend pause guard; a price at least three times the cycle mean and two spreads above it also triggers a review. A severe cycle review requires three spreads and a 50% period rise. Monthly parameters were calibrated against a small observed reference sample, not learned from a disclosed private formula. Weekly v1 is separate. US daily bars settle after 5 PM New York; crypto uses completed UTC days. Prior versions remain in source for reproducibility. Matching selected signals is not evidence of better returns.",
      },
      {
        title: "Historical policy comparisons",
        text: "Per-company simulations use the same 100-unit monthly deposits, carry unspent cash without interest, prohibit borrowing, and execute only after the prior month signal at the next month first observed open. The final chronological 30% is shown separately with accounts restarted at zero. Costs are configurable. Month-end drawdown does not measure intramonth losses. Historical prices can be revised; dividends, taxes, delisted-universe coverage and point-in-time fundamentals are not modeled. Synthetic tests establish calculation mechanics, not investing performance.",
      },
      {
        title: "Evidence that needs more work",
        text: "Company descriptions do not prove competitive advantage. Management guidance hit rates need actual management guidance, not analyst consensus. Institutional changes need dated holdings history. Historical valuation ranks need price and financial snapshots that were actually available at each date. These values are not fabricated from a current snapshot.",
      },
      {
        title: "Research and commercial review",
        text: "A point-in-time archive, delayed outcome evaluation and independent model validation are needed before publishing performance advantages. Data licensing and the product’s actual advice, personalization and execution features require review before commercialization. A disclaimer does not itself create a publisher exemption.",
      },
    ],
  },
  help: {
    title: "Help & investing essentials",
    intro:
      "Start with the question you need answered. More metrics should make the decision clearer, not harder.",
    sections: [
      {
        title: "Where should I start?",
        text: "Search a company or a crypto pair. Overview brings together business evidence, price context, timing, the next scheduled report, supporting facts and risks. Select a lens to see the measurements behind it.",
      },
      {
        title: "Can I customize the view?",
        text: "Choose a research style and reading depth in settings. Long-term business and swing timing are different perspectives. Preferences stay on this device; they do not change company facts or produce personalized investment advice.",
      },
      {
        title: "What do the scores mean?",
        text: "Scores compare available measurements with transparent absolute anchors. They are not an expert rating, peer rank, predicted return or confidence percentage. Missing evidence remains unscored. A higher score does not make a stock safe or cheaply priced.",
      },
      {
        title: "What are revenue, margins and cash flow?",
        text: "Revenue is reported sales. Operating margin measures operating profit as a share of sales. AURYN FCF is operating cash flow less reported capex; company definitions can differ. Stock compensation and dilution need separate attention.",
      },
      {
        title: "How should I read bear, base and bull?",
        text: "They illustrate different assumptions. Read the horizon, growth, valuation multiple, dilution and discount assumptions. Do not compare a future scenario price directly with a present value without accounting for the horizon.",
      },
      {
        title: "What does 2× or 4× DCA mean?",
        text: "Twice or four times a hypothetical regular contribution, not twice or four times the investment return. This price-only policy does not choose investments or determine a suitable allocation. The current month can change until confirmed.",
      },
      {
        title: "Why is something unavailable?",
        text: "The source may not cover the listing, currency or period; data can be stale or internally inconsistent. Some models are inappropriate for the sector. The app withholds unsupported numbers instead of replacing them with zero or generated values.",
      },
      {
        title: "Why do portfolio figures change?",
        text: "Prices can refresh at different times. Known priced value excludes missing observations. Recorded holdings and cost are not a transaction-aware performance history. A realized return or cash-flow-adjusted return needs transactions, not only current positions.",
      },
      {
        title: "Installed iPhone app",
        text: "The current working PWA setup includes a root status surface. After the October 18 status-bar change, removing and re-adding the old Home Screen installation resolved the reported blur. Confirm saved holdings in Safari before clearing site data or removing an installation. Ordinary future updates should not be treated as requiring repeated reinstalls.",
      },
      {
        title: "Paper trading and AI",
        text: "AI research runs when requested and requires a configured provider. Paper trading is separate from live execution and requires its permissions and safeguards. Research labels and DCA signals do not themselves authorize an order.",
      },
    ],
  },
};
