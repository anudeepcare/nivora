/** Unknown readings remain visible during a Pace filter; absence is not a non-match. */
export function portfolioPaceFilter({
  filter,
  eligible,
  level,
  hasSignal,
}: {
  filter: string;
  eligible: boolean;
  level: number | null | undefined;
  hasSignal: boolean;
}) {
  if (filter === "all") return true;
  if (!eligible) return false;
  return !hasSignal || String(level) === filter;
}
