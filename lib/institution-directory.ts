export type InstitutionQuery = {
  cik: string;
  q: string;
  offset: number;
  quarter: string;
  reportDate: string;
};
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 200) : "");
const count = (v: unknown): number | null =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
const number = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const quarterDate = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-(03-31|06-30|09-30|12-31)$/.test(v) &&
  Date.parse(v) <= Date.now();
const validQuarter = (v: unknown): v is string => {
  if (typeof v !== "string" || !/^\d{4}Q[1-4]$/.test(v)) return false;
  const end = ["03-31", "06-30", "09-30", "12-31"][Number(v.at(-1)) - 1];
  return quarterDate(`${v.slice(0, 4)}-${end}`);
};
const weight = (v: unknown) => {
  const n = number(v);
  return n !== null && n >= 0 && n <= 100 ? n : null;
};
export function institutionQuery(p: URLSearchParams): InstitutionQuery {
  const allowed = ["cik", "q", "offset", "quarter", "reportDate"];
  if (
    [...p.keys()].some((k) => !allowed.includes(k) || p.getAll(k).length !== 1)
  )
    throw Error("Unsupported institution query.");
  const cik = p.get("cik") || "",
    q = (p.get("q") || "").trim(),
    raw = p.get("offset") || "0",
    offset = Number(raw),
    quarter = p.get("quarter") || "",
    reportDate = p.get("reportDate") || "";
  if (
    (cik && !/^\d{1,10}$/.test(cik)) ||
    q.length > 100 ||
    /[\x00-\x1f]/.test(q) ||
    !/^\d+$/.test(raw) ||
    !Number.isSafeInteger(offset) ||
    offset > 1000 ||
    offset % 50 !== 0 ||
    (quarter && !validQuarter(quarter)) ||
    (reportDate && !quarterDate(reportDate)) ||
    (cik && (q || quarter)) ||
    (!cik && reportDate) ||
    (offset > 0 && !(cik ? reportDate : quarter))
  )
    throw Error("Choose a valid institution page and reporting period.");
  return { cik, q, offset, quarter, reportDate };
}
export function projectInstitutionPage(
  input: unknown,
  query: InstitutionQuery,
) {
  const root = obj(input),
    d = obj(root.data);
  if (typeof root.isPreview !== "boolean")
    throw Error("Institution preview status unavailable.");
  const preview = root.isPreview;
  if (preview && query.offset > 0)
    throw Error("Preview holdings cannot be paged.");
  const offset = preview ? 0 : count(d.offset);
  if (offset !== query.offset)
    throw Error("Institution page does not match request.");
  let data: Record<string, unknown> = {},
    institutions: {
      cik: string;
      displayName: string;
      totalValueUsd: number | null;
      holdingsCount: number | null;
      filerCategory: string;
    }[] = [];
  let quarter = "",
    total: number | null,
    returned: number;
  if (query.cik) {
    if (
      typeof d.filerCik !== "string" ||
      !/^\d{1,10}$/.test(d.filerCik) ||
      d.filerCik.padStart(10, "0") !== query.cik.padStart(10, "0") ||
      !quarterDate(d.latestReportDate)
    )
      throw Error(
        "Institution identity or report quarter could not be verified.",
      );
    if (query.reportDate && d.latestReportDate !== query.reportDate)
      throw Error("Institution filing changed. Return to the first page.");
    if (!Array.isArray(d.holdings) || d.holdings.length > (preview ? 10 : 50))
      throw Error("Unsupported institution holdings page.");
    returned = d.holdings.length;
    total = count(root.totalCount) ?? count(d.holdingsCount);
    if (!preview && count(d.returnedCount) !== returned)
      throw Error("Institution holdings page count mismatch.");
    data = {
      filerCik: d.filerCik,
      displayName: str(d.displayName),
      latestReportDate: d.latestReportDate,
      holdingsCount: count(d.holdingsCount),
      comparisonStatus: str(d.comparisonStatus),
      holdings: d.holdings.map((v) => {
        const h = obj(v);
        if (
          typeof h.ticker !== "string" ||
          !/^[A-Z0-9][A-Z0-9.-]{0,19}$/.test(h.ticker)
        )
          throw Error("Invalid holding identity.");
        return {
          ticker: h.ticker,
          companyName: str(h.companyName),
          shares: count(h.shares),
          valueUsd: count(h.valueUsd),
          portfolioWeight: weight(h.portfolioWeight),
          changeType: str(h.changeType),
          sharesChangePct: number(h.sharesChangePct),
        };
      }),
    };
  } else {
    if (
      preview ||
      !validQuarter(d.quarter) ||
      (query.quarter && d.quarter !== query.quarter) ||
      count(d.limit) !== 50 ||
      !Array.isArray(d.institutions) ||
      d.institutions.length > 50
    )
      throw Error("Institution finder page or quarter unavailable.");
    quarter = String(d.quarter);
    total = count(d.totalCount);
    returned = d.institutions.length;
    institutions = d.institutions.map((v) => {
      const i = obj(v);
      if (
        typeof i.cik !== "string" ||
        !/^\d{1,10}$/.test(i.cik) ||
        !str(i.displayName)
      )
        throw Error("Institution identity unavailable.");
      return {
        cik: i.cik,
        displayName: str(i.displayName),
        totalValueUsd: count(i.totalValueUsd),
        holdingsCount: count(i.holdingsCount),
        filerCategory: str(i.filerCategory),
      };
    });
  }
  if (total !== null && total < offset + returned)
    throw Error("Institution total does not reconcile with page.");
  return {
    status: preview ? "preview" : "available",
    isPreview: preview,
    data,
    institutions,
    quarter,
    offset,
    totalCount: total,
    returnedCount: returned,
    canNext:
      !preview &&
      returned === 50 &&
      total !== null &&
      offset + returned < total &&
      offset < 1000,
    retrievedAt: new Date().toISOString(),
  };
}
export type InstitutionPage = ReturnType<typeof projectInstitutionPage>;
