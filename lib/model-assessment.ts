import type { Research } from "./types";
import { modelCoverage } from "./research-depth.ts";
import { researchDecision } from "./decision-research.ts";
import { researchOutlook, consensusOutlook } from "./outlook.ts";
export function modelAssessment(r: Research) {
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  const decision = researchDecision(r),
    outlook = researchOutlook(r),
    consensus = consensusOutlook(r),
    generic = coverage.family === "operating-company";
  type Method = {
    key: string;
    name: string;
    status: "available" | "missing" | "unsuitable";
    reason: string;
  };
  const methods: Method[] = [
    {
      key: "cash",
      name: "Cash-flow sensitivity",
      status: !generic
        ? "unsuitable"
        : decision.modelEligible &&
            decision.modelCashFlowPerShare != null &&
            decision.modelCashFlowPerShare > 0
          ? "available"
          : "missing",
      reason: !generic
        ? coverage.method
        : decision.modelEligible &&
            decision.modelCashFlowPerShare != null &&
            decision.modelCashFlowPerShare > 0
          ? "Positive reported cash flow and reconciled per-share inputs. Growth and required return remain your assumptions."
          : "Positive cash flow, a dated share count and aligned reporting/listing currency must reconcile.",
    },
    {
      key: "earnings",
      name: "Earnings scenarios",
      status: !generic
        ? "unsuitable"
        : outlook.available && outlook.basis === "earnings"
          ? "available"
          : "missing",
      reason: !generic
        ? "Generic EPS multiples are not a substitute for the sector-specific model."
        : outlook.available && outlook.basis === "earnings"
          ? "Dated annual EPS estimates and an explicit earnings multiple support conditional price scenarios."
          : !outlook.available
            ? outlook.reason
            : "Available revenue estimates are not earnings scenarios.",
    },
    {
      key: "consensus",
      name: "Analyst price target",
      status: consensus ? "available" : "missing",
      reason: consensus
        ? "Published analyst opinion. It is separate from AURYN modelled value and is not a bear/base/bull range."
        : "A positive dated target in the listing currency has not been supplied within the accepted observation window.",
    },
  ];
  return {
    family: coverage.family,
    methods,
    next: coverage.drivers,
    method: coverage.method,
  };
}
