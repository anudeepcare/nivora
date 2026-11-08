import { paceLevel } from "./pace-presentation.ts";

type Reading = { multiplier?: number | null; date?: string | null };
/** Historical zones remain evidence, never a substitute for recent price context. */
export function currentPace(
  closing: Reading & { forming?: Reading | null },
  now: number,
) {
  const recent = (r?: Reading | null) => {
    const stamp = Date.parse(r?.date ?? "");
    return (
      Number.isFinite(now) &&
      Number.isFinite(stamp) &&
      stamp <= now &&
      now - stamp <= 4 * 86400000 &&
      paceLevel(r?.multiplier) !== null
    );
  };
  const forming = recent(closing.forming) ? closing.forming : null;
  const reading = forming ?? (recent(closing) ? closing : null);
  const level = paceLevel(reading?.multiplier);
  const historicalLevel = paceLevel(closing.multiplier);
  // A developing deeper zone cannot increase an established plan. A shallower
  // current zone immediately limits it: October P4 + November P1 is not Buy.
  const eligibleLevel =
    level === null
      ? null
      : historicalLevel === null
        ? level <= 1
          ? level
          : null
        : Math.min(level, historicalLevel);
  return {
    level,
    eligibleLevel,
    date: reading?.date ?? null,
    provisional: !!forming,
    historicalLevel,
    historicalDate: closing.date ?? null,
    changed:
      level !== null && historicalLevel !== null && level !== historicalLevel,
    awaitingClose:
      level !== null &&
      level >= 2 &&
      (historicalLevel === null || level > historicalLevel),
  };
}
