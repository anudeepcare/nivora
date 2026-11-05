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
        "Compare up to three followed companies before a contribution, with optional position-weight previews.",
        "Explore the earnings implied by your chosen horizon, exit multiple and return assumption.",
        "Business, price, valuation and earnings evidence brought together in a focused research view.",
        "Pace-first research with conditional boundaries, completed versus forming context and historical outcomes.",
        "Targets & estimates separates analyst targets, annual estimates, modeled scenarios and historical price risk.",
        "Optional saved estimate baselines, opportunity maps, comparison charts and a position-size preview.",
        "An interactive public product example connects Discover, Understand and Plan.",
        "What’s new: a permanent record of releases, methodology changes and known limitations.",
        "Up to three Home highlights for followed-company earnings, saved alerts and research reminders.",
        "Upcoming-earnings watchlist order, saved business checkpoints and account-synced research style, depth and overview cards.",
        "Earnings-to-thesis financial comparisons and opt-in support diagnostics without portfolio details.",
      ],
      Improved: [
        "Business-focused stock header, clearer price-change help, sector-aware profitability and dated earnings context.",
        "Readable Options banner and grids, consistent dropdowns, consolidated analyst consensus and simplified calculation help.",
        "Compact stock context and decision panels; a stronger Home comparison hero and clearer Pace action hierarchy.",
        "Lean Git handoff excludes archived screenshots and prototypes, and removes unused Home lens code.",
        "Compact public footer, aligned research cards and separated research actions.",
        "Contextual return links from Help, support and legal documents.",
      ],
      Fixed: [
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
