export const desktopNavigation = [
  { path: "overview", label: "Today" },
  { path: "research", label: "Research" },
  { path: "options", label: "Options" },
  { path: "watchlist", label: "Watchlist" },
  { path: "portfolio", label: "Portfolio" },
] as const;
export const mobileNavigation = desktopNavigation.filter((item) =>
  ["overview", "research", "options", "watchlist", "portfolio"].includes(
    item.path,
  ),
);
export const researchLenses = [
  { label: "Atlas", sections: ["Snapshot", "Financials", "Analysts"] },
  { label: "Scenarios", sections: ["Valuation"] },
  { label: "Technicals", sections: ["Technicals"] },
  { label: "Ownership", sections: ["Thesis"] },
  { label: "Events", sections: ["News"] },
  { label: "Indicators", sections: ["Advanced"] },
  { label: "Pace", sections: ["Pace"] },
  { label: "Options", sections: ["Options"] },
] as const;
export function lensForSection(section: string) {
  return researchLenses.find((lens) =>
    (lens.sections as readonly string[]).includes(section),
  );
}
