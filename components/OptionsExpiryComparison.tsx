"use client";
import { useState } from "react";
import { expiryComparison } from "@/lib/options-expiry-comparison";
import type { OptionContract } from "@/lib/options-analysis";
import { dateLabel } from "@/lib/format";
import s from "./OptionsExpiryComparison.module.css";
export default function OptionsExpiryComparison({
  contracts,
  active,
  onChoose,
}: {
  contracts: OptionContract[];
  active: string;
  onChoose: (date: string) => void;
}) {
  const rows = expiryComparison(contracts);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const [browsedPage, setBrowsedPage] = useState<{
    active: string;
    page: number;
  } | null>(null);
  const selectedPage = Math.max(
    0,
    Math.floor(rows.findIndex((row) => row.expiry === active) / pageSize),
  );
  const page = Math.min(
    pageCount - 1,
    browsedPage?.active === active ? browsedPage.page : selectedPage,
  );
  const first = page * pageSize;
  const last = Math.min(rows.length, first + pageSize);
  const visible = rows.slice(first, last);
  const columns = (
    [
      ["callVolume", "Call volume"],
      ["putVolume", "Put volume"],
      ["oi", "Open interest"],
    ] as const
  ).filter(([key]) => rows.some((row) => row[key] !== null));
  const hasVolume = columns.some(([key]) => key !== "oi");
  return (
    <section className={s.comparison} aria-label="Expiration comparison">
      <h4>
        Expirations <span>{rows.length} loaded</span>
      </h4>
      <div
        className={s.scroll}
        role="region"
        aria-label="Loaded expirations table"
        tabIndex={0}
      >
        <table>
          <caption>Select an expiration to inspect its contracts</caption>
          <thead>
            <tr>
              <th scope="col">Expiration</th>
              <th scope="col">Contracts</th>
              {columns.map(([key, label]) => (
                <th scope="col" key={key}>
                  {label}
                </th>
              ))}
              {hasVolume && <th scope="col">Volume coverage</th>}
              <th scope="col">Observed</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.expiry} data-selected={active === row.expiry}>
                <th scope="row">
                  <button
                    type="button"
                    aria-pressed={active === row.expiry}
                    onClick={() => onChoose(row.expiry)}
                  >
                    {dateLabel(row.expiry)}
                    {active === row.expiry && <span>Selected</span>}
                  </button>
                </th>
                <td>{row.contracts.toLocaleString()}</td>
                {columns.map(([key]) => (
                  <td key={key}>
                    {row[key] === null ? (
                      <span aria-label="Not supplied">—</span>
                    ) : (
                      row[key].toLocaleString()
                    )}
                  </td>
                ))}
                {hasVolume && (
                  <td>
                    {row.volumeCoverage}/{row.contracts}
                  </td>
                )}
                <td>
                  {dateLabel(row.oldest)}
                  {row.oldest !== row.newest
                    ? ` – ${dateLabel(row.newest)}`
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <nav className={s.pages} aria-label="Expiration pages">
          <button
            type="button"
            aria-disabled={page === 0}
            aria-label="Previous expirations"
            onClick={() => {
              if (page > 0) setBrowsedPage({ active, page: page - 1 });
            }}
          >
            Previous
          </button>
          <span aria-live="polite">
            {first + 1}–{last} of {rows.length}
          </span>
          <button
            type="button"
            aria-disabled={page + 1 >= pageCount}
            aria-label="Next expirations"
            onClick={() => {
              if (page + 1 < pageCount)
                setBrowsedPage({ active, page: page + 1 });
            }}
          >
            Next
          </button>
        </nav>
      )}
      <p>Loaded contracts only · — means missing data.</p>
    </section>
  );
}
