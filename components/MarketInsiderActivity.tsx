"use client";
import { useState } from "react";
import Link from "next/link";
import { useResource } from "./Session";
import type { MarketInsider } from "@/lib/market-insider";
import s from "./GlobalEarningsCalendar.module.css";
export default function MarketInsiderActivity() {
  const [days, setDays] = useState(90);
  return (
    <section className={s.root} aria-label="Market insider activity">
      <header>
        <h2>Insider activity</h2>
        <p>
          Company-level Form 4 aggregates. These are not individual transactions
          or buy/sell recommendations.
        </p>
      </header>
      <div
        className="auryn-detail-tabs"
        role="group"
        aria-label="Insider lookback"
      >
        {[30, 90].map((n) => (
          <button key={n} aria-pressed={days === n} onClick={() => setDays(n)}>
            Past {n} days
          </button>
        ))}
      </div>
      <Activity key={days} days={days} />
    </section>
  );
}
function Activity({ days }: { days: number }) {
  const resource = useResource<MarketInsider>(
    `market-insider?days=${days}`,
    undefined,
    300000,
  );
  const [direction, setDirection] = useState<"buys" | "sells">("buys"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(0);
  const data = resource.data;
  const rows = (data?.[direction] ?? []).filter((r) =>
    `${r.ticker} ${r.companyName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const number = (x: number) =>
    x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (resource.loading) return <p role="status">Loading insider activity…</p>;
  if (resource.error)
    return (
      <div role="status">
        <p>{resource.error}</p>
        <div className={s.controls}>
          <button type="button" onClick={resource.refresh}>
            Retry insider activity
          </button>
        </div>
      </div>
    );
  if (!data) return <p role="status">Insider activity unavailable.</p>;
  return (
    <>
      <details>
        <summary>Source and coverage</summary>
        <p className={s.note}>
          SentiSense insider activity API. Full provider data requires PRO; free
          access is limited to a preview. These ranked company lists are not
          exhaustive SEC filing coverage.
        </p>
      </details>
      <p className={s.note}>
        Received {data.receivedAt} · Server cache: 15 minutes. This loaded view
        may be older; no provider update timestamp is supplied.
      </p>
      {data.isPreview && (
        <p className={s.notice}>
          Provider preview: up to five companies per direction. Full provider
          access requires an eligible provider plan; this does not establish
          your account entitlement.
        </p>
      )}
      <p className={s.note}>
        Selling totals exclude tax withholding (code F), but include
        dispositions to the issuer (code D). They are not a measure of
        discretionary open-market selling. No net-flow or market-wide total is
        inferred from these ranked lists.
      </p>
      <div
        className="auryn-detail-tabs"
        role="group"
        aria-label="Activity direction"
      >
        {(["buys", "sells"] as const).map((d) => (
          <button
            key={d}
            aria-pressed={direction === d}
            onClick={() => {
              setDirection(d);
              setPage(0);
            }}
          >
            {d === "buys" ? "Reported buying" : "Reported selling"}
          </button>
        ))}
      </div>
      <div className={s.filters}>
        <label>
          Company or ticker
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      {data.omitted > 0 && (
        <p role="status">
          {data.omitted} unsupported or out-of-window records withheld.
        </p>
      )}
      {rows.length === 0 ? (
        <p>
          No matching companies in this response. This does not prove no insider
          transactions occurred.
        </p>
      ) : (
        <>
          <div
            className={s.scroll}
            tabIndex={0}
            role="region"
            aria-label="Insider activity table"
          >
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Reported value (USD)</th>
                  <th>Shares</th>
                  <th>Insiders / trades</th>
                  <th>Latest transaction date</th>
                  <th>Latest insider / role</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(page * 25, (page + 1) * 25).map((r) => (
                  <tr key={r.ticker}>
                    <td>
                      <Link
                        href={`/research/${encodeURIComponent(r.ticker)}?tab=Ownership`}
                      >
                        {r.ticker}
                      </Link>
                      <br />
                      {r.companyName}
                    </td>
                    <td>{number(r.totalValue)}</td>
                    <td>{number(r.totalShares)}</td>
                    <td>
                      {r.insiderCount} / {r.tradeCount}
                    </td>
                    <td>{r.latestDate}</td>
                    <td>
                      {r.latestInsider || "Not supplied"}
                      <br />
                      {r.latestTitle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={s.controls}>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              {page * 25 + 1}–{Math.min(rows.length, (page + 1) * 25)} of{" "}
              {rows.length} returned companies
            </span>
            <button
              disabled={(page + 1) * 25 >= rows.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  );
}
