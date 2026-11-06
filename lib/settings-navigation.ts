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

const documentPages = new Set(['help','contact','terms','privacy','risk','methodology','reliability','changelog']);
/** Only local user-facing destinations are accepted; never API or external URLs. */
export function documentReturnHref(value: string | null) {
  if (value === '/') return '/';
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/overview';
  try {
    const url = new URL(value, 'https://auryn.invalid');
    const parts = url.pathname.split('/').filter(Boolean);
    const page = parts[0] === 'preview' ? parts[1] : parts[0];
    if (url.origin !== 'https://auryn.invalid' || documentPages.has(page) ||
      !(workspacePages.has(page) || ['settings','pricing','about','pace','sample'].includes(page))) return '/overview';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return '/overview'; }
}
export function documentHref(page: string, current: string) {
  if (!documentPages.has(page)) return '/help';
  const url = new URL(current, 'https://auryn.invalid');
  const from = documentReturnHref(documentPages.has(url.pathname.split('/')[1]) ? url.searchParams.get('from') : current);
  return `/${page}?from=${encodeURIComponent(from)}`;
}
