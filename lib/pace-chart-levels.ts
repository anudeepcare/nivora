/** Muted categorical signals, not daily gain/loss colors. */
export const paceExtensionColour = "#ad5968";
export const paceUnavailableColour = "#7c828c";
export const paceChartColours: Record<number, string> = {
  0: "#a66d20",
  1: "#64748b",
  2: "#348579",
  3: "#437eae",
  4: "#8566b0",
};
type Bands = { buy2: number; buy3: number; buy4: number };
/** Forming-window boundaries take precedence, including intentionally absent v7 bands. */
export function paceChartLevels(
  forming: Bands | null | undefined,
  confirmed: Bands | null | undefined,
) {
  const signal = forming ?? confirmed;
  const colours = paceChartColours;
  return signal
    ? [
        { label: "P2 zone", price: signal.buy2, color: colours[2] },
        { label: "P3 zone", price: signal.buy3, color: colours[3] },
        { label: "P4 zone", price: signal.buy4, color: colours[4] },
      ].filter((level) => Number.isFinite(level.price) && level.price > 0)
    : [];
}
