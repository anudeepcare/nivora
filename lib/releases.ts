export const APP_VERSION = "1.0.0";
export type Release = {
  version: string;
  date: string;
  status: "candidate" | "published";
  title: string;
  groups: Record<string, string[]>;
};
export const releases: Release[] = [
  {
    version: APP_VERSION,
    date: "2026-11-05",
    status: "candidate",
    title: "Pace first. A clearer investment workspace.",
    groups: {
      New: [
        "Account-saved source checkpoints, discrete replay and cross-device exposure presets with conflict checks.",
        "Exposure approach/cross/change alerts use fresh signed baselines and deduplicated check events.",
        "Modelled vanna heatmap with visible assumptions; optional bounded options trade tape with explicit loading and polling.",
        "Long-only simulated options ledger with cash, realized and marked P/L, and device/account save controls.",
        "Loaded-company breadth and relative rotation with dated eligibility and sector coverage.",
        "Options exposure workspace: configurable GEX/OI map, largest concentrations, saved device views and snapshots, snapshot comparison, and value exports.",
        "Searchable expiration and company selectors, contract search/rankings, and sourced implied-versus-realized volatility context.",
        "Compare up to three followed companies before a contribution, with optional position-weight previews.",
        "Explore the earnings implied by your chosen horizon, exit multiple and return assumption.",
        "Business, price, valuation and earnings evidence brought together in a focused research view.",
        "Pace-first research with conditional boundaries, completed versus forming context and historical outcomes.",
        "Targets & estimates separates analyst targets, annual estimates, modeled scenarios and historical price risk.",
        "Optional saved estimate baselines, opportunity maps, comparison charts and a position-size preview.",
        "An interactive public product example connects Discover, Understand and Plan.",
        "What’s new: a permanent record of releases, methodology changes and known limitations.",
        "Compact Home reminders and one dated earnings calendar with reported EPS versus estimates.",
        "Upcoming-earnings watchlist order, saved business checkpoints and account-synced research style, depth and overview cards.",
        "Earnings-to-thesis financial comparisons and opt-in support diagnostics without portfolio details.",
      ],
      Improved: [
        "Visual refresh: charcoal/citron public hero, graphical product walkthrough, restored Home comparison and vivid real-history company charts.",
        "Shaded historical sensitivity diagrams and mint/citron metric surfaces restore visual depth without changing financial models.",
        "Logo-led neutral, mint and lime surfaces; aligned sign-in forms and working public How it works navigation.",
        "Map-first Options workspace: compact inline tools, relevant controls per view, readable heatmap values and optional model diagnostics.",
        "Historical cases regain shared-scale price graphics; internal document version labels stay out of customer copy.",
        "Rebuilt public product presentation and contained login/signup forms; consolidated Home earnings into one view.",
        "Expanded compact header metrics, grouped technical reference levels and clear historical downside/midpoint/upside cards.",
        "Unified teal/citron workspace surfaces, prominent Pace stage badge, expanded contribution rules, and simpler header facts.",
        "Historical downside/midpoint/upside labels remain separate from conditional Bear/Base/Bull valuation.",
        "Slim inline header facts with dates in contextual help; cleaner technical rows and price-level grids, plus consistent section icons.",
        "Business-focused stock header, clearer price-change help, sector-aware profitability and dated earnings context.",
        "Readable Options banner and grids, consistent dropdowns, consolidated analyst consensus and simplified calculation help.",
        "Compact stock context and decision panels with a clearer Pace action hierarchy.",
        "Lean Git handoff excludes archived screenshots and prototypes, and removes unused Home lens code.",
        "Compact public footer, aligned research cards and separated research actions.",
        "Contextual return links from Help, support and legal documents.",
      ],
      Fixed: [
        "Incomplete gamma inputs no longer appear as an aggregate zero; large saved snapshots round-trip, sparse weekly data cannot become daily volatility.",
        "Optional server-configured AI capacity fallback preserves source validation and access controls.",
        "Removed CSV import controls from Portfolio while preserving manual position management and saved holdings.",
        "Removed the mobile navigation arch and tab scrollbar; enlarged Pace and made its help open in a dialog.",
        "Padded, opaque versioned PWA icons; aligned fiscal-year estimate tables and historical range labels.",
        "Automatic earnings scenarios now check the forward multiple against near-term EPS before use.",
        "Removed the saved-view comparison banner and research data-coverage panel; standardized metric help controls.",
        "Short AURYN installation name and accessible page zoom.",
      ],
      "Data & methodology": [
        "P0–P4 policies are unchanged. No ticker-specific rules were added to force competitor agreement.",
      ],
      "Known limitations": [
        "This candidate has not been deployed. Physical installed-iPhone acceptance is pending.",
        "Independent financial and analyst reference reconciliation remains incomplete. Scenario estimates are not promised future prices.",
      ],
    },
  },
];
export function latestPublished(items: Release[] = releases) {
  return (
    items
      .filter((x) => x.status === "published")
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  );
}
