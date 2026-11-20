"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { Research } from "@/lib/types";
import { calendarEvents, monthCells } from "@/lib/research-visual-evidence";
import layout from "./DirectResearchLenses.module.css";
import s from "./ResearchVisualEvidence.module.css";
export default function CompanyEventCalendar({
  research,
}: {
  research: Research;
}) {
  const events = useMemo(() => calendarEvents(research), [research]);
  const initial = research.retrievedAt.slice(0, 7);
  const [kind, setKind] = useState("all");
  const filtered = events.filter(
    (event) => kind === "all" || event.kind === kind,
  );
  const [month, setMonth] = useState(initial),
    [selected, setSelected] = useState<string | null>(null);
  const cells = monthCells(month),
    visible = filtered.filter((x) =>
      selected ? x.date === selected : x.date.startsWith(month),
    );
  const title = cells.length
    ? new Date(month + "-01T00:00:00Z").toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Event dates";
  function move(delta: number) {
    const d = new Date(month + "-01T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(d.toISOString().slice(0, 7));
    setSelected(null);
  }
  return (
    <section
      className={`${s.panel} ${layout.events}`}
      aria-label="Company events calendar"
    >
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>DATED EVIDENCE</span>
          <h3>
            <CalendarDays size={16} /> Company calendar
          </h3>
        </div>
        <span className={s.subtle}>{events.length} supplied events</span>
      </header>
      <div className={`${s.calendarLayout} ${layout.eventColumns}`}>
        <div className={layout.calendarPanel}>
          <div className={s.monthHead}>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <strong>{title}</strong>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div
            className={layout.eventFilters}
            role="group"
            aria-label="Event type"
          >
            {[
              ["all", "All"],
              ["earnings", "Earnings"],
              ["filing", "Filings"],
              ["transaction", "Activity"],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                aria-pressed={kind === key}
                onClick={() => setKind(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={s.calendar}>
            {["M", "T", "W", "T", "F", "S", "S"].map((v, i) => (
              <span className={s.weekday} key={i}>
                {v}
              </span>
            ))}
            {cells.map((date, i) => {
              const found = filtered.filter((x) => x.date === date);
              return date ? (
                <button
                  type="button"
                  className={`${s.day} ${layout.calendarDay}`}
                  key={date}
                  aria-pressed={selected === date}
                  aria-label={`${date}, ${found.length} supplied events`}
                  onClick={() => setSelected(selected === date ? null : date)}
                >
                  <span>{Number(date.slice(-2))}</span>
                  <span className={s.dots}>
                    {[...new Set(found.map((x) => x.kind))].map((kind) => (
                      <i key={kind} className={s[kind]} />
                    ))}
                  </span>
                </button>
              ) : (
                <span key={"blank" + i} />
              );
            })}
          </div>
          <div className={s.legend}>
            {["earnings", "filing", "transaction"].map((kind) => (
              <span key={kind}>
                <i className={s[kind]} />
                {kind === "transaction"
                  ? "Activity"
                  : kind === "filing"
                    ? "Filings"
                    : "Earnings"}
              </span>
            ))}
          </div>
        </div>
        <div className={`${s.agenda} ${layout.streamPanel}`}>
          <div className={s.agendaHead}>
            <strong>Chronological stream · {selected ?? "this month"}</strong>
            {selected && (
              <button type="button" onClick={() => setSelected(null)}>
                Show month
              </button>
            )}
          </div>
          <div className={s.scroll} tabIndex={0} aria-label="Dated events">
            {visible.length ? (
              visible.map((event, i) => (
                <article
                  className={s.event}
                  key={`${event.date}:${event.label}:${i}`}
                >
                  <time dateTime={event.date}>
                    <b>{Number(event.date.slice(-2))}</b>
                    {new Date(event.date + "T00:00:00Z").toLocaleDateString(
                      "en-US",
                      { month: "short", timeZone: "UTC" },
                    )}
                  </time>
                  <div>
                    <span className={s.eventLabel}>{event.label}</span>
                    <small>{event.detail}</small>
                  </div>
                  <i className={s[event.kind]} />
                </article>
              ))
            ) : (
              <p className={s.empty}>
                No event dates supplied for{" "}
                {selected ? "this day" : "this month"}. Coverage may be
                incomplete.
              </p>
            )}
          </div>
        </div>
      </div>
      <p className={s.footnote}>
        Supplied earnings, filing and transaction dates only. Fiscal periods are
        not announcement dates. Impact rankings are not supplied.
      </p>
    </section>
  );
}
