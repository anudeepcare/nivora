import type { OptionContract } from "./options-analysis";
export type ExposureCell = {
  key: string;
  strike: number;
  expiry: string;
  observed: string | null;
  gex: number | null;
  oi: number | null;
  volume: number | null;
  coverage: number;
  count: number;
};
export type ExposureBoard = {
  spot: number;
  contracts: number;
  universe: string;
  cells: ExposureCell[];
};
export type BoardPreset = {
  name: string;
  metric: "gex" | "oi";
  range: number;
  expirations: number;
  minimum: number;
  normalized: boolean;
};
export type BoardSnapshot = {
  id: string;
  symbol: string;
  savedAt: string;
  board: ExposureBoard;
};
const nonnegative = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x >= 0;
const day = (x: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString().slice(0, 10) === x;
export function exposureBoard(
  input: OptionContract[],
  spot: number,
): ExposureBoard {
  const rows = [
    ...new Map(
      input
        .filter(
          (c) =>
            c.standard &&
            c.multiplier === 100 &&
            Number.isFinite(c.strike) &&
            c.strike > 0 &&
            day(c.expiry) &&
            day(c.observed.slice(0, 10)) &&
            ["call", "put"].includes(c.type),
        )
        .map((c) => [c.id, c]),
    ).values(),
  ];
  const grouped = new Map<string, OptionContract[]>();
  for (const c of rows) {
    const k = `${c.strike}|${c.expiry}`;
    grouped.set(k, [...(grouped.get(k) ?? []), c]);
  }
  const cells = [...grouped]
    .map(([key, cs]) => {
      const dates = new Set(cs.map((c) => c.observed));
      const usable = cs.filter(
        (c) => nonnegative(c.gamma) && nonnegative(c.oi),
      );
      const coherent = dates.size === 1;
      const gex =
        coherent &&
        usable.length === cs.length &&
        Number.isFinite(spot) &&
        spot > 0
          ? cs.reduce(
              (s, c) =>
                s +
                (c.type === "call" ? 1 : -1) *
                  c.gamma! *
                  c.oi! *
                  100 *
                  spot *
                  spot *
                  0.01,
              0,
            )
          : null;
      return {
        key,
        strike: cs[0].strike,
        expiry: cs[0].expiry,
        observed: coherent ? cs[0].observed : null,
        gex: gex !== null && Number.isFinite(gex) ? gex : null,
        oi:
          coherent && cs.every((c) => nonnegative(c.oi))
            ? cs.reduce((s, c) => s + c.oi!, 0)
            : null,
        volume:
          coherent && cs.every((c) => nonnegative(c.volume))
            ? cs.reduce((s, c) => s + c.volume!, 0)
            : null,
        coverage: coherent ? usable.length / cs.length : 0,
        count: cs.length,
      };
    })
    .sort((a, b) => a.strike - b.strike || a.expiry.localeCompare(b.expiry));
  return {
    spot: Number.isFinite(spot) ? spot : 0,
    contracts: rows.length,
    universe: rows
      .map((c) => `${c.id}:${c.type}:${c.strike}:${c.expiry}`)
      .sort()
      .join("|"),
    cells,
  };
}
/** Constant spot and identical contract universe isolate exposure changes from repricing and pagination. */
export function compareExposure(before: ExposureBoard, after: ExposureBoard) {
  if (before.spot !== after.spot || before.universe !== after.universe)
    return [];
  const old = new Map(before.cells.map((c) => [c.key, c]));
  return after.cells
    .flatMap((c) => {
      const p = old.get(c.key);
      return p &&
        p.gex !== null &&
        c.gex !== null &&
        p.observed &&
        c.observed &&
        p.observed < c.observed
        ? [
            {
              key: c.key,
              strike: c.strike,
              expiry: c.expiry,
              before: p.gex,
              after: c.gex,
              change: c.gex - p.gex,
            },
          ]
        : [];
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}
export function parseBoardState(raw: string | null): {
  presets: BoardPreset[];
  snapshots: BoardSnapshot[];
} {
  try {
    const v = JSON.parse(raw ?? "{}");
    const presets = Array.isArray(v?.presets)
      ? v.presets
          .filter(
            (p: BoardPreset) =>
              p &&
              typeof p.name === "string" &&
              p.name.length <= 60 &&
              ["gex", "oi"].includes(p.metric) &&
              [12, 24, 40, 80].includes(p.range) &&
              [1, 3, 6, 12].includes(p.expirations) &&
              nonnegative(p.minimum) &&
              typeof p.normalized === "boolean",
          )
          .slice(-10)
      : [];
    const snapshots = Array.isArray(v?.snapshots)
      ? v.snapshots
          .filter(
            (s: BoardSnapshot) =>
              s &&
              typeof s.id === "string" &&
              typeof s.symbol === "string" &&
              s.symbol.length <= 25 &&
              typeof s.savedAt === "string" &&
              Number.isFinite(Date.parse(s.savedAt)) &&
              s.board &&
              Number.isFinite(s.board.spot) &&
              s.board.spot > 0 &&
              typeof s.board.universe === "string" &&
              s.board.universe.length <= 2000000 &&
              Number.isInteger(s.board.contracts) &&
              s.board.contracts >= 0 &&
              Array.isArray(s.board.cells) &&
              s.board.cells.length <= 20000 &&
              s.board.cells.every(
                (c: ExposureCell) =>
                  c &&
                  typeof c.key === "string" &&
                  Number.isFinite(c.strike) &&
                  c.strike > 0 &&
                  typeof c.expiry === "string" &&
                  day(c.expiry) &&
                  (c.observed === null ||
                    (typeof c.observed === "string" &&
                      Number.isFinite(Date.parse(c.observed)))) &&
                  (c.gex === null ||
                    (typeof c.gex === "number" && Number.isFinite(c.gex))) &&
                  (c.oi === null || nonnegative(c.oi)) &&
                  (c.volume === null || nonnegative(c.volume)) &&
                  Number.isFinite(c.coverage) &&
                  c.coverage >= 0 &&
                  c.coverage <= 1 &&
                  Number.isInteger(c.count) &&
                  c.count > 0,
              ),
          )
          .slice(-12)
      : [];
    return { presets, snapshots };
  } catch {
    return { presets: [], snapshots: [] };
  }
}

/** Pick the latest genuinely comparable source observation, never an arbitrary first save. */
export function latestExposureChanges(
  snapshots: BoardSnapshot[],
  symbol: string,
  board: ExposureBoard,
) {
  for (const snapshot of [...snapshots].reverse()) {
    if (snapshot.symbol !== symbol) continue;
    const changes = compareExposure(snapshot.board, board);
    if (changes.length) return { baseline: snapshot, changes };
  }
  return { baseline: null, changes: [] };
}
export function latestSymbolSnapshots(snapshots: BoardSnapshot[]) {
  const latest = new Map<string, BoardSnapshot>();
  for (const snapshot of snapshots) {
    const old = latest.get(snapshot.symbol);
    if (!old || old.savedAt < snapshot.savedAt)
      latest.set(snapshot.symbol, snapshot);
  }
  return [...latest.values()]
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .slice(0, 6);
}
