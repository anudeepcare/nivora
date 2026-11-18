import type { Research } from "./types";
import { researchOutlook } from "./outlook.ts";
/** Shared default and explicitly selected fiscal-period projection, not an admission override. */
export function selectedScenarioProjection(
  input: Research,
  hasValuation: boolean,
  fiscalEnd?: string,
  calculate: typeof researchOutlook = researchOutlook,
) {
  const ordinary = calculate(input, {
    fiscalEnd: fiscalEnd || undefined,
  });
  return ordinary.available || (hasValuation && !fiscalEnd)
    ? ordinary
    : calculate(input, {
        fiscalEnd: fiscalEnd || undefined,
        priceAnchored: true,
      });
}
