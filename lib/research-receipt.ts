import type { FinancialPeriod } from "./types";
export type MetricReceipt = {
  label: string;
  value: number | null;
  unit: string;
  period: string;
  formula: string;
  sources: string[];
  gap: string;
};
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const safeUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
};
export function periodReceipts(
  latest: FinancialPeriod | null | undefined,
  prior: FinancialPeriod | null | undefined,
  asOf: string,
): MetricReceipt[] {
  if (
    !latest ||
    !Number.isFinite(Date.parse(latest.end)) ||
    !Number.isFinite(Date.parse(asOf)) ||
    latest.end > asOf
  )
    return [];
  const sources = [
    ...new Set(
      [latest.sourceUrl, ...(latest.sourceUrls ?? [])]
        .map(safeUrl)
        .filter((s): s is string => !!s),
    ),
  ];
  const compatible =
    prior &&
    prior.end < latest.end &&
    latest.currency === prior.currency &&
    latest.basis === prior.basis;
  const div = (a: unknown, b: unknown) =>
    finite(a) && finite(b) && b > 0 ? (a / b) * 100 : null;
  const rows: [string, number | null, string, string][] = [
    [
      "Revenue",
      finite(latest.revenue) ? latest.revenue : null,
      latest.currency,
      "Reported revenue for the selected period.",
    ],
    [
      "Revenue growth",
      compatible &&
      finite(latest.revenue) &&
      finite(prior.revenue) &&
      prior.revenue > 0
        ? (latest.revenue / prior.revenue - 1) * 100
        : null,
      "%",
      "(Current revenue / comparable prior revenue − 1) × 100.",
    ],
    [
      "Cash-flow margin",
      div(latest.fcf, latest.revenue),
      "%",
      "(Operating cash flow − capital spending) / revenue × 100.",
    ],
    [
      "Operating margin",
      div(latest.operatingIncome, latest.revenue),
      "%",
      "Operating income / revenue × 100.",
    ],
    [
      "Net margin",
      div(latest.netIncome, latest.revenue),
      "%",
      "Net income / revenue × 100.",
    ],
  ];
  return rows.map(([label, value, unit, formula]) => ({
    label,
    value,
    unit,
    period: latest.end,
    formula,
    sources:
      label === "Revenue growth" && compatible
        ? [
            ...new Set([
              ...sources,
              ...[prior.sourceUrl, ...(prior.sourceUrls ?? [])]
                .map(safeUrl)
                .filter((s): s is string => !!s),
            ]),
          ]
        : sources,
    gap: value === null ? "Compatible inputs are unavailable." : "",
  }));
}
const plain = (s: string) =>
  s
    .replace(/[<>\[\]`]/g, "")
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);
export function receiptMarkdown(input: {
  symbol: string;
  name: string;
  observedAt: string;
  receipts: MetricReceipt[];
}) {
  return (
    `# ${plain(input.symbol)} — ${plain(input.name)}\n\nObserved: ${plain(input.observedAt)}\n\n` +
    input.receipts
      .map(
        (r) =>
          `## ${plain(r.label)}\n${r.value === null ? "Unavailable" : r.value.toFixed(2) + " " + plain(r.unit)} · period ${plain(r.period)}\n\n${plain(r.formula)}\n${r.gap ? plain(r.gap) + "\n" : ""}${r.sources
            .map((s) => safeUrl(s))
            .filter(Boolean)
            .join("\n")}\n`,
      )
      .join("\n") +
    "\nResearch snapshot, not a return forecast.\n"
  );
}
/** Bounded line comparison, preserves source text and never interprets sentiment. */
export function comparePassages(
  before: string,
  after: string,
): { kind: "same" | "added" | "removed"; text: string }[] {
  if (before.length > 30000 || after.length > 30000)
    throw Error("Use passages of at most 30,000 characters.");
  const a = before.split("\n"),
    b = after.split("\n");
  if (a.length > 250 || b.length > 250)
    throw Error("Use passages of at most 250 lines.");
  const dp = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1),
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: ReturnType<typeof comparePassages> = [];
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.push({ kind: "same", text: a[i++] });
      j++;
    } else if (i < a.length && (j === b.length || dp[i + 1][j] >= dp[i][j + 1]))
      out.push({ kind: "removed", text: a[i++] });
    else out.push({ kind: "added", text: b[j++] });
  }
  return out;
}
