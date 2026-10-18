"use client";
import type { Research } from "@/lib/types";
import { earningsSurprise } from "@/lib/research-workbench";
import { dateLabel, percent, amount } from "@/lib/format";
export default function EarningsWorkspace({
  research: r,
}: {
  research: Research;
}) {
  const day = r.retrievedAt.slice(0, 10),
    rows = (r.evidence?.earnings ?? [])
      .filter((e) => e.date <= day && (e.actual != null || e.estimate != null))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  const future = (r.evidence?.estimates ?? [])
    .filter((e) => e.date > day)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  if (!rows.length && !future.length) return null;
  return (
    <section className="earnings-workspace">
      <header className="section-head">
        <div>
          <span className="eyebrow">Expectations & delivery</span>
          <h3>Earnings checkpoints</h3>
          <p>Results and forecasts stay separate. Estimates can change.</p>
        </div>
      </header>
      {rows.length > 0 && (
        <div className="table-scroll">
          <table>
            <caption>
              Reported EPS versus the supplied estimate. Surprise = (actual −
              estimate) / |estimate|. Currency and adjusted/GAAP basis are not
              consistently supplied for historical EPS; compare within the same
              series.
            </caption>
            <thead>
              <tr>
                <th>Report date</th>
                <th>Period</th>
                <th>Actual EPS</th>
                <th>Estimate</th>
                <th>Surprise</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => {
                const surprise = earningsSurprise(e.actual, e.estimate);
                return (
                  <tr key={e.date + e.period + i}>
                    <td>{dateLabel(e.date)}</td>
                    <td>{e.period || "—"}</td>
                    <td>{e.actual?.toFixed(2) ?? "—"}</td>
                    <td>{e.estimate?.toFixed(2) ?? "—"}</td>
                    <td
                      className={
                        surprise == null
                          ? "muted"
                          : surprise < 0
                            ? "red"
                            : "green"
                      }
                    >
                      {percent(surprise, true)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {future.length > 0 && (
        <div className="table-scroll">
          <table>
            <caption>Future estimates · not reported results</caption>
            <thead>
              <tr>
                <th>Period ending</th>
                <th>Scope</th>
                <th>Revenue estimate</th>
                <th>EPS estimate</th>
                <th>Analysts</th>
              </tr>
            </thead>
            <tbody>
              {future.map((e, i) => (
                <tr key={e.date + e.frequency + i}>
                  <td>{dateLabel(e.date)}</td>
                  <td>{e.frequency || "Not supplied"}</td>
                  <td>
                    {e.revenue != null && e.currency
                      ? amount(e.revenue, e.currency, true)
                      : "—"}
                  </td>
                  <td className={e.eps != null && e.eps < 0 ? "red" : ""}>
                    {e.eps != null && e.currency
                      ? amount(e.eps, e.currency)
                      : "—"}
                  </td>
                  <td>{e.analysts ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
