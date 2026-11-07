"use client";
import { exposureDates } from "@/lib/exposure-window";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Camera,
  Download,
  Focus,
  Layers3,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { amount, dateLabel } from "@/lib/format";
import {
  exposureBoard,
  latestExposureChanges,
  latestSymbolSnapshots,
  parseBoardState,
  type BoardPreset,
  type BoardSnapshot,
  type ExposureCell,
} from "@/lib/exposure-board";
import type { OptionContract } from "@/lib/options-analysis";
import { Help } from "./Ui";
import s from "./ExposureBoard.module.css";
const storageKey = "auryn-exposure-workspace-v1";
export default function ExposureBoard({
  contracts,
  spot,
  symbol,
  complete,
  expiry,
  onContracts,
  externalSnapshot,
  onExitReplay,
  accountPresets,
  onPresetsChanged,
  onCreateAlert,
  accountTools,
}: {
  accountTools?: ReactNode;
  contracts: OptionContract[];
  spot: number;
  symbol: string;
  complete: boolean;
  expiry?: string;
  onContracts?: () => void;
  onCreateAlert?: (
    cell: ExposureCell,
    type: "exposure-approach" | "exposure-cross" | "exposure-change",
  ) => void;
  externalSnapshot?: BoardSnapshot;
  onExitReplay?: () => void;
  accountPresets?: BoardPreset[];
  onPresetsChanged?: (presets: BoardPreset[]) => void;
}) {
  const live = useMemo(() => exposureBoard(contracts, spot), [contracts, spot]);
  const [metric, setMetric] = useState<"gex" | "oi">("gex"),
    [range, setRange] = useState(12),
    [expirations, setExpirations] = useState(12),
    [months, setMonths] = useState(0),
    [minimum, setMinimum] = useState(0),
    [normalized, setNormalized] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [saved, setSaved] = useState<ReturnType<typeof parseBoardState>>({
      presets: [],
      snapshots: [],
    }),
    [snapshot, setSnapshot] = useState(""),
    [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [mode, setMode] = useState("map");
  const table = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      setSaved(parseBoardState(localStorage.getItem(storageKey)));
    } catch {
      setMessage("Device storage is unavailable. The live board still works.");
    }
  }, []);
  useEffect(() => {
    setSnapshot("");
    setSelected(null);
    setMessage("");
  }, [symbol]);
  useEffect(() => {
    if (accountPresets)
      setSaved((old) => ({ ...old, presets: accountPresets }));
  }, [accountPresets]);
  useEffect(() => {
    onPresetsChanged?.(saved.presets);
  }, [saved.presets, onPresetsChanged]);
  const snapshots = saved.snapshots.filter((x) => x.symbol === symbol);
  const chosen = externalSnapshot ?? snapshots.find((x) => x.id === snapshot);
  const board = chosen?.board ?? live;
  const dates = exposureDates(board.cells.map(c=>c.expiry), months, expiry, chosen ? Date.parse(chosen.savedAt) : Date.now());
  const dateSet = new Set(dates);
  const strikes = [
    ...new Set(
      board.cells.filter((c) => dateSet.has(c.expiry)).map((c) => c.strike),
    ),
  ]
    .sort((a, b) => Math.abs(a - board.spot) - Math.abs(b - board.spot))
    .slice(0, range)
    .sort((a, b) => b - a);
  const strikeSet = new Set(strikes);
  const cells = board.cells.filter(
    (c) => dateSet.has(c.expiry) && strikeSet.has(c.strike),
  );
  const value = (c: ExposureCell) => (metric === "gex" ? c.gex : c.oi);
  const measured = cells.filter((c) => value(c) !== null);
  const concentrations = measured.filter((c) => Math.abs(value(c)!) > 0);
  const largest = [...concentrations].sort(
    (a, b) => Math.abs(value(b)!) - Math.abs(value(a)!),
  )[0];
  const max = Math.max(1, ...measured.map((c) => Math.abs(value(c)!)));
  const nearest = strikes.reduce<number | null>(
    (a, n) =>
      a === null || Math.abs(n - board.spot) < Math.abs(a - board.spot) ? n : a,
    null,
  );
  const focus = cells.find((c) => c.key === selected);
  const byKey = new Map(cells.map((c) => [c.key, c]));
  const eligible = strikes.filter(
    (strike) =>
      minimum === 0 ||
      cells.some(
        (c) =>
          c.strike === strike &&
          value(c) !== null &&
          Math.abs(value(c)!) >= minimum,
      ),
  );
  const above = [...concentrations]
    .filter((c) => c.strike > board.spot)
    .sort((a, b) => Math.abs(value(b)!) - Math.abs(value(a)!))[0];
  const below = [...concentrations]
    .filter((c) => c.strike < board.spot)
    .sort((a, b) => Math.abs(value(b)!) - Math.abs(value(a)!))[0];
  const comparison = latestExposureChanges(snapshots, symbol, board);
  const changes = comparison.changes;
  function persist(next: typeof saved) {
    try {
      const raw = JSON.stringify(next);
      if (parseBoardState(raw).snapshots.length !== next.snapshots.length) {
        setMessage(
          "This snapshot is too large to retain safely. Export this view instead.",
        );
        return false;
      }
      localStorage.setItem(storageKey, raw);
      setSaved(next);
      return true;
    } catch {
      setMessage(
        "Could not save on this device. Try exporting the board instead.",
      );
      return false;
    }
  }
  function saveSnapshot() {
    const now = new Date().toISOString();
    const next = {
      ...saved,
      snapshots: [
        ...saved.snapshots,
        { id: crypto.randomUUID(), symbol, savedAt: now, board: live },
      ].slice(-12),
    };
    if (persist(next))
      setMessage(
        "Snapshot saved on this device. This is not an intraday history feed.",
      );
  }
  function savePreset() {
    if (!name.trim()) {
      setMessage("Give this view a name first.");
      return;
    }
    const p: BoardPreset = {
      name: name.trim().slice(0, 60),
      metric,
      range,
      expirations,
      months,
      minimum,
      normalized,
    };
    if (
      persist({
        ...saved,
        presets: [...saved.presets.filter((x) => x.name !== p.name), p].slice(
          -10,
        ),
      })
    ) {
      setMessage("View saved on this device.");
      setName("");
    }
  }
  function applyPreset(n: string) {
    const p = saved.presets.find((x) => x.name === n);
    if (p) {
      setMetric(p.metric);
      setRange(p.range);
      setExpirations(p.expirations);
      setMonths(p.months ?? 0);
      setMinimum(p.minimum);
      setNormalized(p.normalized);
    }
  }
  function center(strike: number | null) {
    if (strike !== null)
      table.current
        ?.querySelector(`[data-strike="${strike}"]`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  function exportBoard() {
    const text = [
      "AURYN exposure map — " + symbol,
      "Snapshot export; calls positive / puts negative estimate. Not dealer inventory.",
      "Strike\tExpiration\tSource observation\tEstimated GEX per 1% move\tOpen interest\tInput coverage",
      ...cells.map((c) =>
        [
          c.strike,
          c.expiry,
          c.observed ?? "Mixed dates",
          c.gex ?? "Unavailable",
          c.oi ?? "Unavailable",
          c.coverage,
        ].join("\t"),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/tab-separated-values;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `AURYN-${symbol.replace(/[^A-Za-z0-9.-]/g, "")}-exposure.tsv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      className={s.board}
      aria-label="Options exposure workspace"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.repeat)
          return;
        const target = event.target as HTMLElement;
        if (
          target.closest(
            "input, textarea, select, button, a, [contenteditable=true]",
          )
        )
          return;
        const key = event.key.toLowerCase();
        if (!["f", "l", "s", "escape"].includes(key)) return;
        event.preventDefault();
        if (key === "f") center(nearest);
        if (key === "l" && largest) {
          setSelected(largest.key);
          center(largest.strike);
        }
        if (key === "s" && live.cells.length) saveSnapshot();
        if (key === "escape") setSelected(null);
      }}
    >
      <header className={s.heading}>
        <div>
          <h3>
            <Layers3 size={21} /> Gamma heatmap
          </h3>
        </div>
        <div className={s.tabs} aria-label="Exposure workspace views">
          {[
            ["map", "Exposure map"],
            ["changes", "Saved changes"],
            ["compare", "Compare snapshots"],
            ["symbols", "Saved symbols"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <Help label="How to read the exposure map">
          <p><strong>Start with open interest.</strong> It counts option contracts still open, not today's trading volume. Gamma describes how quickly an option's sensitivity to the stock price changes as the stock moves.</p>
          <p><strong>Read the grid:</strong> rows are option strike prices, not targets; columns are expiration dates. Choose Open interest under Measure to see contract counts, or Estimated GEX for estimated gamma exposure per 1% stock-price move.</p>
          <p><strong>Example:</strong> $949.6K in the $360 row and November 20 column means estimated gamma exposure for contracts at that strike and expiry. It is not money invested, expected profit, or a forecast that the stock will reach $360.</p>
          <p><strong>Colors and markers:</strong> darker shading means a larger absolute value. Green uses a call-positive estimate and red a put-negative estimate. Green does not mean bullish; red does not mean bearish. The star marks the largest displayed cell. A dash means unmeasured, not zero.</p>
          <p><strong>Summary cards:</strong> Largest visible is the biggest absolute cell in the displayed range. Below price and Above price identify the largest measured cells on each side of the stock price—not guaranteed support or resistance.</p>
          <p>GEX uses gamma × open interest × contract multiplier × stock price squared × 0.01. Calls are positive and puts negative by convention; actual dealer positions and hedging activity are not known.</p>
          <p>Coverage describes usable returned inputs, not the entire market. Cells can have different observation dates. Device snapshots stay in this browser; use History &amp; saved views for cross-device storage.</p>
        </Help>
      </header>
      {externalSnapshot && (
        <div className={s.detail} role="status">
          <p>
            Account replay is active. Return to the latest loaded view to
            inspect device snapshots.
          </p>
          {onExitReplay && (
            <button type="button" onClick={onExitReplay}>
              Exit account replay
            </button>
          )}
        </div>
      )}
      {mode === "map" && (
        <>
          <p className={s.reading}>Loaded expirations · darker cells show more {metric === "gex" ? "estimated gamma exposure" : "open contracts"}. Select a level to inspect its data.</p>
          <div className={s.toolbar}>
            <label>
              Measure
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as "gex" | "oi")}
              >
                <option value="gex">Gamma estimate</option>
                <option value="oi">Open contracts (OI)</option>
              </select>
            </label>
            <label>
              Nearby strikes
              <select
                value={range}
                onChange={(e) => setRange(Number(e.target.value))}
              >
                {[12, 24, 40, 80].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Expiration range
              <select value={months} onChange={e=>setMonths(Number(e.target.value))}>
                <option value={0}>All expirations</option><option value={1}>Next 1 month</option><option value={2}>Next 2 months</option><option value={6}>Next 6 months</option><option value={-1}>Selected date only</option>
              </select>
            </label>
            <label>
              Hide values below
              <select
                value={minimum}
                onChange={(e) => setMinimum(Number(e.target.value))}
              >
                {[0, 100, 1000, 10000, 100000].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? "Show all" : n.toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={normalized}
                onChange={(e) => setNormalized(e.target.checked)}
              />{" "}
              % of largest
            </label>
            <div className={s.actions}>
              <button type="button" onClick={() => center(nearest)}>
                <Focus size={16} /> Center
              </button>
              <button
                type="button"
                onClick={() => {
                  if (largest) {
                    setSelected(largest.key);
                    center(largest.strike);
                  }
                }}
              >
                <Star size={16} /> Largest
              </button>
              <button
                type="button"
                onClick={saveSnapshot}
                disabled={!live.cells.length}
              >
                <Camera size={16} /> Save snapshot
              </button>
              <button
                type="button"
                onClick={exportBoard}
                disabled={!cells.length}
              >
                <Download size={16} /> Export
              </button>
              {onContracts && (
                <button type="button" onClick={onContracts}>
                  Contracts →
                </button>
              )}
            </div>
          </div>
          <div className={s.summary}>
            {[
              ["Strongest concentration", largest],
              ["Largest below stock price", below],
              ["Largest above stock price", above],
            ].map(([label, c]) => {
              const cell = c as ExposureCell | undefined;
              return (
                <article key={String(label)} data-location={String(label).includes("below")?"below":String(label).includes("above")?"above":"largest"}>
                  <span>{String(label)}</span>
                  <strong>{cell ? amount(cell.strike) : "Not measured"}</strong>
                  {cell && board.spot > 0 && <small>{Math.abs((cell.strike / board.spot - 1)*100).toFixed(1)}% {cell.strike >= board.spot ? "above" : "below"} current price</small>}
                  <small>
                    {cell
                      ? `${cell.expiry} · ${metric === "gex" ? amount(cell.gex, "USD", true) : cell.oi?.toLocaleString() + " contracts"}`
                      : "No non-zero concentration in view"}
                  </small>
                </article>
              );
            })}
          </div>
        </>
      )}
      {mode === "map" && (
        <>
          <div className={s.legend}>
            <span>{metric === "gex" ? "− Put-side estimate" : "Open contract count"}</span>
            <i />
            <span>{metric === "gex" ? "+ Call-side estimate · not bullish/bearish" : "Darker = more open contracts"}</span>
            <span>
              ★ Largest · outlined row nearest price {amount(board.spot)}
            </span>
          </div>
          <div className={s.scroll} ref={table}>
            <table>
              <caption>
                {symbol} ·{" "}
                {metric === "gex"
                  ? "Estimated gamma dollars per 1% stock move"
                  : "Reported open contracts"}
                {normalized
                  ? " · display normalized to largest absolute value"
                  : ""}
              </caption>
              <thead>
                <tr>
                  <th>Strike</th>
                  {dates.map((d) => (
                    <th key={d}>{dateLabel(d)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {eligible.map((strike) => (
                  <tr
                    key={strike}
                    data-strike={strike}
                    data-nearest={strike === nearest}
                  >
                    <th>{amount(strike)}{strike === nearest && <span className={s.priceMarker}>← Price</span>}</th>
                    {dates.map((d) => {
                      const c = byKey.get(`${strike}|${d}`),
                        v = c ? value(c) : null;
                      return (
                        <td key={d}>
                          <button
                            type="button"
                            disabled={!c}
                            data-sign={
                              v === null
                                ? "missing"
                                : v < 0
                                  ? "negative"
                                  : v > 0
                                    ? "positive"
                                    : "zero"
                            }
                            style={{
                              backgroundColor:
                                v === null || v === 0
                                  ? undefined
                                  : `color-mix(in srgb, ${v > 0 ? "var(--green)" : "var(--red)"} ${18 + (62 * Math.abs(v)) / max}%, var(--card))`,
                            }}
                            aria-pressed={selected === c?.key}
                            aria-label={`${strike} strike, ${d}, ${v === null ? "not measured" : v.toLocaleString()}${c?.key === largest?.key ? ", largest visible exposure" : ""}`}
                            onClick={() => setSelected(c!.key)}
                          >
                            {c?.key === largest?.key && <Star size={12} />}{" "}
                            {v === null
                              ? "—"
                              : normalized
                                ? `${((100 * v) / max).toFixed(1)}%`
                                : metric === "gex"
                                  ? amount(v, "USD", true)
                                  : v.toLocaleString()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {!eligible.length && (
              <p>
                No measured rows match these controls. Lower the threshold or
                load another expiration.
              </p>
            )}
          </div>
          <div className={s.status}>
            <span>
              <Activity size={14} />{" "}
              {externalSnapshot
                ? "Verified account checkpoint"
                : chosen
                  ? "Saved device snapshot"
                  : "Latest loaded snapshot"}{" "}
              ·{" "}
              {complete && !chosen
                ? "Returned chain"
                : "Coverage limited to loaded contracts"}
            </span>
            <span>
              {board.contracts} contracts · {measured.length}/{cells.length}{" "}
              visible cells measured
            </span>
          </div>
          {focus && (
            <aside className={s.detail} aria-live="polite">
              <h4>
                {amount(focus.strike)} · {dateLabel(focus.expiry)}
              </h4>
              <p>
                Estimated GEX{" "}
                <b>
                  {focus.gex === null
                    ? "Not measured"
                    : amount(focus.gex, "USD", true)}
                </b>{" "}
                · Open interest{" "}
                <b>
                  {focus.oi === null
                    ? "Not supplied"
                    : focus.oi.toLocaleString()}
                </b>
              </p>
              <p>
                {(focus.coverage * 100).toFixed(0)}% usable gamma/OI inputs
                across {focus.count} returned contracts. Source:{" "}
                {focus.observed
                  ? dateLabel(focus.observed)
                  : "Mixed observation dates; no combined value"}
                .
              </p>
              {onCreateAlert && (
                <div className={s.actions}>
                  <button
                    type="button"
                    onClick={() => onCreateAlert(focus, "exposure-approach")}
                  >
                    Alert near this strike
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateAlert(focus, "exposure-cross")}
                  >
                    Alert on crossing
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateAlert(focus, "exposure-change")}
                  >
                    Track exposure change · 20%
                  </button>
                </div>
              )}
              <button type="button" onClick={() => setSelected(null)}>
                Close details
              </button>
            </aside>
          )}
        </>
      )}
      {mode === "changes" && (
        <section className={s.detail}>
          <h4>What changed in saved observations?</h4>
          {comparison.baseline && (
            <p>
              Compared with device snapshot saved{" "}
              {new Date(comparison.baseline.savedAt).toLocaleString()}.
            </p>
          )}
          {changes.length ? (
            <ul>
              {changes.slice(0, 10).map((c) => (
                <li key={c.key}>
                  {c.change < 0 ? (
                    <ArrowDown size={15} />
                  ) : (
                    <ArrowUp size={15} />
                  )}{" "}
                  {amount(c.strike)} · {c.expiry}:{" "}
                  {amount(c.change, "USD", true)} change
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No comparable updates yet. Save a newer source observation with
              the same contracts and price to compare.
            </p>
          )}
        </section>
      )}
      {mode === "symbols" && (
        <section className={s.comparison}>
          <h4>Saved symbols</h4>
          <p className={s.comparisonNote}>
            Up to six independently dated device snapshots.
          </p>
          {latestSymbolSnapshots(saved.snapshots).map((x) => {
            const node = [...x.board.cells]
              .filter((c) => c.gex !== null)
              .sort((a, b) => Math.abs(b.gex!) - Math.abs(a.gex!))[0];
            return (
              <article key={x.symbol}>
                <h4>{x.symbol}</h4>
                <strong>Underlying {amount(x.board.spot)}</strong>
                <p>
                  Largest recorded concentration{" "}
                  {node ? amount(node.strike) : "Not measured"}
                </p>
                <small>
                  Saved {new Date(x.savedAt).toLocaleString()} · source{" "}
                  {node?.observed ? dateLabel(node.observed) : "not measured"}
                </small>
                <small>{x.board.contracts} returned contracts</small>
              </article>
            );
          })}
          {!saved.snapshots.length && (
            <p className={s.comparisonNote}>
              Save a snapshot from a company’s map to start a comparison.
            </p>
          )}
        </section>
      )}
      {mode === "compare" && (
        <section className={s.comparison}>
          <h4>Saved observations · {symbol}</h4>
          {snapshots.length ? (
            snapshots.map((x) => (
              <article key={x.id}>
                <strong>{dateLabel(x.savedAt)}</strong>
                <p>
                  Underlying {amount(x.board.spot)} · {x.board.contracts}{" "}
                  contracts
                </p>
                <small>
                  Saved {new Date(x.savedAt).toLocaleTimeString()} on this
                  device
                </small>
                <button
                  type="button"
                  disabled={!!externalSnapshot}
                  onClick={() => {
                    setSnapshot(x.id);
                    setMode("map");
                  }}
                >
                  Inspect snapshot
                </button>
                <button
                  type="button"
                  aria-label={`Delete snapshot saved ${x.savedAt}`}
                  onClick={() => {
                    if (
                      persist({
                        ...saved,
                        snapshots: saved.snapshots.filter((y) => y.id !== x.id),
                      })
                    ) {
                      if (snapshot === x.id) setSnapshot("");
                      setMessage("Device snapshot removed.");
                    }
                  }}
                >
                  <Trash2 size={14} /> Remove
                </button>
              </article>
            ))
          ) : (
            <p>Save a loaded snapshot to compare observations here.</p>
          )}
        </section>
      )}
      <details className={s.saved}>
        <summary>
          <SlidersHorizontal size={16} /> Saved views & history
        </summary>
        <div className={s.toolbar}>
          <label>
            Saved view
            <select
              defaultValue=""
              onChange={(e) => applyPreset(e.target.value)}
            >
              <option value="">Choose a view</option>
              {saved.presets.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
          <label>
            View name
            <input
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="For example: nearest expirations"
            />
          </label>
          <button type="button" onClick={savePreset}>
            Save this view
          </button>
          <label>
            Observation
            <select
              value={snapshot}
              disabled={!!externalSnapshot}
              onChange={(e) => {
                setSnapshot(e.target.value);
                setSelected(null);
              }}
            >
              <option value="">Latest loaded snapshot</option>
              {snapshots.map((x) => (
                <option key={x.id} value={x.id}>
                  Saved {new Date(x.savedAt).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p>
          Keyboard while the board is focused: F centers price; L inspects the
          largest cell; S saves a snapshot; Escape closes details. Up to ten
          views and twelve snapshots per device across all symbols. Export
          important observations before clearing browser storage.
        </p>
        {accountTools}
      </details>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
