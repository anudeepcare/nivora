"use client";
import type { Research } from "@/lib/types";
import { percent, dateLabel } from "@/lib/format";
export default function OwnershipPicture({
  research: r,
}: {
  research: Research;
}) {
  const e = r.evidence;
  if (
    !e ||
    (e.ownership.institutions == null &&
      e.ownership.insiders == null &&
      !e.holders.length)
  )
    return null;
  return (
    <section className="ownership-picture">
      <header className="section-head">
        <div>
          <span className="eyebrow">Reported ownership</span>
          <h3>Who holds the shares?</h3>
        </div>
      </header>
      <div className="context-highlights">
        <div>
          <span>Institutions</span>
          <strong>{percent(e.ownership.institutions)}</strong>
        </div>
        <div>
          <span>Insiders</span>
          <strong>{percent(e.ownership.insiders)}</strong>
        </div>
      </div>
      {e.holders.length > 0 && (
        <div className="table-scroll">
          <table>
            <caption>
              Reported positions are delayed disclosures, not live buying or
              selling.
            </caption>
            <thead>
              <tr>
                <th>Holder</th>
                <th>Reported date</th>
                <th>Shares</th>
                <th>Ownership</th>
              </tr>
            </thead>
            <tbody>
              {e.holders.slice(0, 8).map((h, i) => (
                <tr key={h.name + i}>
                  <th>{h.name}</th>
                  <td>{dateLabel(h.date)}</td>
                  <td>{h.shares?.toLocaleString() ?? "—"}</td>
                  <td>{percent(h.percent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted">
        Ownership is not proof of a moat or a return forecast. Different
        reporting dates and share classes may limit comparability.
      </p>
    </section>
  );
}
