export const productPages = new Set([
  "changelog",
  "overview",
  "research",
  "portfolio",
  "watchlist",
  "settings",
  "owner",
  "plans",
  "pricing",
  "compare",
  "alerts",
  "research-lab",
  "trading",
  "discover",
  "help",
  "contact",
  "terms",
  "privacy",
  "risk",
  "methodology",
  "reliability",
  "login",
  "reset-password",
  "sample",
  "about",
  "pace",
  "track-record",
  "portfolio-check",
  "monthly-plan",
]);
export function isProductPage(pathname: string) {
  // Authentication handlers must reach their routes before the 404 gate.
  if (pathname === "/auth/callback" || pathname === "/auth/confirm")
    return true;
  const path = pathname.split("/").filter(Boolean);
  const parts = path[0] === "preview" ? path.slice(1) : path;
  return (
    !parts.length ||
    (productPages.has(parts[0]) &&
      (parts.length === 1 || (parts[0] === "research" && parts.length === 2)))
  );
}
