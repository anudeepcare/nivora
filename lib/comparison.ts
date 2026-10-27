import type { Research } from "./types";
import { sameProviderSymbol, providerSymbol } from "./provider-symbol.ts";
export function verifiedResearch(
  r: Research | null | undefined,
  requested: string,
): r is Research {
  let canonical: string;
  try {
    canonical = providerSymbol(requested);
  } catch {
    return false;
  }
  return (
    !!r &&
    sameProviderSymbol(r.company.symbol, canonical) &&
    (r.coverage?.profile.status === "available" ||
      (r.company.name !== r.company.symbol && !!r.company.exchange) ||
      r.facts.length > 0 ||
      r.history.length > 0 ||
      (r.quote.price != null &&
        Number.isFinite(r.quote.price) &&
        r.quote.price > 0))
  );
}
export async function loadComparison(
  symbols: string[],
  read: (symbol: string) => Promise<Research | undefined>,
) {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => read(providerSymbol(symbol))),
  );
  const rows: Research[] = [],
    issues: string[] = [];
  results.forEach((result, i) => {
    if (
      result.status === "fulfilled" &&
      verifiedResearch(result.value, symbols[i])
    )
      rows.push(result.value);
    else
      issues.push(
        `${symbols[i]}: ${result.status === "rejected" && result.reason instanceof Error ? result.reason.message : "Use company search to confirm the listing; its identity has not been verified."}`,
      );
  });
  return { rows, issues };
}
export function comparisonCompatibility(
  periods: {
    currency?: string | null;
    end?: string | null;
    basis?: string | null;
  }[],
) {
  const varied = (field: "currency" | "end" | "basis") =>
    new Set(periods.map((p) => p[field]).filter(Boolean)).size > 1;
  return [
    varied("currency")
      ? "Reporting currencies differ; amounts have not been converted."
      : "",
    varied("end")
      ? "Reporting dates differ; compare the periods shown below."
      : "",
    varied("basis")
      ? "Annual and trailing periods are mixed; growth and margins need context."
      : "",
  ].filter(Boolean);
}
