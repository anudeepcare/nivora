"use client";
import { Help } from "./Ui";
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
  const largest = e.holders.reduce<(typeof e.holders)[number] | null>(
    (best, holder) =>
      holder.percent != null &&
      (best?.percent == null || holder.percent > best.percent)
        ? holder
        : best,
    null,
  );
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
          <span>
            Institutions{" "}
            <Help label="Institutional ownership">
              Reported institutional ownership can exceed 100% because of
              lending, short interest, reporting dates and different share
              bases. It is not evidence of current buying.
            </Help>
          </span>
          <strong>{percent(e.ownership.institutions)}</strong>
        </div>
        <div>
          <span>
            Insiders{" "}
            <Help label="Insider ownership">
              Reported insider holdings are separate from reported transactions.
              Compare filing dates before drawing a conclusion.
            </Help>
          </span>
          <strong>{percent(e.ownership.insiders)}</strong>
        </div>
      </div>
      {largest && (
        <p className="ownership-leading">
          <strong>Largest supplied holder: {largest.name}</strong>
          <span>
            {percent(largest.percent)} · reported {dateLabel(largest.date)}
          </span>
        </p>
      )}
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
