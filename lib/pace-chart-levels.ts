export const paceChartColours: Record<number, string> = {
  0: "#d89a20",
  1: "#7d9db0",
  2: "#12a28b",
  3: "#71b337",
  4: "#ac68e5",
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
