"use client";
import { expiryComparison } from "@/lib/options-expiry-comparison";
import type { OptionContract } from "@/lib/options-analysis";
import { dateLabel } from "@/lib/format";
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
  const number = (n: number | null) =>
    n === null ? "Not supplied" : n.toLocaleString();
  return (
    <details className="expiry-comparison">
      <summary>
        Compare expiration dates{" "}
        <span>{rows.length} loaded · Show comparison</span>
      </summary>
      <p>
        Calls and puts count reported contracts traded. Expiration dates are
        future contract dates; observation dates show when the data was
        measured.
      </p>
      <div className="expiry-comparison-list">
        {rows.map((r) => (
          <button
            type="button"
            key={r.expiry}
            aria-pressed={active === r.expiry}
            onClick={() => onChoose(r.expiry)}
          >
            <strong>
              {dateLabel(r.expiry)}{" "}
              <span>{active === r.expiry ? "Selected" : "View →"}</span>
            </strong>
            <span>
              Call volume <b>{number(r.callVolume)}</b>
            </span>
            <span>
              Put volume <b>{number(r.putVolume)}</b>
            </span>
            <span>
              Open interest <b>{number(r.oi)}</b>
            </span>
            <small>
              {r.contracts} contracts · volume supplied for {r.volumeCoverage}
              <br />
              Observed {dateLabel(r.oldest)}
              {r.oldest !== r.newest ? ` – ${dateLabel(r.newest)}` : ""}
            </small>
          </button>
        ))}
      </div>
      <small>
        Totals cover loaded contracts only. Trade volume does not identify
        buyers, sellers or price direction.
      </small>
    </details>
  );
}
