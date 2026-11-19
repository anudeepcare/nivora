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
/** AI selects observations; it cannot publish free-form claims. */
export const askSchema = {
  type: "object",
  additionalProperties: false,
  required: ["factIds"],
  properties: { factIds: { type: "array", items: { type: "string" } } },
};
export function validateAnswer(raw: unknown, evidence: Evidence[]) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("Invalid selection");
  const v = raw as Record<string, unknown>;
  if (
    Object.keys(v).some((key) => key !== "factIds") ||
    !Array.isArray(v.factIds) ||
    v.factIds.length > 8 ||
    v.factIds.some(
      (id) => typeof id !== "string" || !evidence.some((e) => e.id === id),
    )
  )
    throw Error("Invalid evidence selection");
  const facts = [...new Set(v.factIds as string[])].map(
    (id) => evidence.find((e) => e.id === id)!,
  );
  return {
    claims: [
      {
        text: facts.length
          ? "These source observations were selected for review. They do not establish an answer beyond what the cited records report, or a recommendation to trade."
          : "No relevant observation was selected. This evidence cannot establish an answer to your question.",
        evidenceIds: facts.map((fact) => fact.id),
      },
    ],
    facts,
  };
}
/** Byte bounded, fatal UTF-8 decoding; stalled uploads cancelled after deadline. */
export async function readAskBody(
  request: Request,
  timeoutMs = 5000,
): Promise<any> {
  if (!request.body || Number(request.headers.get("content-length")) > 8192) {
    void request.body?.cancel().catch(() => {});
    throw Error("Question body is missing or too long.");
  }
  const reader = request.body.getReader(),
    decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0,
    text = "",
    timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(Error("Question upload timed out.")),
      timeoutMs,
    );
  });
  try {
    for (;;) {
      const chunk = await Promise.race([reader.read(), deadline]);
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 8192) throw Error("Question is too long.");
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

const synthesisClaim = {
  type: "object",
  additionalProperties: false,
  required: ["text", "evidenceIds"],
  properties: {
    text: { type: "string" },
    evidenceIds: { type: "array", items: { type: "string" } },
  },
};
export const missingEvidence = {
  comparison_period: "A comparable reporting period is missing.",
  current_events: "Current event evidence is insufficient.",
  causal_evidence: "The records do not establish a cause.",
  valuation_basis: "A consistent valuation basis is missing.",
  personal_context:
    "Personal suitability is outside this company research view.",
  source_conflict:
    "Sources or reporting periods differ; they have not been reconciled.",
  coverage: "Evidence coverage is incomplete for this question.",
} as const;
export const synthesisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "interpretation", "factIds", "missing"],
  properties: {
    answer: { type: "array", items: synthesisClaim },
    interpretation: { type: "array", items: synthesisClaim },
    factIds: { type: "array", items: { type: "string" } },
    missing: {
      type: "array",
      items: { type: "string", enum: Object.keys(missingEvidence) },
    },
  },
};
export const synthesisReviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["safe", "claims"],
  properties: {
    safe: { type: "boolean" },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "supported"],
        properties: {
          index: { type: "integer" },
          supported: { type: "boolean" },
        },
      },
    },
  },
};
export function validateSynthesis(raw: unknown, evidence: Evidence[]) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("Invalid synthesis");
  const v = raw as Record<string, unknown>;
  if (
    Object.keys(v).some(
      (k) => !["answer", "interpretation", "factIds", "missing"].includes(k),
    )
  )
    throw Error("Unexpected synthesis fields");
  const selected = validateAnswer({ factIds: v.factIds }, evidence);
  const claims: {
    text: string;
    evidenceIds: string[];
    kind: "answer" | "interpretation";
  }[] = [];
  for (const kind of ["answer", "interpretation"] as const) {
    const rows = v[kind];
    if (!Array.isArray(rows) || rows.length > 2)
      throw Error("Invalid synthesis size");
    for (const row of rows) {
      if (
        !row ||
        typeof row !== "object" ||
        Object.keys(row).some((k) => !["text", "evidenceIds"].includes(k)) ||
        typeof row.text !== "string" ||
        row.text.trim().length < 10 ||
        row.text.length > 600 ||
        /[\p{N}\p{Sc}%٪<>]|https?:|www\.|\S+@\S+|\b(?:buy|sell|hold|short|purchase)\b|guaranteed|risk.free|certain profit/iu.test(
          row.text.replace(
            /\b(?:buy|sell|hold)\s+ratings?\b|\bshort[- ]interest\b/gi,
            "attributed research term",
          ),
        )
      )
        throw Error("Unsafe or unbounded prose");
      if (
        !Array.isArray(row.evidenceIds) ||
        !row.evidenceIds.length ||
        row.evidenceIds.length > 8 ||
        row.evidenceIds.some(
          (id: unknown) =>
            typeof id !== "string" || !evidence.some((e) => e.id === id),
        )
      )
        throw Error("Uncited synthesis");
      claims.push({
        text: row.text.trim(),
        evidenceIds: [...new Set(row.evidenceIds as string[])],
        kind,
      });
    }
  }
  if (
    !Array.isArray(v.missing) ||
    v.missing.length > 4 ||
    v.missing.some(
      (x) => typeof x !== "string" || !Object.hasOwn(missingEvidence, x),
    )
  )
    throw Error("Invalid missing evidence");
  return {
    claims,
    facts: selected.facts,
    missing: [...new Set(v.missing as (keyof typeof missingEvidence)[])].map(
      (k) => missingEvidence[k],
    ),
  };
}
/** A fallible second model check, not a proof of semantic entailment. */
export function validateSynthesisReview(
  raw: unknown,
  answer: ReturnType<typeof validateSynthesis>,
) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("Missing review");
  const v = raw as Record<string, unknown>;
  if (
    Object.keys(v).some((k) => !["safe", "claims"].includes(k)) ||
    v.safe !== true ||
    !Array.isArray(v.claims) ||
    v.claims.length !== answer.claims.length
  )
    throw Error("Unsupported answer");
  const indexes = new Set<number>();
  for (const row of v.claims) {
    if (
      !row ||
      typeof row !== "object" ||
      Object.keys(row).some((k) => !["index", "supported"].includes(k)) ||
      !Number.isInteger(row.index) ||
      row.index < 0 ||
      row.index >= answer.claims.length ||
      indexes.has(row.index) ||
      row.supported !== true
    )
      throw Error("Unsupported answer");
    indexes.add(row.index);
  }
}
