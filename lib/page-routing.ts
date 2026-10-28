export const productPages = new Set([
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
]);
export function isProductPage(pathname: string) {
  const path = pathname.split("/").filter(Boolean);
  const parts = path[0] === "preview" ? path.slice(1) : path;
  return (
    !parts.length ||
    (productPages.has(parts[0]) &&
      (parts.length === 1 || (parts[0] === "research" && parts.length === 2)))
  );
}
