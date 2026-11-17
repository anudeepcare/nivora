import { modelCoverage } from "./research-depth.ts";
/** Reject a known contradictory label; never manufacture a replacement sector. */
export function companyClassification(input: {
  symbol: string;
  assetType: string;
  sector?: string | null;
  industry?: string | null;
}) {
  const coverage = modelCoverage(input.symbol, input.assetType, input),
    financial =
      /financial|capital markets|asset management|\bbanks?\b|insurance/i;
  const rejectSector =
      coverage.family === "infrastructure" &&
      financial.test(input.sector ?? ""),
    rejectIndustry =
      coverage.family === "infrastructure" &&
      financial.test(input.industry ?? "");
  return {
    sector: rejectSector ? null : input.sector || null,
    industry: rejectIndustry ? null : input.industry || null,
    conflicting: rejectSector || rejectIndustry,
  };
}
