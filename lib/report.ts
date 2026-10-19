import type { Research } from "./types";
export type Evidence = {
  id: string;
  label: string;
  url: string;
  value: number | null;
  passage?: string;
  unit: string;
  period: string;
  filed: string;
};
export type Claim = { text: string; evidenceIds: string[] };
export type ReportBody = {
  summary: Claim;
  strengths: Claim[];
  risks: Claim[];
  watch: Claim[];
};
export function evidenceFor(research: Research): Evidence[] {
  const day = research.retrievedAt.slice(0, 10),
    unique = new Map<string, Research["facts"][number]>();
  const facts = research.facts
    .filter((f) => {
      try {
        const url = new URL(f.sourceUrl);
        return (
          url.protocol === "https:" &&
          ((url.hostname === "www.sec.gov" &&
            url.pathname.startsWith("/Archives/")) ||
            (url.hostname === "eodhd.com" &&
              url.pathname ===
                "/financial-apis/stock-etfs-fundamental-data-feeds" &&
              f.basis === "Provider" &&
              f.id.startsWith("eodhd:"))) &&
          f.filed <= day &&
          f.end <= day &&
          Number.isFinite(f.value)
        );
      } catch {
        return false;
      }
    })
    .sort(
      (a, b) => b.end.localeCompare(a.end) || b.filed.localeCompare(a.filed),
    );
  for (const f of facts) {
    const key = [f.metric, f.start, f.end, f.unit, f.basis].join("|");
    if (!unique.has(key)) unique.set(key, f);
  }
  return [...unique.values()].slice(0, 64).map((f, i) => ({
    id: `E${i + 1}`,
    label: `${f.metric} · ${f.end} · ${f.scope}`,
    url: f.sourceUrl,
    value: f.value,
    unit: f.unit,
    period: f.end,
    filed: f.filed,
  }));
}
export function validateReport(
  value: unknown,
  evidence: Evidence[],
): ReportBody {
  const ids = new Set(evidence.map((e) => e.id));
  function claim(c: unknown): Claim {
    if (!c || typeof c !== "object") throw Error("Invalid research claim.");
    const v = c as Claim;
    if (
      typeof v.text !== "string" ||
      v.text.trim().length < 10 ||
      v.text.length > 1200 ||
      /[\d$€£%]|guaranteed|risk.free|certain profit/i.test(v.text)
    )
      throw Error("Research text did not pass evidence validation.");
    if (
      !Array.isArray(v.evidenceIds) ||
      v.evidenceIds.length < 1 ||
      v.evidenceIds.length > 8 ||
      v.evidenceIds.some((id) => typeof id !== "string" || !ids.has(id))
    )
      throw Error("Research citations did not match supplied evidence.");
    return { text: v.text.trim(), evidenceIds: [...new Set(v.evidenceIds)] };
  }
  if (!value || typeof value !== "object") throw Error("Invalid report.");
  const v = value as ReportBody;
  const list = (rows: unknown) => {
    if (!Array.isArray(rows) || rows.length < 1 || rows.length > 5)
      throw Error("Invalid report section.");
    return rows.map(claim);
  };
  return {
    summary: claim(v.summary),
    strengths: list(v.strengths),
    risks: list(v.risks),
    watch: list(v.watch),
  };
}
const claimSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text", "evidenceIds"],
  properties: {
    text: { type: "string" },
    evidenceIds: { type: "array", items: { type: "string" } },
  },
};
export const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "strengths", "risks", "watch"],
  properties: {
    summary: claimSchema,
    ...Object.fromEntries(
      ["strengths", "risks", "watch"].map((k) => [
        k,
        { type: "array", items: claimSchema },
      ]),
    ),
  },
};
