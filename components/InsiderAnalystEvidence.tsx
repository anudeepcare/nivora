"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { Evidence, EvidenceKind } from "@/lib/insider-analyst-evidence";
import s from "./OptionsMarketOverview.module.css";
type Result = Evidence & { source: string; retrievedAt: string };
export default function InsiderAnalystEvidence({
  symbol,
  kind,
}: {
  symbol: string;
  kind: EvidenceKind;
}) {
  const [opened, setOpened] = useState(false);
  const resource = useResource<Result>(
    opened
      ? `research-evidence/${encodeURIComponent(symbol)}?kind=${kind}`
      : null,
    undefined,
    300000,
  );
  const data = resource.data;
  const number = (v: number | null) =>
    v === null
      ? "Not supplied"
      : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return (
    <section
      className={s.screener}
      aria-label={
        kind === "clusters"
          ? "Insider purchase clusters"
          : "Revisions before recorded moves"
      }
    >
      <h3>
        {kind === "clusters"
          ? "Insider purchase clusters"
          : "Revisions before recorded moves"}
      </h3>
      <p>
        {kind === "clusters"
          ? "Reported purchases by at least three distinct insiders in a 90-day lookback. Delayed disclosures, not proof of future returns."
          : "Selected historical large moves and firms that revised targets beforehand. This is not an analyst accuracy score, win rate or complete track record."}
      </p>
      {!opened ? (
        <button className="button" onClick={() => setOpened(true)}>
          Load {kind === "clusters" ? "cluster evidence" : "revision evidence"}
        </button>
      ) : resource.loading ? (
        <p role="status">Loading reported evidence…</p>
      ) : resource.error ? (
        <p role="status">{resource.error}</p>
      ) : data ? (
        <>
          {data.isPreview && (
            <p role="status">
              Limited provider preview. Omitted records do not establish absence
              of activity.
            </p>
          )}
          {data.sampleCompany && (
            <p>
              Provider sample-company response; this does not establish
              paid-plan access.
            </p>
          )}
          {kind === "clusters" ? (
            <>
              {!data.clusters.length ? (
                <p>
                  {data.isPreview
                    ? "This stock was not in the returned preview. Full cluster coverage is unknown."
                    : "No cluster for this stock was returned in the provider’s 90-day window."}
                </p>
              ) : (
                data.clusters.map((row, i) => (
                  <div key={i}>
                    <p>
                      {row.insiderCount} insiders · {row.tradeCount} reported
                      purchases · {number(row.totalShares)} shares · $
                      {number(row.totalValue)} USD
                    </p>
                    <p>
                      Purchase dates: {row.firstBuyDate} through{" "}
                      {row.lastBuyDate}. Filing availability can lag these
                      dates.
                    </p>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <p>
                {data.moves.length} moves returned
                {data.totalCount !== null
                  ? ` of ${data.totalCount} available before limit/preview`
                  : "; total coverage not supplied"}
                .
              </p>
              {!data.moves.length && (
                <p>
                  No qualifying recorded moves returned. This does not mean the
                  stock had no analyst coverage.
                </p>
              )}
              {data.moves.map((move, i) => (
                <section key={i}>
                  <h4>
                    {move.moveStartDate} → {move.moveEndDate} ·{" "}
                    {number(move.movePct)}% observed price change
                  </h4>
                  <p>
                    Firms: {move.revisedWithMove} revised with the move ·{" "}
                    {move.revisedAgainstMove} against · {move.leftUnchanged}{" "}
                    unchanged · {move.coveringFirms} covered.
                  </p>
                  <div
                    className={s.tableScroll}
                    role="region"
                    tabIndex={0}
                    aria-label="Published target revisions"
                  >
                    <table className={s.table}>
                      <thead>
                        <tr>
                          <th>Attribution</th>
                          <th>Published</th>
                          <th>Prior target</th>
                          <th>Revised target</th>
                          <th>Days before move</th>
                        </tr>
                      </thead>
                      <tbody>
                        {move.calls.map((call, j) => (
                          <tr key={j}>
                            <th>
                              {call.attribution === "analyst"
                                ? `${call.analystName} · ${call.firm}`
                                : call.firm}
                            </th>
                            <td>{call.publishedOn}</td>
                            <td>{number(call.priorPriceTarget)}</td>
                            <td>{number(call.priceTarget)}</td>
                            <td>{call.daysBeforeMove}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Only same-direction calls are listed; other firms remain
                    counted above. Targets are as published; quote currency and
                    split-comparable basis are not supplied here. Do not
                    interpret target differences as realized returns.
                  </p>
                </section>
              ))}
            </>
          )}
          <p>
            Source: {data.source} · retrieved {data.retrievedAt}. Retrieval is
            not the transaction or publication time.
          </p>
        </>
      ) : null}
    </section>
  );
}
