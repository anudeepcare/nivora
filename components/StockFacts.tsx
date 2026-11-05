"use client";
import type { Research } from "@/lib/types";
import { amount, dateLabel } from "@/lib/format";
import { Help } from "./Ui";
import styles from "./StockFacts.module.css";

/** Every price/volume comparison uses the same completed daily observations. */
export function stockFactRows(r: Research) {
  const validDate = (value: string | null | undefined): value is string =>
    !!value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  const observed = r.priceObservedAt ?? r.retrievedAt;
  const day = observed.slice(0, 10);
  if (!validDate(day)) return [];
  const bars = [
    ...new Map(
      r.history
        .filter(
          (b) =>
            validDate(b.time) &&
            b.time < day &&
            [b.open, b.high, b.low, b.close].every(Number.isFinite) &&
            b.low > 0 &&
            b.high >= Math.max(b.open, b.close, b.low) &&
            b.low <= Math.min(b.open, b.close),
        )
        .map((b) => [b.time, b]),
    ).values(),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const latest = bars.at(-1);
  const rows: { label: string; value: string; date: string; help: string }[] =
    [];
  const cap = r.evidence?.highlights?.MarketCapitalization;
  const capObservation = r.evidence?.listingObservations?.marketCap;
  const update = r.evidence?.updatedAt?.slice(0, 10);
  const capDate = capObservation?.asOf?.slice(0, 10) ?? update;
  const capCurrency = capObservation?.currency ?? r.company.currency;
  if (
    r.company.assetType === "stock" &&
    typeof cap === "number" &&
    Number.isFinite(cap) &&
    cap > 0 &&
    validDate(capDate) &&
    capDate <= day &&
    capCurrency === r.quote.currency
  ) {
    rows.push({
      label: "Market cap",
      value: amount(cap, capCurrency, true),
      date: `${capObservation ? "Observed" : "Dataset updated"} ${dateLabel(capDate)}`,
      help: "Reported equity market value. For example, 10 million shares at $20 would equal $200 million. A dataset update date is not necessarily the market-value observation date; this is not recalculated from the latest quote.",
    });
  }
  if (latest) {
    const quoteDay = r.quote.asOf?.slice(0, 10);
    const prior =
      validDate(quoteDay) &&
      quoteDay <= day &&
      latest.time < quoteDay &&
      r.quote.previousClose != null &&
      Number.isFinite(r.quote.previousClose) &&
      Math.abs(latest.close - r.quote.previousClose) <=
        Math.max(0.0001, latest.close * 0.00001);
    rows.push({
      label: prior ? "Prior close" : "Latest history close",
      value: amount(latest.close, r.quote.currency),
      date: dateLabel(latest.time),
      help: "The latest completed daily close in the supplied history. It is labelled Prior close only when its date precedes the quote and its price matches the quote’s previous-close field. For example, a dated $100 close is a historical reference, not a current or premarket price.",
    });
    const boundary = new Date(Date.parse(latest.time) - 364 * 86400000)
      .toISOString()
      .slice(0, 10);
    const window = bars.filter((b) => b.time >= boundary);
    const covered =
      bars[0].time <= boundary &&
      window.length >= (r.company.assetType === "crypto" ? 360 : 240) &&
      window.every(
        (b, i) =>
          i === 0 ||
          Date.parse(b.time) - Date.parse(window[i - 1].time) <= 7 * 86400000,
      );
    const range = covered ? window : bars;
    const prices = range.map((b) => b.close);
    rows.push({
      label: covered ? "52-week closing range" : "Available closing range",
      value: `${amount(Math.min(...prices), r.quote.currency)} – ${amount(Math.max(...prices), r.quote.currency)}`,
      date: `${dateLabel(range[0].time)} – ${dateLabel(latest.time)}`,
      help: "Lowest and highest completed daily closing prices in the stated period, not intraday highs or lows. For example, $80–$120 means the supplied closes span those values. The 52-week label requires a year of coverage; shorter or sparse history uses its available dates.",
    });
    const preceding = bars.slice(-21, -1);
    if (
      preceding.length === 20 &&
      [latest, ...preceding].every(
        (b) => Number.isFinite(b.volume) && b.volume > 0,
      )
    ) {
      const average = preceding.reduce((total, b) => total + b.volume, 0) / 20;
      rows.push({
        label: "Relative volume · completed",
        value: `${(latest.volume / average).toFixed(2)}×`,
        date: dateLabel(latest.time),
        help: `Volume on ${dateLabel(latest.time)} divided by the average of the preceding 20 completed daily observations (${dateLabel(preceding[0].time)}–${dateLabel(preceding.at(-1)!.time)}), excluding the latest observation. For example, 1.50× means 50% above that average. It does not compare a partial trading session with full days or indicate a price direction.`,
      });
    }
  }
  const next =
    r.company.assetType === "stock"
      ? r.evidence?.earnings
          ?.filter(
            (e) => validDate(e.date) && e.date >= day && e.actual == null,
          )
          .sort((a, b) => a.date.localeCompare(b.date))[0]
      : null;
  if (next && validDate(update) && update <= day)
    rows.push({
      label: "Next reported earnings date",
      value: dateLabel(next.date),
      date: `Dataset updated ${dateLabel(update)}`,
      help: "The next earnings report date supplied by the data source, as of the stated dataset update. For example, a November 12 date is a scheduled report date, not the fiscal quarter end. Schedules can change; no trading-session time is inferred.",
    });
  return rows;
}

export default function StockFacts({ research }: { research: Research }) {
  const rows = stockFactRows(research);
  if (!rows.length) return null;
  return (
    <section
      className={styles.region}
      aria-label="Dated stock and market facts"
    >
      <dl className={styles.strip}>
        {rows.map((row) => (
          <div key={row.label}>
            <dt>
              {row.label}
              <Help label={row.label}>
                <p>{row.help}</p>
              </Help>
            </dt>
            <dd>
              {row.value}
              <small>{row.date}</small>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
