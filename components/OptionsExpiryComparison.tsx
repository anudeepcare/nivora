"use client";
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
  const columns = (
    [
      ["callVolume", "Call volume"],
      ["putVolume", "Put volume"],
      ["oi", "Open interest"],
    ] as const
  ).filter(([key]) => rows.some((row) => row[key] !== null));
  const hasVolume = columns.some(([key]) => key !== "oi");
  return (
    <details className={s.comparison}>
      <summary>
        Compare expiration dates <span>{rows.length} loaded</span>
      </summary>
      {columns.length === 0 && (
        <p>Volume and open interest are not supplied.</p>
      )}
      <div className={s.scroll}>
        <table>
          <caption>
            Loaded expirations · select a date to inspect contracts
          </caption>
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
            {rows.map((row) => (
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
      <p>
        Totals cover loaded contracts. Volume counts reported trades, not
        direction. — means not supplied.
      </p>
    </details>
  );
}
