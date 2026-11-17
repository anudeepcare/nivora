/** Closed narrative projection. Provider directives are data, never executable UI. */
export type ResearchReport = {
  ticker: string;
  updatedAt: string;
  sections: { title: string; text: string }[];
};
export function researchReport(value: unknown): ResearchReport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const d = value as Record<string, unknown>;
  if (
    d.status !== "READY" ||
    d.reportType !== "FULL" ||
    typeof d.ticker !== "string" ||
    !/^[A-Z][A-Z0-9.\-]{0,11}$/.test(d.ticker) ||
    typeof d.lastUpdated !== "number" ||
    !Number.isFinite(d.lastUpdated) ||
    d.lastUpdated <= 0 ||
    d.lastUpdated > 8640000000000000 ||
    !Array.isArray(d.sectionOrder) ||
    !d.sectionOrder.length ||
    d.sectionOrder.length > 40 ||
    new Set(d.sectionOrder).size !== d.sectionOrder.length ||
    !d.sections ||
    typeof d.sections !== "object" ||
    Array.isArray(d.sections)
  )
    return null;
  const sections: ResearchReport["sections"] = [];
  for (const key of d.sectionOrder) {
    if (
      typeof key !== "string" ||
      !key.trim() ||
      key.length > 200 ||
      !Object.hasOwn(d.sections, key)
    )
      return null;
    const s = (d.sections as Record<string, unknown>)[key];
    if (!s || typeof s !== "object" || Array.isArray(s)) return null;
    const content = (s as Record<string, unknown>).content;
    if (
      typeof content !== "string" ||
      !content.trim() ||
      content.length > 100000
    )
      return null;
    sections.push({ title: key, text: content });
  }
  if (sections.reduce((n, s) => n + s.text.length, 0) > 500000) return null;
  return {
    ticker: d.ticker,
    updatedAt: new Date(d.lastUpdated).toISOString(),
    sections,
  };
}
