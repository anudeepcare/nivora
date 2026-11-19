const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const text = (v: unknown, max = 200) =>
  typeof v === "string" ? v.slice(0, max) : null;
const count = (v: unknown) =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
const slug = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[A-Za-z][A-Za-z0-9'-]*(?:-[A-Za-z0-9'-]+)*$/.test(v) &&
  v.length <= 150;
const bio = (v: unknown): v is string =>
  typeof v === "string" && /^[A-Z]\d{6}$/.test(v);
export function politicianQuery(p: URLSearchParams) {
  for (const k of p.keys())
    if (
      !["q", "slug", "bioguideId", "offset"].includes(k) ||
      p.getAll(k).length !== 1
    )
      throw Error("Invalid member query.");
  const q = (p.get("q") || "").trim(),
    s = p.get("slug") || "",
    id = p.get("bioguideId") || "",
    o = p.get("offset") || "0";
  if (
    q.length > 100 ||
    /[\x00-\x1f]/.test(q) ||
    !/^\d+$/.test(o) ||
    Number(o) > 1000 ||
    Number(o) % 50 !== 0 ||
    (s ? !slug(s) || !bio(id) || !!q : !!id)
  )
    throw Error("Invalid member query.");
  return { q, slug: s, bioguideId: id, offset: Number(o) };
}
export type PoliticianQuery = ReturnType<typeof politicianQuery>;
function member(v: unknown, now: number) {
  const r = obj(v);
  if (
    !slug(r.urlSlug) ||
    !bio(r.bioguideId) ||
    !text(r.displayName) ||
    !["HOUSE", "SENATE"].includes(String(r.chamber)) ||
    typeof r.former !== "boolean"
  )
    throw Error("Member identity unavailable.");
  const year =
    typeof r.servedUntil === "string" &&
    /^\d{4}$/.test(r.servedUntil) &&
    Number(r.servedUntil) <= new Date(now).getUTCFullYear()
      ? r.servedUntil
      : null;
  return {
    urlSlug: r.urlSlug,
    bioguideId: r.bioguideId,
    displayName: text(r.displayName)!,
    chamber: r.chamber as string,
    party: text(r.party),
    state:
      typeof r.state === "string" && /^[A-Z]{2}$/.test(r.state)
        ? r.state
        : null,
    former: r.former,
    servedUntil: r.former ? year : null,
  };
}
export type PoliticianMember = ReturnType<typeof member>;
export function projectDirectory(
  raw: unknown,
  q: PoliticianQuery,
  now = Date.now(),
) {
  const root = obj(raw),
    d = obj(root.data);
  if (
    (root.isPreview !== undefined && root.isPreview !== false) ||
    !Array.isArray(d.members) ||
    d.members.length > 50 ||
    count(d.totalCount) === null ||
    (d.totalCount as number) < q.offset + d.members.length
  )
    throw Error("Member directory unavailable.");
  const members = d.members.map((v) => member(v, now));
  if (
    new Set(members.map((m) => m.bioguideId)).size !== members.length ||
    new Set(members.map((m) => m.urlSlug.toLowerCase())).size !== members.length
  )
    throw Error("Ambiguous member identity.");
  return {
    members,
    totalCount: d.totalCount as number,
    offset: q.offset,
    canNext:
      q.offset < 1000 &&
      q.offset + members.length < (d.totalCount as number) &&
      members.length === 50,
    retrievedAt: new Date(now).toISOString(),
  };
}
export function projectMember(
  raw: unknown,
  q: PoliticianQuery,
  verified: PoliticianMember,
  now = Date.now(),
) {
  if (
    verified.bioguideId !== q.bioguideId ||
    verified.urlSlug.toLowerCase() !== q.slug.toLowerCase()
  )
    throw Error("Member identity mismatch.");
  const root = obj(raw),
    d = obj(root.data);
  if (typeof root.isPreview !== "boolean")
    throw Error("Member preview status unavailable.");
  if (root.isPreview && q.offset !== 0)
    throw Error("Preview does not support history paging.");
  const fallback = root.isPreview && Array.isArray(root.data);
  const profile = obj(d.profile);
  if (
    !fallback &&
    (profile.bioguideId !== verified.bioguideId ||
      typeof profile.urlSlug !== "string" ||
      profile.urlSlug.toLowerCase() !== verified.urlSlug.toLowerCase())
  )
    throw Error("Member identity mismatch.");
  const input = fallback ? root.data : d.recentTrades;
  if (!Array.isArray(input) || input.length > (root.isPreview ? 5 : 50))
    throw Error("Member page unavailable.");
  const totalCount = fallback ? null : count(root.totalCount);
  if (
    !root.isPreview &&
    (totalCount === null || totalCount < q.offset + input.length)
  )
    throw Error("Member history count unavailable.");
  const date = (v: unknown) => {
    if (v === undefined || v === null || v === "") return null;
    if (
      typeof v !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
      !Number.isFinite(Date.parse(v)) ||
      new Date(v).toISOString().slice(0, 10) !== v ||
      Date.parse(v) > now
    )
      throw Error("Invalid filing date.");
    return v;
  };
  const trades = input.map((v) => {
    const r = obj(v);
    if (
      fallback &&
      r.bioguideId !== verified.bioguideId &&
      (typeof r.urlSlug !== "string" ||
        r.urlSlug.toLowerCase() !== verified.urlSlug.toLowerCase())
    )
      throw Error("Preview trade identity unavailable.");
    if (
      (r.bioguideId !== undefined && r.bioguideId !== verified.bioguideId) ||
      (r.urlSlug !== undefined &&
        (typeof r.urlSlug !== "string" ||
          r.urlSlug.toLowerCase() !== verified.urlSlug.toLowerCase()))
    )
      throw Error("Trade member mismatch.");
    const lo = count(r.amountMin),
      hi = count(r.amountMax);
    if (
      (r.amountMin != null && lo === null) ||
      (r.amountMax != null && hi === null) ||
      (lo !== null && hi !== null && lo > hi)
    )
      throw Error("Invalid disclosed range.");
    const transactionDate = date(r.transactionDate),
      disclosureDate = date(r.disclosureDate);
    if (transactionDate && disclosureDate && disclosureDate < transactionDate)
      throw Error("Conflicting filing dates.");
    return {
      ticker:
        typeof r.ticker === "string" && /^[A-Z][A-Z0-9.-]{0,14}$/.test(r.ticker)
          ? r.ticker
          : null,
      assetDescription: text(r.assetDescription, 400),
      assetType: text(r.assetType),
      transactionType: ["PURCHASE", "SALE", "EXCHANGE", "OTHER"].includes(
        String(r.transactionType),
      )
        ? String(r.transactionType)
        : "Not supplied",
      transactionDate,
      disclosureDate,
      amountRange: text(r.amountRange) || "Not supplied",
      amountMin: lo,
      amountMax: hi,
      owner: ["Self", "Spouse", "Child", "Joint", "Dependent"].includes(
        String(r.owner),
      )
        ? String(r.owner)
        : "Unspecified",
    };
  });
  return {
    member: verified,
    isPreview: root.isPreview,
    profileAvailable: !fallback,
    totalCount,
    profileTotalTrades: fallback ? null : count(profile.totalTrades),
    trades,
    offset: q.offset,
    canNext:
      !root.isPreview &&
      q.offset < 1000 &&
      trades.length === 50 &&
      totalCount !== null &&
      q.offset + trades.length < totalCount,
    retrievedAt: new Date(now).toISOString(),
  };
}
export type DirectoryResult = ReturnType<typeof projectDirectory>;
export type MemberResult = ReturnType<typeof projectMember>;
