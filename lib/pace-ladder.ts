import type { PacePriceRange } from "./pace-price-zones.ts";

export type PaceLadderStep = {
  level: number;
  current: boolean;
  bands: number;
  price: number | null;
  /** How the shown price relates to the stage: the stage applies at or below / at or above it. */
  relation: "now" | "at-or-below" | "at-or-above" | null;
};

/** One representative price per Pace stage for the compact ladder.
 * Presentation only: bands come from the existing classifier scan and are not changed.
 * Zones can be disconnected, so a stage deeper than the current one shows its nearest
 * band below today's reference (and a shallower stage its nearest band above) before
 * falling back to the other side. This keeps the ladder consistent with the
 * next-checkpoint line instead of showing a deeper stage at a higher price. */
export function paceLadder(
  zones: { ranges: PacePriceRange[]; reference: number },
  levels = 5,
): PaceLadderStep[] {
  const ref = zones.reference;
  const holds = (x: PacePriceRange) => x.low <= ref && ref <= x.high;
  const currentLevel = zones.ranges.find(holds)?.level ?? null;
  return Array.from({ length: levels }, (_, level) => {
    const ranges = zones.ranges.filter((x) => x.level === level);
    if (ranges.some(holds))
      return {
        level,
        current: true,
        bands: ranges.length,
        price: ref,
        relation: "now" as const,
      };
    const below = ranges
        .filter((x) => x.high <= ref)
        .sort((a, b) => b.high - a.high)[0],
      above = ranges
        .filter((x) => x.low >= ref)
        .sort((a, b) => a.low - b.low)[0];
    const preferBelow =
      currentLevel == null
        ? !!below && (!above || ref - below.high <= above.low - ref)
        : level > currentLevel;
    const pick = preferBelow
      ? below
        ? ({ price: below.high, relation: "at-or-below" } as const)
        : above
          ? ({ price: above.low, relation: "at-or-above" } as const)
          : null
      : above
        ? ({ price: above.low, relation: "at-or-above" } as const)
        : below
          ? ({ price: below.high, relation: "at-or-below" } as const)
          : null;
    return {
      level,
      current: false,
      bands: ranges.length,
      price: pick?.price ?? null,
      relation: pick?.relation ?? null,
    };
  });
}
