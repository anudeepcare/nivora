"use client";
import Link from "next/link";
import { useResource } from "./Session";
import type {
  EarningsAnalysis,
  EarningsAnalysisView,
  EarningsAnalysisRow,
} from "@/lib/earnings-analysis";
import s from "./EarningsAnalysisPanel.module.css";
const figure = (n: number | null) =>
  n === null
    ? "Not supplied"
    : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const percent = (n: number | null) =>
  n === null ? "Not publishable" : `${figure(n * 100)}%`;
function EarningsRows({
  rows,
  kind,
}: {
  rows: EarningsAnalysisRow[];
  kind: "recent" | "reported" | "upcoming";
}) {
  if (!rows.length)
    return <p role="status">No verified rows returned for this window.</p>;
  return (
    <div
      className={s.scroll}
      tabIndex={0}
      aria-label="Earnings evidence, scroll for more"
    >
      <table>
        <thead>
          <tr>
            <th>Company / report date</th>
            <th>
              {kind === "upcoming"
                ? "Schedule / consensus"
                : "Reported evidence"}
            </th>
            {kind !== "recent" && (
              <th>
                {kind === "upcoming" ? "Date status" : "Measured reaction"}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.ticker}:${r.date}:${r.period}`}>
              <td>
                <Link
                  href={`/research/${encodeURIComponent(r.ticker)}?tab=News`}
                >
                  {r.ticker}
                </Link>
                <time dateTime={r.date}>{r.date}</time>
                {r.period && <small>{r.period}</small>}
              </td>
              <td>
                {r.headline && <p>{r.headline}</p>}
                {kind === "recent" ? (
                  <small>
                    Provider editorial summary. Content updated{" "}
                    {r.generatedAt ?? "Not supplied"}.
                  </small>
                ) : kind === "upcoming" ? (
                  <>
                    Consensus EPS {figure(r.estimate)}
                    <small>{r.session.replaceAll("_", " ")}</small>
                  </>
                ) : (
                  <>
                    Reported EPS {figure(r.eps)} · Estimate {figure(r.estimate)}
                    <small>
                      {r.outcome}
                      {r.surprisePct !== null
                        ? ` · Surprise ${figure(r.surprisePct)}%`
                        : ""}
                    </small>
                  </>
                )}
              </td>
              {kind !== "recent" && (
                <td>
                  {kind === "upcoming" ? (
                    r.confirmed === true ? (
                      "Company confirmed"
                    ) : r.confirmed === false ? (
                      "Estimated date"
                    ) : (
                      "Confirmation not supplied"
                    )
                  ) : (
                    <>
                      {r.movePct !== null
                        ? `${figure(r.movePct)}%`
                        : "Not supplied"}
                      <small>{r.reactionKind}</small>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function EarningsAnalysisPanel({
  view,
}: {
  view: EarningsAnalysisView;
}) {
  const r = useResource<EarningsAnalysis>(
      `earnings-analysis?view=${view}`,
      undefined,
      300000,
    ),
    d = r.data;
  if (r.loading) return <p role="status">Loading earnings evidence…</p>;
  if (r.error || !d)
    return (
      <p role="alert">
        {r.error || "Earnings evidence unavailable."}{" "}
        <button className="btn" onClick={r.refresh}>
          Retry earnings view
        </button>
      </p>
    );
  return (
    <section className={s.panel} aria-label="Earnings analysis evidence">
      <p className={s.note}>
        {d.preview ? "Limited provider preview. " : ""}Covered-company evidence,
        not an exhaustive market census. Retrieved {d.retrievedAt}.
        {d.asOf ? ` Source computed ${d.asOf}.` : ""} This loaded view may be
        older than current source data.
        {d.omitted > 0
          ? ` ${d.omitted} invalid, duplicate or out-of-window rows withheld.`
          : ""}
      </p>
      {view === "recent" && (
        <>
          <h3>
            Recently reported · {d.windowStart} to {d.windowEnd}
          </h3>
          <p>
            Up to 25 returned quarters from the last seven days. Newest first;
            not an upcoming schedule.
          </p>
          <EarningsRows rows={d.rows} kind="recent" />
        </>
      )}
      {view === "ranked" && (
        <>
          <h3>Provider-ranked earnings</h3>
          <p>
            Research priority order, not a buy/sell ranking. EPS values use the
            source’s per-share basis; currency and accounting comparability are
            not supplied. No missing EPS or reaction is assumed zero.
          </p>
          <h4>
            Reported · {d.windowStart} to {d.windowEnd}
          </h4>
          <p>
            {d.rows.length} shown of {d.reportedTotal ?? "unknown"} in the
            source window.
          </p>
          <EarningsRows rows={d.rows} kind="reported" />
          <h4>
            Upcoming · {d.windowEnd} to {d.upcomingEnd}
          </h4>
          <p>
            {d.upcoming.length} shown of {d.upcomingTotal ?? "unknown"} in the
            source window.
          </p>
          <EarningsRows rows={d.upcoming} kind="upcoming" />
          <p className={s.note}>
            Ranking version {d.version}. Provisional and extended-hours moves
            are not final close-to-close reactions. Surprise percentages are
            withheld when the source flags incompatible bases or the estimate
            cannot support a percentage.
          </p>
        </>
      )}
      {view === "statistics" && d.statistics && (
        <>
          <h3>
            Last completed week · {d.statistics.start} to {d.statistics.end}
          </h3>
          {!d.statistics.sufficient && (
            <p role="status">
              Insufficient evidence to publish rates.{" "}
              {d.statistics.reason || "Source publication threshold not met."}{" "}
              Counts below describe the available sample only.
            </p>
          )}
          <dl className={s.metrics}>
            <div>
              <dt>Reported quarters</dt>
              <dd>{d.statistics.events}</dd>
            </div>
            <div>
              <dt>Classified / missing EPS</dt>
              <dd>
                {d.statistics.classified} / {d.statistics.unclassified}
              </dd>
            </div>
            <div>
              <dt>Measured / pending / unavailable reactions</dt>
              <dd>
                {d.statistics.measured} / {d.statistics.pending} /{" "}
                {d.statistics.unavailableReactions}
              </dd>
            </div>
            <div>
              <dt>Beat rate</dt>
              <dd>{percent(d.statistics.beatRate)}</dd>
              <small>
                {d.statistics.beatCount} beats / {d.statistics.classified}{" "}
                classified quarters
              </small>
            </div>
            <div>
              <dt>Beats that fell</dt>
              <dd>{percent(d.statistics.beatsFellRate)}</dd>
              <small>
                {d.statistics.beatsFell} declines / {d.statistics.beatsMeasured}{" "}
                measured beat reactions
              </small>
            </div>
            <div>
              <dt>Distinct companies</dt>
              <dd>{d.statistics.distinctTickers}</dd>
            </div>
          </dl>
          <p className={s.note}>
            Event-weighted historical observations, not forecasts. Beat rate and
            reaction rate have different denominators. Version{" "}
            {d.statistics.version}; no trailing-baseline comparison is shown
            here.
          </p>
        </>
      )}
    </section>
  );
}
