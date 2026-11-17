export function safeLogoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      ([
        "static2.finnhub.io",
        "static.finnhub.io",
        "logo.twelvedata.com",
      ].includes(u.hostname) ||
        (u.hostname === "eodhd.com" && u.pathname.startsWith("/img/logos/")) ||
        (u.hostname === "api.twelvedata.com" &&
          u.pathname.startsWith("/logo/"))) &&
      !u.username &&
      !u.password &&
      !u.search
      ? u.href
      : null;
  } catch {
    return null;
  }
}
