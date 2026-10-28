const workspacePages = new Set([
  "overview",
  "research",
  "watchlist",
  "portfolio",
  "discover",
  "research-lab",
  "trading",
  "compare",
  "help",
  "alerts",
  "plans",
  "owner",
]);

/** Keep Settings return links within the current workspace, including its query and anchor. */
export function settingsReturnHref(value: string | null, prefix = "") {
  const fallback = `${prefix}/overview`;
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return fallback;
  try {
    const url = new URL(value, "https://auryn.invalid");
    if (url.origin !== "https://auryn.invalid") return fallback;
    const path = prefix
      ? url.pathname.startsWith(`${prefix}/`)
        ? url.pathname.slice(prefix.length)
        : ""
      : url.pathname;
    if (!workspacePages.has(path.split("/")[1])) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function settingsHref(current: string, prefix = "") {
  const url = new URL(current, "https://auryn.invalid");
  const from = settingsReturnHref(
    url.pathname === `${prefix}/settings`
      ? url.searchParams.get("from")
      : current,
    prefix,
  );
  return `${prefix}/settings?from=${encodeURIComponent(from)}`;
}
