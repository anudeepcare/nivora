const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown, n = 200) =>
  typeof v === "string" ? v.slice(0, n) : null;
const count = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
const validDate = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;
export function activityQuery(p: URLSearchParams) {
  for (const k of p.keys())
    if (!["days", "offset"].includes(k) || p.getAll(k).length !== 1)
      throw Error("Invalid activity query.");
  const d = p.get("days") || "90",
    o = p.get("offset") || "0";
  if (
    !["30", "90", "365"].includes(d) ||
    !/^\d+$/.test(o) ||
    Number(o) > 1000 ||
    Number(o) % 50 !== 0
  )
    throw Error("Invalid activity window or page.");
  return { days: Number(d), offset: Number(o) };
}
export type ActivityQuery = ReturnType<typeof activityQuery>;
export function projectActivity(
  raw: unknown,
  q: ActivityQuery,
  now = Date.now(),
) {
  const r = obj(raw);
  if (
    typeof r.isPreview !== "boolean" ||
    !Array.isArray(r.data) ||
    r.data.length > (r.isPreview ? 5 : 50) ||
    (r.isPreview && q.offset !== 0)
  )
    throw Error("Activity page unavailable.");
  const total = count(r.totalCount);
  if (!r.isPreview && (total === null || total < q.offset + r.data.length))
    throw Error("Activity coverage unavailable.");
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = new Date(Date.parse(day) - q.days * 86400000)
    .toISOString()
    .slice(0, 10);
  let omitted = 0;
  const rows = r.data.flatMap((v) => {
    const x = obj(v);
    const fail = () => {
      omitted++;
      return [];
    };
    if (
      typeof x.bioguideId !== "string" ||
      !/^[A-Z]\d{6}$/.test(x.bioguideId) ||
      !text(x.politicianName) ||
      !["HOUSE", "SENATE"].includes(String(x.chamber))
    )
      return fail();
    const tx =
        x.transactionDate == null || x.transactionDate === ""
          ? null
          : x.transactionDate,
      dis =
        x.disclosureDate == null || x.disclosureDate === ""
          ? null
          : x.disclosureDate;
    if (
      (tx !== null && (!validDate(tx) || tx > day)) ||
      (dis !== null && (!validDate(dis) || dis > day)) ||
      (typeof tx === "string" && typeof dis === "string" && dis < tx)
    )
      return fail();
    const basis = dis || tx;
    if (typeof basis !== "string" || basis < start || basis > day)
      return fail();
    const lo = count(x.amountMin),
      hi = count(x.amountMax);
    if (
      (x.amountMin != null && lo === null) ||
      (x.amountMax != null && hi === null) ||
      (lo !== null && hi !== null && lo > hi)
    )
      return fail();
    const m = obj(x.assetMetadata);
    const option =
      x.assetType === "Stock Option" &&
      m.kind === "OPTION" &&
      ["CALL", "PUT"].includes(String(m.optionType)) &&
      typeof m.strikePrice === "number" &&
      Number.isFinite(m.strikePrice) &&
      m.strikePrice > 0 &&
      validDate(m.expirationDate)
        ? {
            optionType: String(m.optionType),
            strikePrice: m.strikePrice,
            expirationDate: m.expirationDate,
          }
        : null;
    return [
      {
        name: text(x.politicianName)!,
        bioguideId: x.bioguideId,
        urlSlug:
          typeof x.urlSlug === "string" &&
          /^[A-Za-z][A-Za-z0-9'-]{0,149}$/.test(x.urlSlug)
            ? x.urlSlug
            : null,
        chamber: String(x.chamber),
        party: text(x.party),
        state:
          typeof x.state === "string" && /^[A-Z]{2}$/.test(x.state)
            ? x.state
            : null,
        ticker:
          typeof x.ticker === "string" &&
          /^[A-Z][A-Z0-9.-]{0,14}$/.test(x.ticker)
            ? x.ticker
            : null,
        assetDescription: text(x.assetDescription, 400),
        assetType: ["Stock", "ETF", "Stock Option"].includes(
          String(x.assetType),
        )
          ? String(x.assetType)
          : "Not supplied",
        transactionType: ["PURCHASE", "SALE", "EXCHANGE", "OTHER"].includes(
          String(x.transactionType),
        )
          ? String(x.transactionType)
          : "Not supplied",
        transactionDate: tx as string | null,
        disclosureDate: dis as string | null,
        sortDate: basis,
        dateBasis: dis ? "Disclosure date" : "Transaction date fallback",
        owner: ["Self", "Spouse", "Child", "Joint", "Dependent"].includes(
          String(x.owner),
        )
          ? String(x.owner)
          : "Unspecified",
        amountRange: text(x.amountRange) || "Not supplied",
        amountMin: lo,
        amountMax: hi,
        option,
      },
    ];
  });
  return {
    rows,
    isPreview: r.isPreview,
    totalCount: total,
    returnedCount: r.data.length,
    omitted,
    offset: q.offset,
    days: q.days,
    windowStart: start,
    windowEnd: day,
    retrievedAt: new Date(now).toISOString(),
    canNext:
      !r.isPreview &&
      q.offset < 1000 &&
      r.data.length === 50 &&
      total !== null &&
      q.offset + r.data.length < total,
  };
}
export type ActivityResult = ReturnType<typeof projectActivity>;
