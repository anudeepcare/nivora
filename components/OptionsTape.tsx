"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/client";
import { rankFlowPremium, type FlowReply } from "@/lib/options-flow";
import styles from "./OptionsTape.module.css";
const money = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
const timestamp = (s?: string) =>
  s ? new Date(s).toLocaleString() : "Unavailable";
export default function OptionsTape({
  symbol,
  expiry,
  disabled = false,
}: {
  symbol: string;
  expiry?: string;
  disabled?: boolean;
}) {
  const scope = `${symbol}:${expiry ?? ""}`;
  const [reply, setReply] = useState<FlowReply | null>(null),
    [error, setError] = useState(""),
    [active, setActive] = useState<string | null>(null),
    [poll, setPoll] = useState(false),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(true),
    [tick, setTick] = useState(0);
  const [type, setType] = useState("all"),
    [filter, setFilter] = useState(""),
    [minimum, setMinimum] = useState(""),
    [sort, setSort] = useState("time");
  const inFlight = useRef(false);
  useEffect(() => {
    const change = () => setVisible(document.visibilityState !== "hidden");
    change();
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  useEffect(() => {
    setActive(null);
    setPoll(false);
    setReply(null);
    setError("");
    setType("all");
    setFilter("");
    setMinimum("");
  }, [symbol, expiry, disabled]);
  useEffect(() => {
    if (active !== scope || disabled || !visible) return;
    const controller = new AbortController();
    let current = true;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const query = new URLSearchParams(expiry ? { expiry } : {});
    api<FlowReply>(
      `options/${encodeURIComponent(symbol)}/flow${query.size ? `?${query}` : ""}`,
      undefined,
      controller.signal,
    )
      .then((value) => {
        if (current) {
          setReply(value);
          if (value.status !== "available") setPoll(false);
        }
      })
      .catch((e) => {
        if (current && !controller.signal.aborted) {
          setError(
            e instanceof Error ? e.message : "Options trades are unavailable.",
          );
          setPoll(false);
        }
      })
      .finally(() => {
        if (current) {
          inFlight.current = false;
          setBusy(false);
        }
      });
    return () => {
      current = false;
      controller.abort();
      inFlight.current = false;
      setBusy(false);
    };
  }, [active, disabled, visible, tick, symbol, expiry, scope]);
  useEffect(() => {
    if (!poll || active !== scope || disabled || !visible) return;
    const timer = setInterval(() => {
      if (!inFlight.current) setTick((n) => n + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, [poll, active, disabled, visible, scope]);
  const trades = useMemo(() => {
    const min = Number(minimum) || 0;
    return (reply?.trades ?? [])
      .filter(
        (t) =>
          (type === "all" || t.type === type) &&
          t.contract.toLowerCase().includes(filter.toLowerCase()) &&
          t.premium >= min,
      )
      .sort((a, b) =>
        sort === "premium"
          ? b.premium - a.premium
          : sort === "size"
            ? b.size - a.size
            : Date.parse(b.time) - Date.parse(a.time),
      );
  }, [reply, type, filter, minimum, sort]);
  const ranking = useMemo(
    () => rankFlowPremium(reply?.trades ?? []).slice(0, 5),
    [reply],
  );
  const state = disabled
    ? "Disabled"
    : !visible && active
      ? "Paused while tab is hidden"
      : busy
        ? "Loading source"
        : error
          ? "Connection error"
          : reply?.status === "unavailable"
            ? "Not enabled"
            : reply
              ? "Connected · historical sample"
              : active
                ? "Paused"
                : "Ready to load";
  return (
    <section className={styles.tape} aria-label="Options trade tape">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Source trade prints</span>
          <h3>Options trade tape</h3>
          <p>
            Selected contracts for {symbol}
            {expiry ? ` · ${expiry}` : ""}. Historical prints with
            subscription-dependent delay.
          </p>
        </div>
        <span className={styles.status} role="status">
          {state}
        </span>
      </header>
      <div className={styles.controls}>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => {
            setActive(scope);
            setTick((n) => n + 1);
          }}
        >
          {busy ? "Loading…" : reply ? "Refresh trades" : "Load trades"}
        </button>
        <label>
          <input
            type="checkbox"
            checked={poll}
            disabled={
              disabled || !active || reply?.status !== "available" || !!error
            }
            onChange={(e) => setPoll(e.target.checked)}
          />{" "}
          Refresh every 15 seconds
        </label>
      </div>
      {disabled ? (
        <p>Trade tape is unavailable for this selection.</p>
      ) : error ? (
        <p className={styles.error} role="alert">
          {error}
          {reply ? " The last successful sample remains below." : ""}
        </p>
      ) : reply?.message ? (
        <p>{reply.message}</p>
      ) : !active ? (
        <p>
          Load a bounded trade sample for up to 30 standard contracts, selected
          by the largest available open interest in this chain.
        </p>
      ) : null}
      {reply?.status === "available" && (
        <>
          <div className={styles.notes}>
            <p>{reply.source}</p>
            <p>
              Source fetched: {timestamp(reply.fetchedAt)} · Latest returned
              print: {timestamp(reply.trades[0]?.time)} · Window starts:{" "}
              {timestamp(reply.start)}
            </p>
            <p>
              {reply.contracts.length} contracts requested ·{" "}
              {reply.trades.length} valid prints returned · One page, at most
              500 prints.{" "}
              {reply.partial
                ? "Partial page coverage: more provider results were available."
                : "No next page reported for the selected scope."}{" "}
              {reply.chainComplete === false
                ? "The contract chain itself is incomplete."
                : ""}
            </p>
            <p>
              Provider results sort by contract first, then time. Busy contracts
              can consume the page before others appear. This sample does not
              measure total market activity or infer buyer/seller intent,
              opening positions, or linked orders.
            </p>
          </div>
          <details className={styles.scope}>
            <summary>
              Requested contract scope ({reply.contracts.length})
            </summary>
            <p>{reply.contracts.join(", ")}</p>
          </details>
          <div className={styles.filters}>
            <label>
              Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">Calls and puts</option>
                <option value="call">Calls</option>
                <option value="put">Puts</option>
              </select>
            </label>
            <label>
              Contract
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter contract ID"
              />
            </label>
            <label>
              Minimum premium ($)
              <input
                type="number"
                min="0"
                value={minimum}
                onChange={(e) => setMinimum(e.target.value)}
              />
            </label>
            <label>
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="time">Print time · newest</option>
                <option value="premium">Premium · largest</option>
                <option value="size">Size · largest</option>
              </select>
            </label>
          </div>
          <div
            className={styles.scroll}
            tabIndex={0}
            role="region"
            aria-label="Options trade prints table"
          >
            <table>
              <thead>
                <tr>
                  {[
                    "Print time",
                    "Contract",
                    "Type",
                    "Strike",
                    "Expiry",
                    "Trade price",
                    "Size",
                    "Premium",
                    "Exchange",
                    "Raw condition",
                  ].map((s) => (
                    <th key={s} scope="col">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id}>
                    <td>{timestamp(t.time)}</td>
                    <td>{t.contract}</td>
                    <td>{t.type}</td>
                    <td>{money(t.strike)}</td>
                    <td>{t.expiry}</td>
                    <td>{money(t.price)}</td>
                    <td>{t.size.toLocaleString()}</td>
                    <td>{money(t.premium)}</td>
                    <td>{t.exchange}</td>
                    <td>{t.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!trades.length && (
            <p>
              {reply.trades.length
                ? "No returned prints match these filters."
                : "No valid prints were returned for this contract scope and time window."}
            </p>
          )}
          {ranking.length > 0 && (
            <div className={styles.ranking}>
              <h4>Contract premium in returned sample</h4>
              <p>
                Price × contracts × 100 shares; both calls and puts represent
                traded notional. Ranking uses all returned prints before display
                filters.
              </p>
              <ol>
                {ranking.map((r) => (
                  <li key={r.contract}>
                    <span>{r.contract}</span>
                    <strong>{money(r.premium)}</strong>
                    <span>
                      {r.prints} prints · {r.size.toLocaleString()} contracts
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </section>
  );
}
