"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import s from "./OptionsAggregatePanel.module.css";
type Snapshot = { asOf: string; metrics: Record<string, number | null> };
type Response = {
  status: string;
  message?: string;
  snapshot?: Snapshot | null;
};
const groups = [
  {
    title: "Trading activity",
    items: [
      ["Call volume", "callVol", "number"],
      ["Put volume", "putVol", "number"],
      ["Put / call volume", "pcVol", "ratio"],
      ["Contracts", "contracts", "number"],
    ],
  },
  {
    title: "Open positions",
    items: [
      ["Call open interest", "callOi", "number"],
      ["Put open interest", "putOi", "number"],
      ["Put / call open interest", "pcOi", "ratio"],
      ["Net delta", "netDelta", "number"],
    ],
  },
  {
    title: "Volatility & expected moves",
    items: [
      ["At-the-money IV", "atmIv", "percent"],
      ["60-day IV", "atmIv60", "percent"],
      ["1-day expected move", "expectedMove1d", "percent"],
      ["20-day expected move", "expectedMove20d", "percent"],
    ],
  },
];
export function OptionsAggregateView({
  symbol,
  result,
}: {
  symbol: string;
  result: Response | null;
}) {
  const snapshot = result?.snapshot;
  return (
    <section className={s.panel} aria-label={`${symbol} options snapshot`}>
      <header className={s.header}>
        <div>
          <span>OPTIONS · END-OF-DAY SNAPSHOT</span>
          <h2>The market around {symbol}.</h2>
          <p>Activity, positioning and implied volatility in one view.</p>
        </div>
        {snapshot?.asOf && (
          <time dateTime={snapshot.asOf}>{snapshot.asOf.slice(0, 10)}</time>
        )}
      </header>
      {!result ? (
        <p role="status">Loading options snapshot…</p>
      ) : !snapshot ? (
        <p role="status">
          {result.message ||
            "No options snapshot is available for this company."}
        </p>
      ) : (
        <div className={s.groups}>
          {groups.map((group) => (
            <section className={s.group} key={group.title}>
              <h3>{group.title}</h3>
              <dl>
                {group.items.map(([label, key, kind]) => {
                  const value = snapshot.metrics[key];
                  const display =
                    typeof value !== "number" || !Number.isFinite(value)
                      ? "Not available"
                      : kind === "percent"
                        ? `${(value * 100).toFixed(1)}%`
                        : value.toLocaleString("en-US", {
                            maximumFractionDigits: kind === "ratio" ? 2 : 0,
                          });
                  return (
                    <div key={key}>
                      <dt>{label}</dt>
                      <dd>{display}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
      )}
      <p className={s.note}>
        A dated aggregate, not a live contract chain or trade tape. Volume alone
        does not establish buying direction. Expected moves are implied
        estimates, not forecasts.
      </p>
    </section>
  );
}
export default function OptionsAggregatePanel({ symbol }: { symbol: string }) {
  const [state, setState] = useState<{
    symbol: string;
    result: Response;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    api<Response>(`options/${encodeURIComponent(symbol)}/summary`)
      .then((result) => {
        if (active) setState({ symbol, result });
      })
      .catch(() => {
        if (active)
          setState({
            symbol,
            result: {
              status: "error",
              message: "The options snapshot could not load. Try again.",
            },
          });
      });
    return () => {
      active = false;
    };
  }, [symbol, attempt]);
  const result = state?.symbol === symbol ? state.result : null;
  return (
    <>
      <OptionsAggregateView symbol={symbol} result={result} />
      {result?.status === "error" && (
        <button
          type="button"
          onClick={() => {
            setState(null);
            setAttempt((n) => n + 1);
          }}
        >
          Retry snapshot
        </button>
      )}
    </>
  );
}
