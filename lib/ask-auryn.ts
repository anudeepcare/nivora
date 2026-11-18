import type { Evidence } from "./report";
export function stockQuestion(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.trim().length < 3 ||
    value.length > 1200 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    throw Error("Enter a stock question between 3 and 1200 characters.");
  return value.trim();
}
export const askSchema = {
  type: "object",
  additionalProperties: false,
  required: ["claims", "factIds"],
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "evidenceIds"],
        properties: {
          text: { type: "string" },
          evidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    factIds: { type: "array", items: { type: "string" } },
  },
};
export function validateAnswer(raw: unknown, evidence: Evidence[]) {
  const v = raw as {
    claims?: { text: string; evidenceIds: string[] }[];
    factIds?: string[];
  };
  const ids = new Set(evidence.map((e) => e.id));
  if (
    !v ||
    !Array.isArray(v.claims) ||
    v.claims.length < 1 ||
    v.claims.length > 6 ||
    !Array.isArray(v.factIds) ||
    v.factIds.length > 8
  )
    throw Error("Invalid answer");
  const checkIds = (list: unknown): list is string[] =>
    Array.isArray(list) &&
    list.length <= 8 &&
    list.every((id) => typeof id === "string" && ids.has(id));
  if (!checkIds(v.factIds)) throw Error("Invalid facts");
  for (const c of v.claims)
    if (
      !c ||
      typeof c.text !== "string" ||
      c.text.trim().length < 10 ||
      c.text.length > 1200 ||
      /[\p{N}\p{Sc}%٪]|guaranteed|risk.free|certain profit/iu.test(c.text) ||
      !checkIds(c.evidenceIds) ||
      !c.evidenceIds.length
    )
      throw Error("Unvalidated answer");
  return {
    claims: v.claims.map((c) => ({
      text: c.text.trim(),
      evidenceIds: [...new Set(c.evidenceIds)],
    })),
    facts: [...new Set(v.factIds)].map(
      (id) => evidence.find((e) => e.id === id)!,
    ),
  };
}
