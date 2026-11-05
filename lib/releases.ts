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
        "Compact public footer, aligned research cards and separated research actions.",
        "Contextual return links from Help, support and legal documents.",
      ],
      Fixed: [
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
