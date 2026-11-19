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
    date: "2026-11-17",
    status: "candidate",
    title: "A cleaner workspace, with your controls intact.",
    groups: {
      "Research & workspace": [
        "Compact research and portfolio layouts keep evidence and decision tools together without repeating the same panels.",
        "Existing company research, comparison, saved holdings, and specialist tools remain available.",
      ],
      "Settings & guardrails": [
        "Signals appear first, with direct links to appearance, research, guardrails, and account settings.",
        "One guardrail section brings together position concentration, cash reserve, and modeled options-loss review limits. These controls do not execute or block trades.",
        "Saved signal visibility controls change research panels without changing data access.",
      ],
      "Help & administration": [
        "Help search now trims spaces, shows matching topics, and includes a reset. The owner handbook uses the same compact reading style.",
        "The support inbox adds refresh and filter reset. Email replies open your email app; provider acceptance is distinguished from inbox delivery.",
        "Pricing and public footer layouts are aligned and simplified, with plan access and legal links preserved.",
      ],
      "Still being verified": [
        "This build is under review. These notes describe implemented changes, not a deployment or end-to-end acceptance result.",
        "Live data availability depends on provider coverage and plan entitlements. Additional notification delivery is not active.",
        "Desktop, mobile, installed-app behavior, and independent financial reference checks still require final acceptance.",
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
