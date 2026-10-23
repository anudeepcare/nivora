"use client";
import type { Research } from "@/lib/types";
import {
  financingContext,
  operatingEfficiency,
} from "@/lib/research-integrity";
import { amount, percent, dateLabel } from "@/lib/format";
export default function FinancingContext({
  research: r,
}: {
  research: Research;
}) {
  const x = financingContext(r),
    e = operatingEfficiency(r);
  if (!x.applicable || !x.period) return null;
  return (
    <section className="financing-context">
      <header className="section-head">
        <div>
          <span className="eyebrow">Funding & ownership</span>
          <h3>Cash needs and dilution</h3>
          <p>
            Financial period {dateLabel(x.period)}. Negative cash after capex
            can reflect major investment, not just operating losses.
          </p>
        </div>
      </header>
      <div>
        {[
          ["Reported cash", amount(x.cash, x.currency ?? undefined, true)],
          [
            "Operating-burn runway",
            x.operatingRunway == null
              ? "Not established"
              : `${x.operatingRunway.toFixed(1)} months`,
          ],
          [
            "After-investment runway",
            x.investmentRunway == null
              ? "Not established"
              : `${x.investmentRunway.toFixed(1)} months`,
          ],
          ["Diluted share change", percent(x.dilution)],
          ["Stock pay / revenue", percent(x.sbcRevenue)],
          ["Capex / revenue", percent(x.capexRevenue)],
          [
            "Working capital",
            amount(e.workingCapital, x.currency ?? undefined, true),
          ],
          [
            "Cash / debt",
            e.cashDebt == null
              ? "Not established"
              : e.cashDebt.toFixed(2) + "×",
          ],
          [
            "Receivable days",
            e.receivableDays == null
              ? "Not established"
              : e.receivableDays.toFixed(1),
          ],
          [
            "Inventory days",
            e.inventoryDays == null
              ? "Not established"
              : e.inventoryDays.toFixed(1),
          ],
          [
            "Payable days",
            e.payableDays == null
              ? "Not established"
              : e.payableDays.toFixed(1),
          ],
          [
            "Cash conversion cycle",
            e.cashCycle == null
              ? "Not established"
              : e.cashCycle.toFixed(1) + " days",
          ],
        ]
          .filter(([, value]) => value !== "Not established" && value !== "—")
          .map(([label, value]) => (
            <section key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </section>
          ))}
      </div>
      <p className="small muted">
        Unavailable measurements are omitted. Runway = reported cash ÷ average
        monthly historical cash use, using an annual or TTM period. No new
        financing, restricted-cash adjustment or future spending forecast is
        assumed. Working-capital days use average comparable balance-sheet
        values and the annual/TTM flow period. They may not fit financial
        businesses. Debt maturities and convertible conversion terms require the
        original filings; no missing schedule is invented.
      </p>
    </section>
  );
}
