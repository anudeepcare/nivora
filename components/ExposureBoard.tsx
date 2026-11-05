"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
  onContracts,
  externalSnapshot,
  onExitReplay,
  accountPresets,
  onPresetsChanged,
  onCreateAlert,
}: {
  contracts: OptionContract[];
  spot: number;
  symbol: string;
  complete: boolean;
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
    [range, setRange] = useState(24),
    [expirations, setExpirations] = useState(6),
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
  const dates = [...new Set(board.cells.map((c) => c.expiry))]
    .sort()
    .slice(0, expirations);
  const strikes = [
    ...new Set(
      board.cells.filter((c) => dates.includes(c.expiry)).map((c) => c.strike),
    ),
  ]
    .sort((a, b) => Math.abs(a - board.spot) - Math.abs(b - board.spot))
    .slice(0, range)
    .sort((a, b) => b - a);
  const cells = board.cells.filter(
    (c) => dates.includes(c.expiry) && strikes.includes(c.strike),
  );
  const value = (c: ExposureCell) => (metric === "gex" ? c.gex : c.oi);
  const measured = cells.filter((c) => value(c) !== null);
  const largest = [...measured].sort(
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
  const above = [...measured]
    .filter((c) => c.strike > board.spot)
    .sort((a, b) => Math.abs(value(b)!) - Math.abs(value(a)!))[0];
  const below = [...measured]
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
          <span className="eyebrow">STRIKE × EXPIRATION</span>
          <h3>
            <Layers3 size={21} /> Exposure workspace
          </h3>
          <p>
            Find concentrations. Inspect the inputs. Keep price direction
            separate.
          </p>
        </div>
        <Help label="How to read the exposure map">
          <p>
            Rows are strikes; columns are expirations. Larger absolute values
            mean more estimated exposure in the returned contracts. The star
            marks the largest visible cell.
          </p>
          <p>
            GEX uses gamma × open interest × contract multiplier × stock price
            squared × 0.01. Calls are positive and puts negative by convention;
            these are not observed dealer positions. Positive does not mean
            bullish and negative does not mean bearish.
          </p>
          <p>
            Blank cells are unmeasured, not zero. Coverage describes usable
            returned inputs, not the fraction of the entire market. Different
            cells can have different observation dates. Saved snapshots and
            views saved with these device controls stay on this browser. Use
            Account history & replay above for cross-device storage.
          </p>
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
      <div className={s.toolbar}>
        <label>
          Measure
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as "gex" | "oi")}
          >
            <option value="gex">Estimated GEX</option>
            <option value="oi">Open interest</option>
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
          Expirations
          <select
            value={expirations}
            onChange={(e) => setExpirations(Number(e.target.value))}
          >
            {[1, 3, 6, 12].map((n) => (
              <option key={n}>{n}</option>
            ))}
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
      </div>
      <div className={s.actions}>
        <button type="button" onClick={() => center(nearest)}>
          <Focus size={16} /> Center on price
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
          <Star size={16} /> Largest cell
        </button>
        <button
          type="button"
          onClick={saveSnapshot}
          disabled={!live.cells.length}
        >
          <Camera size={16} /> Save snapshot
        </button>
        <button type="button" onClick={exportBoard} disabled={!cells.length}>
          <Download size={16} /> Export values
        </button>
        {onContracts && (
          <button type="button" onClick={onContracts}>
            Explore contracts →
          </button>
        )}
      </div>
      <div className={s.summary}>
        {[
          ["Largest visible", largest],
          ["Below price", below],
          ["Above price", above],
        ].map(([label, c]) => {
          const cell = c as ExposureCell | undefined;
          return (
            <article key={String(label)}>
              <span>{String(label)}</span>
              <strong>{cell ? amount(cell.strike) : "Not measured"}</strong>
              <small>
                {cell
                  ? `${cell.expiry} · ${metric === "gex" ? amount(cell.gex, "USD", true) : cell.oi?.toLocaleString() + " contracts"}`
                  : "Required inputs not supplied"}
              </small>
            </article>
          );
        })}
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
          {board.contracts} contracts · {measured.length}/{cells.length} visible
          cells measured
        </span>
      </div>
      {mode === "map" && (
        <>
          <div className={s.legend}>
            <span>− Put-negative estimate</span>
            <i />
            <span>+ Call-positive estimate</span>
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
                    <th>{amount(strike)}</th>
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
                              opacity:
                                v === null
                                  ? 1
                                  : 0.45 + (0.55 * Math.abs(v)) / max,
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
              No comparable source updates yet. Comparison requires the same
              contract universe and underlying price, and a newer source
              observation. Saving the same snapshot twice does not create market
              velocity.
            </p>
          )}
          <p>
            Device snapshots are manual checkpoints. Minute-by-minute movers and
            session replay require a historical options feed.
          </p>
        </section>
      )}
      {mode === "symbols" && (
        <section className={s.comparison}>
          <h4>Compare saved symbols · device checkpoints</h4>
          <p>
            Up to six symbols from your saved observations. These are
            independently dated snapshots, not synchronized live markets.
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
            <p>
              Save snapshots on two or more companies to compare their recorded
              concentrations here.
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
          <SlidersHorizontal size={16} /> Saved views & observations
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
      </details>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
