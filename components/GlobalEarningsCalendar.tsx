"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { EarningsAnalysisView } from "@/lib/earnings-analysis";
const EarningsAnalysisPanel = dynamic(() => import("./EarningsAnalysisPanel"));
import { useResource } from "./Session";
import {
  type GlobalCalendar,
  earningsSessions,
  earningsWindow,
} from "@/lib/global-earnings";
import s from "./GlobalEarningsCalendar.module.css";
const sessions = {
  before_open: "Before open",
  after_close: "After close",
  during_market: "During market",
  unknown: "Time not announced",
};
const figure = (x: number | null) =>
  x === null
    ? "Not supplied"
    : x.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        notation: Math.abs(x) >= 1000000 ? "compact" : "standard",
      });
export default function GlobalEarningsCalendar() {
  const [days, setDays] = useState(14);
  const [view, setView] = useState<"calendar" | EarningsAnalysisView>(
    "calendar",
  );
  const [day, setDay] = useState(() => earningsWindow(7)?.from ?? "");
  useEffect(() => {
    const update = () => setDay(earningsWindow(7)?.from ?? "");
    const timer = window.setInterval(update, 60000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);
  return (
    <section className={s.root} aria-label="Market earnings calendar">
      <header>
        <h2>Earnings calendar</h2>
        <p>
          Upcoming reports across the provider’s curated US equity universe, not
          the whole market or just the company you are researching. Dates may
          change.
        </p>
      </header>
      <div className={s.controls} role="group" aria-label="Earnings view">
        {(
          [
            ["calendar", "Upcoming calendar"],
            ["recent", "Recently reported"],
            ["statistics", "Weekly statistics"],
            ["ranked", "Ranked earnings"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={view === value}
            onClick={() => setView(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "calendar" ? (
        <>
          <div className={s.controls} role="group" aria-label="Calendar window">
            {[7, 14, 30].map((n) => (
              <button
                key={n}
                aria-pressed={days === n}
                onClick={() => setDays(n)}
              >
                Next {n} days
              </button>
            ))}
          </div>
          <CalendarWindow key={`${days}:${day}`} days={days} day={day} />
        </>
      ) : (
        <EarningsAnalysisPanel key={`${view}:${day}`} view={view} />
      )}
    </section>
  );
}
function CalendarWindow({ days, day }: { days: number; day: string }) {
  const result = useResource<GlobalCalendar>(
    `global-earnings?days=${days}&day=${encodeURIComponent(day)}`,
    undefined,
    300000,
  );
  const [status, setStatus] = useState("all"),
    [session, setSession] = useState("all"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(0);
  const data = result.data;
  const today = earningsWindow(7)?.from ?? "";
  const upcoming =
    data?.events.filter((e) => !e.reported && e.date >= today) ?? [];
  const filtered = upcoming.filter(
    (e) =>
      (status === "all" || e.confirmed === (status === "confirmed")) &&
      (session === "all" || e.session === session) &&
      `${e.ticker} ${e.company}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const shown = filtered.slice(page * 25, page * 25 + 25);
  return (
    <>
      <div className={s.filters}>
        <label>
          Confirmation
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">Confirmed and estimated</option>
            <option value="confirmed">Company confirmed</option>
            <option value="estimated">Estimated date</option>
          </select>
        </label>
        <label>
          Report session
          <select
            value={session}
            onChange={(e) => {
              setSession(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">All sessions</option>
            {earningsSessions.map((v) => (
              <option key={v} value={v}>
                {sessions[v]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Company or ticker
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Filter loaded events"
          />
        </label>
      </div>
      {result.loading ? (
        <p role="status">Loading the earnings schedule…</p>
      ) : result.error ? (
        <div role="status">
          <p>{result.error}</p>
          <div className={s.controls}>
            <button type="button" onClick={result.refresh}>
              Retry calendar
            </button>
          </div>
        </div>
      ) : data ? (
        <>
          <p className={s.note}>
            {data.windowStart}–{data.windowEnd} · calendar day boundary:
            America/New_York. Session labels follow the provider; exact release
            times are not inferred. Snapshot received{" "}
            {data.retrievedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC")}.
          </p>
          <p className={s.note}>
            Provider snapshot built{" "}
            {data.generatedAt
              ? data.generatedAt.replace("T", " ")
              : "at an unavailable time"}
            . Server snapshots are cached for 24 hours; this loaded view can be
            older. Check the receipt date above. Schedules may change between
            updates.
          </p>
          {data.preview && (
            <p className={s.notice}>
              Limited provider preview: only the first week of the requested
              window is included.{" "}
              {data.totalCount !== null
                ? `${data.totalCount} matching events were reported before the preview limit.`
                : ""}{" "}
              This is not complete global coverage.
            </p>
          )}
          <p className={s.note}>
            {filtered.length} upcoming loaded events match these filters.{" "}
            {data.events.filter((e) => e.reported).length > 0
              ? `${data.events.filter((e) => e.reported).length} rows already carrying results are excluded from upcoming reports.`
              : ""}{" "}
            {data.omitted > 0
              ? `${data.omitted} unsupported rows omitted.`
              : ""}{" "}
            Estimates are provider calendar figures, not AURYN forecasts;
            currency and accounting basis are not supplied per row.
          </p>
          {shown.length ? (
            <div
              className={s.scroll}
              tabIndex={0}
              role="region"
              aria-label="Upcoming earnings table"
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Date / session</th>
                    <th scope="col">Company</th>
                    <th scope="col">Status / period</th>
                    <th scope="col">EPS estimate</th>
                    <th scope="col">Revenue estimate</th>
                    <th scope="col">Call details</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={`${e.ticker}:${e.date}`}>
                      <td>
                        <time dateTime={e.date}>{e.date}</time>
                        <small>{sessions[e.session]}</small>
                      </td>
                      <td>
                        <Link
                          href={`/research/${encodeURIComponent(e.ticker)}?tab=News`}
                        >
                          {e.ticker}
                        </Link>
                        <small>{e.company}</small>
                      </td>
                      <td>
                        <span className={s.status} data-confirmed={e.confirmed}>
                          {e.confirmed ? "Confirmed" : "Estimated"}
                        </span>
                        <small>
                          {e.quarter ?? "Fiscal quarter not supplied"}
                        </small>
                      </td>
                      <td>{figure(e.eps)}</td>
                      <td>{figure(e.revenue)}</td>
                      <td>
                        {e.callTime ? (
                          <time dateTime={e.callTime}>
                            {e.callTime.replace("T", " ")}
                          </time>
                        ) : (
                          <span>Time not supplied</span>
                        )}
                        {e.webcast && (
                          <a
                            href={e.webcast}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Company webcast ↗
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p role="status">
              No upcoming events in the loaded snapshot match these filters.
              This does not establish that no companies report in the window.
            </p>
          )}
          <div className={s.controls}>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {page + 1} of {Math.max(1, Math.ceil(filtered.length / 25))}
            </span>
            <button
              disabled={(page + 1) * 25 >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
