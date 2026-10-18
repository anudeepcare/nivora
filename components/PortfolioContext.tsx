"use client";
import { useProduct } from "./Session";
import { holdingsContext } from "@/lib/holdings-brief";
import type { Quote, Research } from "@/lib/types";
import { amount, percent } from "@/lib/format";
export default function PortfolioContext({
  quotes,
}: {
  quotes: Record<string, Quote>;
}) {
  const { workspace, cache } = useProduct();
  const sectors: Record<string, string> = {};
  for (const [key, entry] of cache) {
    if (key.startsWith("research/")) {
      const r = entry.value as Research;
      if (r?.company?.symbol) {
        const sector = r.evidence?.profile?.sector || r.company.sector;
        if (sector) sectors[r.company.symbol] = sector;
      }
    }
  }
  const c = holdingsContext(workspace?.positions ?? [], quotes, sectors);
  if (!workspace?.positions.length) return null;
  return (
    <section className="portfolio-context">
      <header className="section-head">
        <div>
          <span className="eyebrow">Exposure, not a forecast</span>
          <h3>Your portfolio at a glance</h3>
        </div>
      </header>
      <div className="context-highlights">
        <div>
          <span>Priced value</span>
          <strong>{amount(c.pricedValue, "USD")}</strong>
          <small>
            {c.missing} unpriced · {c.stale} older quotes
          </small>
        </div>
        <div>
          <span>Largest holding</span>
          <strong>{c.largest?.symbol ?? "—"}</strong>
          <small>
            {c.largest && c.pricedValue > 0
              ? `${percent((c.largest.value / c.pricedValue) * 100)} of priced value`
              : "No priced investment"}
          </small>
        </div>
        <div>
          <span>Observed session move</span>
          <strong className={c.observedChange < 0 ? "red" : "green"}>
            {c.changeCovered ? amount(c.observedChange, "USD") : "—"}
          </strong>
          <small>
            {amount(c.changeCovered, "USD", true)} covered · excludes stale
            quotes
          </small>
        </div>
      </div>
      <div className="exposure-list">
        {c.sectors.map((s, i) => (
          <div key={s.name}>
            <span>{s.name}</span>
            <div className="exposure-track">
              <i
                style={{
                  width: `${s.percent}%`,
                  background: [
                    "var(--blue)",
                    "var(--green)",
                    "var(--violet)",
                    "var(--muted)",
                  ][i % 4],
                }}
              />
            </div>
            <b>{percent(s.percent)}</b>
          </div>
        ))}
      </div>
      <p className="small muted">
        Sector coverage comes from reports you have opened. Unclassified
        holdings stay visible. Percentages use priced USD value; session move is
        not a total-return calculation and does not measure deposits or
        withdrawals.
      </p>
    </section>
  );
}
