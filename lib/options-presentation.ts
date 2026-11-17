import type { OptionContract } from "./options-analysis";
export function listedExpiries(
  contracts: OptionContract[],
  extra: string[] = [],
) {
  return [...new Set([...contracts.map((c) => c.expiry), ...extra])]
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
}
export function leapsExpiry(expiries: string[], now = Date.now()) {
  return (
    expiries.find(
      (d) => Date.parse(d + "T21:00:00Z") - now >= 365 * 86400000,
    ) ?? null
  );
}
export function displayedContracts(
  rows: OptionContract[],
  kind: string,
  liquidOnly: boolean,
  eligible: (c: OptionContract) => boolean,
) {
  return rows.filter(
    (c) => (kind === "all" || c.type === kind) && (!liquidOnly || eligible(c)),
  );
}
