export const APP_VERSION = "0.2.0-rc.2";
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
    date: "2026-11-04",
    status: "candidate",
    title: "A clearer path through your research",
    groups: {
      New: [
        "What’s new: a permanent record of releases, methodology changes and known limitations.",
        "A research checklist combining dated company updates, observed evidence changes, unread alerts and account data to review.",
        "Upcoming-earnings watchlist order, saved business checkpoints and account-synced research style, depth and overview cards.",
        "Earnings-to-thesis financial comparisons and opt-in support diagnostics without portfolio details.",
      ],
      Improved: [
        "Compact mobile Help & legal menu, quieter navigation and public footer.",
        "Contextual return links from Help, support and legal documents.",
      ],
      Fixed: [
        "Contrast background for white HIMS and ServiceNow logos.",
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
