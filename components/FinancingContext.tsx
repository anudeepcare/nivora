"use client";
import { Help } from "./Ui";
import type { Research } from "@/lib/types";
import {
  financingContext,
  operatingEfficiency,
} from "@/lib/research-integrity";
import { amount, percent, dateLabel } from "@/lib/format";
const definitions: Record<string, string> = {
  "Reported cash":
    "Cash and cash equivalents reported at the period end. This is not necessarily all available for distribution.",
  "Operating-burn runway":
    "Reported cash divided by average monthly operating cash use. Historical estimate; excludes new financing and future spending changes.",
  "After-investment runway":
    "Reported cash divided by average monthly cash use after capital spending. Historical estimate, not a forecast.",
  "Diluted share change":
    "Percentage change in reported diluted shares versus the comparable period. It is not an exact options or RSU dilution schedule.",
  "Stock pay / revenue":
    "Stock-based compensation divided by revenue for the same period. Non-cash compensation can dilute existing shareholders.",
  "Capex / revenue":
    "Reported capital expenditure divided by revenue for the same period.",
  "Working capital":
    "Current assets minus current liabilities at the reporting date.",
  "Cash / debt":
    "Reported cash divided by reported debt. This does not account for debt maturity or cash restrictions.",
  "Receivable days":
    "Average comparable receivables divided by annual or TTM revenue, multiplied by 365.",
  "Inventory days":
    "Average comparable inventory divided by annual or TTM cost of revenue, multiplied by 365.",
  "Payable days":
    "Average comparable payables divided by annual or TTM cost of revenue, multiplied by 365.",
  "Cash conversion cycle":
    "Receivable days plus inventory days minus payable days. Sector and accounting differences affect comparisons.",
};
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
      <div className="funding-metrics">
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
            <section
              key={label}
              data-kind={
                label === "Reported cash" || label === "Working capital"
                  ? "balance"
                  : "ratio"
              }
            >
              <span>
                <Help label={label} trigger={label}>
                  {definitions[label]}
                </Help>
              </span>
              <strong>{value}</strong>
            </section>
          ))}
      </div>
      <div className="funding-basis">
        <Help
          label="How cash runway is estimated"
          trigger="About these measurements"
        >
          <p>
            Cash runway estimates how long reported cash could cover recent cash
            use. It uses an annual or TTM period and excludes future financing,
            restricted-cash adjustments and spending changes.
          </p>
          <p>
            Working-capital days use average comparable balances and annual/TTM
            flows. Debt maturities and conversion terms require the original
            filings. Missing measurements are omitted.
          </p>
        </Help>
        <small>
          Historical measurements · future funding and spending can change the
          picture.
        </small>
      </div>
    </section>
  );
}
