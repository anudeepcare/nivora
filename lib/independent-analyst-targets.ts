import type { Access } from "./access-policy";
import type { Research } from "./types";
import {
  usableAnalystTargets,
  type AnalystTargets,
} from "./sentisense-targets.ts";
export type AnalystTargetResponse = {
  symbol: string;
  enabled: boolean;
  targets: AnalystTargets | null;
};
export function canReadAnalystTargets(a: Access) {
  return (
    !a.enabled ||
    (a.owner && !a.preview) ||
    a.features.analysts ||
    a.features.overview ||
    a.features.value ||
    a.features.advanced
  );
}
/** Enrichment never changes quote, financial evidence, or observation clocks. */
export function mergeIndependentTargets<T extends Research>(
  base: T | null,
  response: AnalystTargetResponse | null,
  now: number,
): T | null {
  if (
    !base ||
    !response?.enabled ||
    response.symbol !== base.company.symbol ||
    base.company.assetType !== "stock" ||
    base.company.currency !== "USD" ||
    base.quote.currency !== "USD" ||
    !usableAnalystTargets(
      response.targets ?? undefined,
      base.company.symbol,
      base.quote.currency,
      now,
    )
  )
    return base;
  const current = base.analystTargets;
  if (
    usableAnalystTargets(
      current,
      base.company.symbol,
      base.quote.currency,
      now,
    ) &&
    Date.parse(current.updatedAt) >= Date.parse(response.targets!.updatedAt)
  )
    return base;
  return { ...base, analystTargets: response.targets! };
}
