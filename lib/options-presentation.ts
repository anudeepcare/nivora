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

/** Display reported Greeks even when deliverables are unverified; analysis still checks standard. */
export function contractSnapshotRows(
  contracts: OptionContract[],
  expiry: string,
) {
  const rows = contracts.filter((c) => c.expiry === expiry);
  const latest = rows
    .map((c) => c.observed)
    .sort()
    .at(-1);
  return rows.filter((c) => c.observed === latest);
}

/** A returned snapshot supersedes its scope; do not retain vanished contracts as current. */
export function replaceChainSnapshot(
  previous: OptionContract[],
  incoming: OptionContract[],
  expiry: string | null,
) {
  return [
    ...new Map(
      [
        ...(expiry ? previous.filter((c) => c.expiry !== expiry) : []),
        ...incoming,
      ].map((c) => [c.id, c]),
    ).values(),
  ];
}

/** Date-only evidence is not an intraday timestamp; retain its uncertainty. */
export function optionsObservationTime(value: string | null | undefined) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    return "Observation time not supplied";
  const prefix = value.slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(prefix) ||
    new Date(prefix).toISOString().slice(0, 10) !== prefix
  )
    return "Observation time not supplied";
  if (value === prefix) return `${value} · time not supplied`;
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  )
    return "Observation time not supplied";
  return new Date(value).toISOString().slice(0, 19).replace("T", " ") + " UTC";
}
