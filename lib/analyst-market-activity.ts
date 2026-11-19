const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown, n = 200) =>
  typeof v === "string" && v.trim() ? v.slice(0, n) : null;
export function analystActivityQuery(p: URLSearchParams) {
  for (const k of p.keys())
    if (!["days", "offset", "mode"].includes(k) || p.getAll(k).length !== 1)
      throw Error("Invalid analyst activity request.");
  const d = p.get("days") || "30",
    o = p.get("offset") || "0",
    mode = p.get("mode") || "changes";
  if (
    !["7", "30", "90"].includes(d) ||
    !/^\d+$/.test(o) ||
    Number(o) > 1000 ||
    Number(o) % 50 !== 0 ||
    !["changes", "all"].includes(mode)
  )
    throw Error("Invalid analyst window or filter.");
  return {
    days: Number(d),
    offset: Number(o),
    mode: mode as "changes" | "all",
  };
}
export type AnalystActivityQuery = ReturnType<typeof analystActivityQuery>;
export function projectAnalystActivity(
  raw: unknown,
  q: AnalystActivityQuery,
  now = Date.now(),
) {
  const r = obj(raw);
  if (
    typeof r.isPreview !== "boolean" ||
    !Array.isArray(r.data) ||
    r.data.length > 50 ||
    ((r.isPreview || r.previewReason === "PRO_REQUIRED") && q.offset > 0)
  )
    throw Error("Analyst page unavailable or limited to first page.");
  const total =
    typeof r.totalCount === "number" &&
    Number.isSafeInteger(r.totalCount) &&
    r.totalCount >= 0
      ? r.totalCount
      : null;
  if (
    total === null ||
    total < (r.isPreview ? r.data.length : q.offset + r.data.length)
  )
    throw Error("Analyst coverage cannot be verified.");
  const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now),
    start = new Date(Date.parse(day) - q.days * 86400000)
      .toISOString()
      .slice(0, 10);
  let omitted = 0;
  const rows = r.data.flatMap((v) => {
    const x = obj(v),
      date = x.actionDate,
      firm = text(x.firm),
      type = x.actionType;
    if (
      typeof x.ticker !== "string" ||
      !/^[A-Z][A-Z0-9.-]{0,14}$/.test(x.ticker) ||
      !firm ||
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      date < start ||
      date > day ||
      !["UPGRADE", "DOWNGRADE", "INITIATE", "REITERATE", "OTHER"].includes(
        String(type),
      ) ||
      (q.mode === "changes" &&
        !["UPGRADE", "DOWNGRADE", "INITIATE"].includes(String(type)))
    ) {
      omitted++;
      return [];
    }
    return [
      {
        ticker: x.ticker,
        firm,
        actionDate: date,
        actionType: String(type),
        fromGrade: text(x.fromGrade),
        toGrade: text(x.toGrade),
      },
    ];
  });
  return {
    rows,
    isPreview: r.isPreview,
    totalCount: total,
    returnedCount: r.data.length,
    omitted,
    days: q.days,
    mode: q.mode,
    offset: q.offset,
    windowStart: start,
    windowEnd: day,
    retrievedAt: new Date(now).toISOString(),
    canNext:
      !r.isPreview &&
      r.previewReason !== "PRO_REQUIRED" &&
      q.offset < 1000 &&
      r.data.length === 50 &&
      q.offset + r.data.length < total,
  };
}
export type AnalystActivityResult = ReturnType<typeof projectAnalystActivity>;
