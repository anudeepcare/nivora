export type CongressDisclosure = {
  id: string;
  member: string;
  chamber: "house" | "senate";
  symbol: string;
  action: string;
  assetDescription: string;
  assetType: string;
  comment: string | null;
  traded: string;
  disclosed: string;
  lagDays: number;
  amountRange: string;
  owner: string | null;
  filingUrl: string;
};
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v
    ? v
    : null;
const text = (v: unknown, max = 160) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
/** Disclosure availability, not transaction date, determines information timing. */
export function congressDisclosures(
  raw: unknown,
  symbol: string,
  today: string,
): CongressDisclosure[] {
  const rows = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(rows) || !date(today)) return [];
  const unique = new Map<string, CongressDisclosure>();
  for (const value of rows.slice(0, 100)) {
    if (!value || typeof value !== "object") continue;
    const r = value as Record<string, any>,
      t = r.transaction ?? {},
      s = r.source ?? {},
      m = r.member ?? {};
    const traded = date(t.transaction_date),
      disclosed = date(t.disclosure_date),
      name = text(m.full_name),
      chamber = r.chamber;
    if (
      !traded ||
      !disclosed ||
      traded > today ||
      disclosed > today ||
      disclosed < traded ||
      !name ||
      r.asset?.symbol !== symbol ||
      !["house", "senate"].includes(chamber) ||
      !["purchase", "sale", "exchange"].includes(t.type)
    )
      continue;
    let url: URL;
    try {
      url = new URL(String(s.filing_url));
    } catch {
      continue;
    }
    if (
      url.protocol !== "https:" ||
      !["disclosures-clerk.house.gov", "efdsearch.senate.gov"].includes(
        url.hostname,
      )
    )
      continue;
    const id = [
      text(s.filing_identifier),
      symbol,
      traded,
      disclosed,
      t.type,
      name,
      text(t.amount_range),
      text(t.owner),
      text(r.asset?.description,500),
      text(r.asset?.asset_type),
      text(t.comment,500),
    ].join(":");
    unique.set(id, {
      id,
      member: name,
      chamber,
      symbol,
      action: t.type,
      assetDescription: text(r.asset?.description,500),
      assetType: text(r.asset?.asset_type),
      comment: text(t.comment,500) || null,
      traded,
      disclosed,
      lagDays: Math.round(
        (Date.parse(disclosed) - Date.parse(traded)) / 86400000,
      ),
      amountRange: text(t.amount_range) || "Amount range not reported",
      owner: text(t.owner, 60) || null,
      filingUrl: url.href,
    });
  }
  return [...unique.values()].sort(
    (a, b) =>
      b.disclosed.localeCompare(a.disclosed) ||
      b.traded.localeCompare(a.traded),
  );
}
