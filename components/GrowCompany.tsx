"use client";
import { customerText } from "@/lib/customer-language";
import { useMemo, useState } from "react";
import type { GrowData, GrowDataset } from "@/lib/grow-data";
import { useProduct, useResource } from "./Session";
import { amount, dateLabel, percent } from "@/lib/format";
import { Notice, Source } from "./Ui";
import s from "./ResearchWorkspace.module.css";
export function useGrow(symbol: string, dataset: GrowDataset) {
  const { demo } = useProduct();
  const preview = useMemo(
    () =>
      demo
        ? ({
            symbol,
            dataset,
            source: "Illustrative preview",
            retrievedAt: "2026-10-17",
            currency: null,
            profile: null,
            earnings: [],
            dividends: [],
            splits: [],
            announcements: [],
          } as GrowData)
        : undefined,
    [demo, symbol, dataset],
  );
  return useResource<GrowData>(
    `company-data?symbol=${encodeURIComponent(symbol)}&dataset=${dataset}`,
    preview,
    3600000,
  );
}
export function CompanyProfile({ symbol }: { symbol: string }) {
  const resource = useGrow(symbol, "profile"),
    p = resource.data?.profile;
  if (!p)
    return resource.loading ? (
      <p className={s.caption} role="status">
        Loading company profile…
      </p>
    ) : resource.error ? (
      <Notice>{resource.error}</Notice>
    ) : null;
  return (
    <section>
      <p className={s.caption}>
        {p.sector} · {p.industry}
      </p>
      <p className={s.description}>{p.description}</p>
      <div className={s.stats}>
        {[
          ["Chief executive", p.ceo],
          ["Employees", p.employees?.toLocaleString() ?? "—"],
          ["Headquarters", p.country],
        ].map(([label, value]) => (
          <div className={s.stat} key={label}>
            <span>{label}</span>
            <strong>{value || "—"}</strong>
          </div>
        ))}
      </div>
      <div className={s.source}>
        <span>
          {customerText(resource.data?.source)} profile · retrieved{" "}
          {dateLabel(resource.data?.retrievedAt)}
        </span>
        {p.website && <Source href={p.website}>Company website</Source>}
      </div>
    </section>
  );
}
export default function GrowCompanyEvents({ symbol }: { symbol: string }) {
  const [dataset, setDataset] = useState<GrowDataset>("earnings");
  const r = useGrow(symbol, dataset),
    d = r.data;
  const latest = d?.earnings.find((e) => e.actual != null),
    currency = d?.currency;
  const money = (n: number | null) =>
    currency ? amount(n, currency) : n == null ? "—" : n.toFixed(2);
  return (
    <section className={s.workspace}>
      <div className={s.filters} aria-label="Company event datasets">
        {(
          [
            ["earnings", "Earnings"],
            ["announcements", "Announcements"],
            ["dividends", "Dividends"],
            ["splits", "Splits"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={dataset === key}
            onClick={() => setDataset(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {r.loading && !d && (
        <p className={s.caption} role="status">
          Loading {dataset}…
        </p>
      )}
      {r.error && (
        <Notice>
          {r.error} <button onClick={r.refresh}>Retry</button>
        </Notice>
      )}
      {d && (
        <>
          {dataset === "earnings" && (
            <>
              {latest && (
                <div className={s.stats}>
                  {[
                    ["Latest EPS", money(latest.actual)],
                    ["Estimate", money(latest.estimate)],
                    ["Surprise", percent(latest.surprise, true)],
                    ["Reported", dateLabel(latest.date)],
                  ].map(([label, value]) => (
                    <div key={label} className={s.stat}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              )}
              {d.earnings.length ? (
                <div className={s.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Report date</th>
                        <th>Actual EPS</th>
                        <th>Estimate</th>
                        <th>Surprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.earnings.map((e) => (
                        <tr key={e.date}>
                          <th>
                            {dateLabel(e.date)}
                            <small className="table-detail">{e.time}</small>
                          </th>
                          <td>{money(e.actual)}</td>
                          <td>{money(e.estimate)}</td>
                          <td>{percent(e.surprise, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={s.empty}>
                  No earnings records returned for this company.
                </p>
              )}
              <p className={s.caption}>
                Provider earnings EPS can differ from filed GAAP EPS. A surprise
                is not a buy/sell signal.{" "}
                {currency
                  ? `Reported in ${currency}.`
                  : "Currency was not supplied; values are not labeled USD."}
              </p>
            </>
          )}
          {dataset === "announcements" &&
            (d.announcements.length ? (
              <div className="compact-records">
                {d.announcements.map((a, i) => (
                  <div className="event-record" key={a.date + i}>
                    <div>
                      <time>{dateLabel(a.date)}</time>
                      <p>{a.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={s.empty}>
                No announcements returned for this company.
              </p>
            ))}
          {dataset === "dividends" &&
            (d.dividends.length ? (
              <div className={s.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Ex-dividend date</th>
                      <th>Cash per share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.dividends.map((x, i) => (
                      <tr key={x.date + i}>
                        <th>{dateLabel(x.date)}</th>
                        <td>{money(x.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={s.empty}>
                No dividend records returned in this history.
              </p>
            ))}
          {dataset === "splits" && (
            <>
              {d.splits.length ? (
                <div className="compact-records">
                  {d.splits.map((x, i) => (
                    <div className="event-record" key={x.date + i}>
                      <time>{dateLabel(x.date)}</time>
                      <strong>{x.description}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={s.empty}>
                  No split records returned in this history.
                </p>
              )}
              <p className={s.caption}>
                Events are informational. Saved quantities and cost basis are
                not changed automatically.
              </p>
            </>
          )}
          <p className={s.caption}>
            {customerText(d.source)} · retrieved {dateLabel(d.retrievedAt)}
          </p>
        </>
      )}
    </section>
  );
}
