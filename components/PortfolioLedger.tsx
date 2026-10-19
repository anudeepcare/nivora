"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Wallet } from "lucide-react";
import type { Company, Position, Quote } from "@/lib/types";
import { ledgerRows } from "@/lib/portfolio-ledger";
import { amount, percent, quoteTime } from "@/lib/format";
import { SecurityLogo } from "./Ui";
export default function PortfolioLedger({
  positions,
  allPositions,
  quotes,
  companies,
  total,
  earnings,
  prefix,
  onEdit,
}: {
  positions: Position[];
  allPositions: Position[];
  quotes: Record<string, Quote>;
  companies: Record<string, Company | undefined>;
  total: number;
  earnings: Set<string>;
  prefix: string;
  onEdit: (p: Position) => void;
}) {
  const [sort, setSort] = useState("value");
  const rows = useMemo(() => {
    const selected = new Set(positions.map((p) => p.id));
    return ledgerRows(allPositions, quotes, total, earnings)
      .filter((r) => selected.has(r.position.id))
      .sort((a, b) =>
        sort === "name"
          ? a.position.symbol.localeCompare(b.position.symbol)
          : sort === "return"
            ? (b.returnPct ?? -Infinity) - (a.returnPct ?? -Infinity)
            : (b.value ?? -Infinity) - (a.value ?? -Infinity),
      );
  }, [positions, allPositions, quotes, total, earnings, sort]);
  return (
    <div className="portfolio-ledger-wrap">
      <div className="ledger-toolbar">
        <span>Value & unrealized return · USD</span>
        <label>
          Sort
          <select
            aria-label="Sort holdings"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="value">Largest value</option>
            <option value="return">Highest return</option>
            <option value="name">Ticker A–Z</option>
          </select>
        </label>
      </div>
      <table className="portfolio-ledger">
        <caption className="sr-only">
          Recorded holdings. Value uses available USD prices; returns require
          USD cost basis. Watch flags are review prompts, not recommendations.
        </caption>
        <thead>
          <tr>
            <th>Investment</th>
            <th>Average cost</th>
            <th>Price</th>
            <th>Value</th>
            <th>Unrealized</th>
            <th>Review</th>
            <th>
              <span className="sr-only">Edit</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const p = row.position,
              cash = p.assetType === "cash";
            return (
              <tr key={p.id}>
                <td className="ledger-company">
                  {cash ? (
                    <div className="ledger-identity">
                      <span className="ledger-cash">
                        <Wallet size={20} />
                      </span>
                      <span>
                        <b>USD cash</b>
                        <small>Recorded balance</small>
                      </span>
                    </div>
                  ) : (
                    <Link
                      className="ledger-identity"
                      href={`${prefix}/research/${encodeURIComponent(p.symbol.replace("/", "-"))}`}
                    >
                      <SecurityLogo symbol={p.symbol} size={38} />
                      <span>
                        <b>{p.symbol}</b>
                        <small className="ledger-name">
                          {companies[p.symbol]?.name || "Open research"}
                        </small>
                        <small>
                          {p.quantity.toLocaleString(undefined, {
                            maximumFractionDigits: 6,
                          })}{" "}
                          {p.assetType === "crypto" ? "units" : "shares"}
                          <span className="ledger-mobile-price">
                            {" "}
                            · {amount(row.price, "USD")}
                          </span>
                        </small>
                      </span>
                    </Link>
                  )}
                </td>
                <td className="ledger-cost">
                  {cash || !p.currency ? "—" : amount(p.cost, p.currency)}
                </td>
                <td className="ledger-price">
                  <strong>{amount(row.price, "USD")}</strong>
                  {!cash && quotes[p.symbol]?.asOf && (
                    <small><time dateTime={quotes[p.symbol].asOf ?? undefined} title={quoteTime(quotes[p.symbol].asOf)}>{quoteTime(quotes[p.symbol].asOf, true)}</time></small>
                  )}
                </td>
                <td className="ledger-value">
                  <strong>{amount(row.value, "USD")}</strong>
                </td>
                <td
                  className={`ledger-result ${row.pnl == null ? "muted" : row.pnl < 0 ? "negative" : "positive"}`}
                >
                  <strong>
                    {row.pnl == null ? "—" : amount(row.pnl, "USD")}
                  </strong>
                  {row.returnPct != null && (
                    <small>{percent(row.returnPct, true)}</small>
                  )}
                </td>
                <td className={`ledger-watch ${row.note ? "has-note" : ""}`}>
                  {row.note ? (
                    <span
                      className={
                        row.caution ? "ledger-caution" : "ledger-event"
                      }
                    >
                      {row.note}
                    </span>
                  ) : (
                    <span className="ledger-desktop-empty">—</span>
                  )}
                </td>
                <td className="ledger-edit">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Edit ${p.symbol}`}
                    onClick={() => onEdit(p)}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
