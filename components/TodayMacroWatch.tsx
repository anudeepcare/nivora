"use client";
import { useAccess } from "./Access";
import { useResource } from "./Session";
import { dateLabel } from "../lib/format";
import type { EodContextData } from "../lib/eod-context";
import s from "./TodayMacroWatch.module.css";

const releaseTypes = [
  [
    "Fed rate decision",
    /\b(?:(?:fed(?:eral reserve)?|fomc) (?:funds )?rate decision|interest rate decision)\b/i,
  ],
  [
    "Fed meeting minutes",
    /\b(?:fomc|fed(?:eral reserve)?) (?:meeting )?minutes\b/i,
  ],
  [
    "Consumer inflation (CPI)",
    /\b(?:cpi|consumer price index|consumer price inflation)\b/i,
  ],
  [
    "PCE inflation",
    /\b(?:pce price index|pce inflation|personal consumption expenditures price index)\b/i,
  ],
  [
    "Employment report",
    /\b(?:non[ -]?farm payrolls|employment situation|unemployment rate)\b/i,
  ],
  [
    "GDP growth",
    /\b(?:gdp growth|real gross domestic product)\b|^(?:u\.?s\.? )?gdp(?:\s*\((?:qoq|yoy)\)| (?:qoq|yoy|annualized|preliminary|final|advance)|$)/i,
  ],
  [
    "Producer inflation (PPI)",
    /\b(?:ppi|producer price index|producer price inflation)\b/i,
  ],
] as const;

const validDay = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;

export default function TodayMacroWatch({
  today,
  preview = false,
}: {
  today: string;
  preview?: boolean;
}) {
  const { access } = useAccess();
  const show =
    !preview &&
    access.admitted &&
    !access.sampleOnly &&
    !!access.features.news &&
    validDay(today);
  const resource = useResource<EodContextData>(
    show ? "market-context?kind=economy" : null,
    undefined,
    1800000,
  );
  if (!show) return null;

  const response = resource.data?.kind === "economy" ? resource.data : null;
  const dayAfterToday = new Date(Date.parse(today) + 86400000)
    .toISOString()
    .slice(0, 10);
  const checkedTime = Date.parse(response?.checkedAt ?? "");
  const checkedUtcDay = Number.isFinite(checkedTime)
    ? new Date(checkedTime).toISOString().slice(0, 10)
    : null;
  // The API requests UTC dates. Between UTC and New York midnight it can
  // legitimately start tomorrow in the workspace, with a full seven-day horizon.
  const from =
    response?.from === dayAfterToday && checkedUtcDay === dayAfterToday
      ? dayAfterToday
      : today;
  const through = new Date(Date.parse(from) + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const calendar =
    response &&
    validDay(response.from) &&
    validDay(response.to) &&
    response.from <= response.to &&
    response.to >= today &&
    response.from <= through
      ? response
      : null;
  const limited =
    !!calendar &&
    (calendar.truncated || calendar.from > from || calendar.to < through);
  const range = calendar
    ? `${dateLabel(calendar.from > today ? calendar.from : today)} to ${dateLabel(calendar.to < through ? calendar.to : through)}`
    : null;
  const releases = new Map<
    string,
    { date: string; label: string; priority: number }
  >();
  for (const row of calendar?.rows ?? []) {
    if (
      !validDay(row.date) ||
      row.date < today ||
      row.date > through ||
      row.date < calendar!.from ||
      row.date > calendar!.to
    )
      continue;
    if (/\b(?:private payrolls|private non[ -]?farm|adp)\b/i.test(row.name))
      continue;
    const priority = releaseTypes.findIndex(([, pattern]) =>
      pattern.test(row.name),
    );
    if (priority < 0) continue;
    releases.set(`${row.date}:${priority}`, {
      date: row.date,
      label: releaseTypes[priority][0],
      priority,
    });
  }
  const upcoming = [...releases.values()]
    .sort((a, b) => a.date.localeCompare(b.date) || a.priority - b.priority)
    .slice(0, 2);
  const status = resource.error
    ? upcoming.length
      ? "Could not refresh. Showing previously returned dates."
      : "Calendar unavailable. A release may still be scheduled."
    : resource.loading
      ? "Checking the U.S. calendar…"
      : !calendar
        ? "Calendar unavailable. A release may still be scheduled."
        : limited
          ? "Coverage is limited. Other releases may be scheduled."
          : !upcoming.length
            ? "No major U.S. releases were returned for this window."
            : "";
  return (
    <section className={s.watch} aria-label="U.S. market watch">
      <header className={s.heading}>
        <h2>Market watch</h2>
        <span>Key U.S. releases{range && ` · ${range}`}</span>
      </header>
      {upcoming.length > 0 && (
        <ul className={s.releases}>
          {upcoming.map((release) => (
            <li key={`${release.date}:${release.priority}`}>
              <time dateTime={release.date}>{dateLabel(release.date)}</time>
              <strong>{release.label}</strong>
            </li>
          ))}
        </ul>
      )}
      {status && (
        <p className={s.status} role="status">
          {status}
        </p>
      )}
      {!resource.loading && (resource.error || !calendar) && (
        <button className={s.retry} type="button" onClick={resource.refresh}>
          Retry calendar
        </button>
      )}
    </section>
  );
}
