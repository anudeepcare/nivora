"use client";
import {researchDecision} from "@/lib/decision-research";
import { useProduct } from "./Session";
import { holdingsContext } from "@/lib/holdings-brief";
import type { Quote, Research } from "@/lib/types";
import { amount, percent } from "@/lib/format";
export default function PortfolioContext({
  quotes,
  compact = false,
}: {
  quotes: Record<string, Quote>;
  compact?: boolean;
}) {
  const { workspace, cache } = useProduct();
  const sectors: Record<string, string> = {};
  const reports=new Map<string,Research>();
  for (const [key, entry] of cache) {
    if (key.startsWith("research/")) {
      const r = entry.value as Research;
      if (r?.company?.symbol) {
        reports.set(r.company.symbol,r);
        const sector = r.evidence?.profile?.sector || r.company.sector;
        if (sector) sectors[r.company.symbol] = sector;
      }
    }
  }
  const c = holdingsContext(workspace?.positions ?? [], quotes, sectors);
  if (!workspace?.positions.length) return null;
  const held=[...new Set(workspace.positions.filter(p=>p.assetType==='stock').map(p=>p.symbol))];
  const covered=held.flatMap(symbol=>{const r=reports.get(symbol);return r?[{symbol,...researchDecision(r)}]:[];});
  const flagged=covered.filter(x=>x.flags.length>0);
  return (
    <section
      className={`portfolio-context${compact ? " portfolio-context-compact" : ""}`}
    >
      <header className="section-head">
        <div>
          {!compact && (
            <span className="eyebrow">Exposure, not a forecast</span>
          )}
          <h3>
            {compact ? "Portfolio snapshot" : "Your portfolio at a glance"}
          </h3>
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
      {!compact && (
        <>
          <section className="portfolio-evidence-health"><h4>Evidence coverage across your holdings</h4><p><strong>{covered.length} of {held.length} stock holdings reviewed</strong> · {flagged.length} have current review flags.</p>{flagged.length>0&&<p>{flagged.map(x=>`${x.symbol}: ${x.flags[0].title}`).join(' · ')}</p>}<small>Based on reports already loaded in this session. Unreviewed holdings are not cleared; no whole-portfolio quality score is inferred from partial coverage.</small></section>
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
                        "var(--purple)",
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
            holdings stay visible. Percentages use priced USD value; session
            move is not a total-return calculation and does not measure deposits
            or withdrawals.
          </p>
        </>
      )}
    </section>
  );
}
