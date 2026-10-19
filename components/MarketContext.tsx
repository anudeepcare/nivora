"use client";
import { useMemo, useState } from "react";
import type { Research, Candle } from "@/lib/types";
import { benchmarkContext, type PeerCandidate } from "@/lib/market-context";
import { percent, dateLabel } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import ResearchCompare from "./ResearchCompare";
export default function MarketContext({ research: r }: { research: Research }) {
  const { demo } = useProduct(),
    crypto = r.company.assetType === "crypto",
    defaultBenchmark = crypto
      ? r.company.symbol === "BTC/USD"
        ? "ETH/USD"
        : "BTC/USD"
      : "SPY";
  const sectorKey = (r.evidence?.profile.sector || r.company.sector || "")
      .replace(/[^a-z]/gi, "")
      .toLowerCase(),
    sectorBenchmark: Record<string, string> = {
      technology: "XLK",
      financialservices: "XLF",
      healthcare: "XLV",
      consumercyclical: "XLY",
      consumerdefensive: "XLP",
      energy: "XLE",
      industrials: "XLI",
      basicmaterials: "XLB",
      utilities: "XLU",
      realestate: "XLRE",
      communicationservices: "XLC",
    },
    sector = sectorBenchmark[sectorKey];
  const [benchmark, setBenchmark] = useState(defaultBenchmark),
    [active, setActive] = useState(""),
    [peersEnabled, setPeersEnabled] = useState(false);
  const path = encodeURIComponent(r.company.symbol.replace("/", "-")),
    series = useResource<{ candles: Candle[] }>(
      !demo && active
        ? `chart/${encodeURIComponent(active.replace("/", "-"))}?range=5Y`
        : null,
      undefined,
      900000,
    ),
    peers = useResource<{
      candidates: PeerCandidate[];
      classification: string;
      field: string;
      method: string;
      observedAt: string;
    }>(
      !demo && peersEnabled ? `research-context/${path}?kind=peers` : null,
      undefined,
      86400000,
    ),
    context = useMemo(
      () =>
        series.data
          ? benchmarkContext(r.history, series.data.candles, r.retrievedAt)
          : null,
      [r, series.data],
    );
  const line = context?.line ?? [],
    rebased = line.length
      ? line.map((p) => ({
          ...p,
          value: (p.relative / line[0].relative) * 100,
        }))
      : [],
    lo = rebased.length ? Math.min(100, ...rebased.map((p) => p.value)) : 0,
    hi = rebased.length ? Math.max(100, ...rebased.map((p) => p.value)) : 1,
    spread = hi - lo || 1;
  return (
    <section className="market-context">
      <header>
        <span className="eyebrow">RELATIVE MARKET CONTEXT</span>
        <h3>Market & peer context</h3>
        <p>Separate company performance from the broader market.</p>
        <details className="context-method">
          <summary>Method & coverage</summary>
          <p>
            Benchmark histories reuse the cache. Requested peer discovery is
            cached for a day; uncached requests use the existing data allowance.
            Classification alone does not establish a true competitor.
          </p>
        </details>
      </header>
      <section className="benchmark-panel">
        <div className="market-context-actions">
          <label>
            Comparison benchmark
            <select
              value={benchmark}
              onChange={(e) => {
                setBenchmark(e.target.value);
                setActive("");
              }}
            >
              {(crypto
                ? ["BTC/USD", "ETH/USD"]
                : [
                    "SPY",
                    "QQQ",
                    "IWM",
                    "XLK",
                    "XLF",
                    "XLV",
                    "XLY",
                    "XLP",
                    "XLE",
                    "XLI",
                    "XLB",
                    "XLU",
                    "XLRE",
                    "XLC",
                  ]
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button
            className="button"
            disabled={series.loading || !!demo || r.quote.currency !== "USD"}
            onClick={() =>
              active === benchmark ? series.refresh() : setActive(benchmark)
            }
          >
            {series.loading ? "Loading…" : "Compare benchmark"}
          </button>
          {!crypto && sector && (
            <button
              className="button"
              disabled={series.loading || !!demo || r.quote.currency !== "USD"}
              onClick={() => {
                setBenchmark(sector);
                active === sector ? series.refresh() : setActive(sector);
              }}
            >
              Use sector ETF · {sector}
            </button>
          )}
        </div>
        {demo && (
          <p className="context-note">
            Live comparison requests are disabled in the design preview.
          </p>
        )}
        {r.quote.currency !== "USD" && (
          <p className="context-note">
            This comparison currently supports USD-quoted instruments; no
            FX-adjusted performance is inferred.
          </p>
        )}
        {series.error && <p role="status">{series.error}</p>}
        {context && (
          <>
            <p className="small muted">
              {context.matched} shared observations · through{" "}
              {dateLabel(context.asOf)} ·{" "}
              {context.stale
                ? "Historical alignment is too old for current statistics"
                : "Price returns, excluding dividends and fees; corporate-action normalization is not independently audited."}
            </p>
            <div className="benchmark-metrics">
              {[
                ["60-observation beta", context.beta60],
                ["60-observation correlation", context.correlation60],
                ["252-observation beta", context.beta252],
                ["252-observation correlation", context.correlation252],
              ].map(([label, v]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <strong>
                    {v == null ? "Not established" : Number(v).toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="table-scroll">
              <table>
                <caption>
                  Performance on matched observation dates versus {active}
                </caption>
                <thead>
                  <tr>
                    <th>Observations</th>
                    <th>{r.company.symbol}</th>
                    <th>{active}</th>
                    <th>Excess · pp</th>
                  </tr>
                </thead>
                <tbody>
                  {context.horizons.map((h) => (
                    <tr key={h.sessions}>
                      <td>{h.sessions}</td>
                      <td>{percent(h.stock)}</td>
                      <td>{percent(h.benchmark)}</td>
                      <td>
                        {h.excess == null
                          ? "Not established"
                          : h.excess.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rebased.length > 1 && !context.stale && (
              <figure className="relative-line">
                <figcaption>
                  Relative-price ratio · first shared date = 100
                </figcaption>
                <svg
                  viewBox="0 0 720 180"
                  role="img"
                  aria-label={`Ratio of ${r.company.symbol} price to ${active}, rebased to 100. Last ${rebased.at(-1)!.value.toFixed(2)}.`}
                >
                  <line
                    x1="20"
                    x2="700"
                    y1={150 - ((100 - lo) / spread) * 120}
                    y2={150 - ((100 - lo) / spread) * 120}
                    stroke="var(--line)"
                    strokeDasharray="4 4"
                  />
                  <polyline
                    points={rebased
                      .map(
                        (p, i) =>
                          `${20 + (i / (rebased.length - 1)) * 680},${150 - ((p.value - lo) / spread) * 120}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="var(--blue)"
                    strokeWidth="3"
                  />
                  <text x="20" y="175" fill="var(--muted)" fontSize="12">
                    {line[0]?.time}
                  </text>
                  <text
                    x="700"
                    y="175"
                    textAnchor="end"
                    fill="var(--muted)"
                    fontSize="12"
                  >
                    {line.at(-1)?.time}
                  </text>
                </svg>
              </figure>
            )}
            <details>
              <summary>How to read beta and correlation</summary>
              <p>
                Beta is covariance of the instrument's simple returns with
                benchmark returns divided by benchmark variance. Correlation
                standardizes that covariance. Matched closes create identical
                intervals for both series; missing dates can create multi-day
                intervals. At least 61/253 shared closes are required. R² over
                60 observations is {percent(context.rSquared60)}; it is
                regression association, not a causal market/stock attribution.
                Sparse observations and corporate actions can distort results.
              </p>
            </details>
          </>
        )}
      </section>
      {!crypto && (
        <details className="advanced-peer-panel">
          <summary>Explore peer evidence</summary>
          <section className="automatic-peers">
            <h4>Find relevant peers</h4>
            <p>
              Discover same-industry candidates, then choose which companies to
              compare. Classification and market-cap size do not establish true
              competitors.
            </p>
            <button
              className="button"
              disabled={peers.loading || !!demo}
              onClick={() =>
                peersEnabled ? peers.refresh() : setPeersEnabled(true)
              }
            >
              {peers.loading ? "Finding candidates…" : "Discover peers"}
            </button>
            {peers.error && (
              <p role="status">
                {peers.error} Manual comparisons remain available below.
              </p>
            )}
            {peers.data && (
              <>
                <p className="small muted">
                  {peers.data.classification} ·{" "}
                  {dateLabel(peers.data.observedAt)}. {peers.data.method}
                </p>
                {!peers.data.candidates.length && (
                  <p>No eligible candidates were supplied.</p>
                )}
              </>
            )}
            <ResearchCompare
              research={r}
              suggestions={peers.data?.candidates ?? []}
            />
          </section>
        </details>
      )}
    </section>
  );
}
