"use client";
import TechnicalDashboard from "./TechnicalDashboard";
import { useMemo, useRef } from "react";
import { X } from "lucide-react";
import type { Research } from "@/lib/types";
import { perspective, latestFinancialEvidence } from "@/lib/analysis";
import { financialCase } from "@/lib/research-summary";
import { priceStudies } from "@/lib/price-studies";
import { expandedStudies } from "@/lib/technical-expanded";
import { amount, dateLabel, percent } from "@/lib/format";
import TechnicalLevels from "./TechnicalLevels";
import OwnershipPicture from "./OwnershipPicture";
import Analyst from "./Analyst";
import { Help, DataStamp } from "./Ui";

export function TechnicalPicture({
  research: r,
  chart,
}: {
  research: Research;
  dca: React.ReactNode;
  chart?: React.ReactNode;
}) {
  return <TechnicalDashboard research={r} chart={chart} />;
}

export function ThesisPicture({ research: r }: { research: Research }) {
  const e = useMemo(() => latestFinancialEvidence(r), [r]);
  const c = useMemo(() => financialCase(e.latest, e.prior), [e]);
  const next = r.evidence?.earnings
    ?.filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const groups = [
    { label: "Supports the case", rows: c.positive, tone: "positive" },
    { label: "Challenges the case", rows: c.risks, tone: "negative" },
  ];
  return (
    <div className="depth-thesis">
      <header className="section-head">
        <div>
          <h2>The investment case</h2>
          <p>Three drivers. Three risks. What would change the view.</p>
        </div>
      </header>
      <div className="grid2 thesis-evidence">
        {groups.map((g) => (
          <section className="thesis-group" data-tone={g.tone} key={g.label}>
            <h3 className={g.tone}>
              <span className="thesis-status" aria-hidden="true">
                {g.tone === "positive" ? "✓" : "!"}
              </span>
              {g.label}
            </h3>
            {g.rows.slice(0, 3).map((x) => (
              <div className="driver" key={x.key}>
                <h3>{x.title}</h3>
                <strong className="driver-value num">
                  {x.unit === "percent"
                    ? percent(x.value)
                    : x.unit === "ratio"
                      ? `${x.value.toFixed(1)}×`
                      : amount(x.value, e.latest?.currency, true)}
                </strong>
                <p>{x.text}</p>
              </div>
            ))}
            {!g.rows.length && (
              <p className="context-note">
                {r.company.assetType === "crypto"
                  ? "Evaluate supply, network usage, liquidity and protocol risks. Corporate financial ratios do not apply."
                  : g.tone === "negative"
                    ? "No measured downside factors were established in this snapshot. This does not establish low risk. Test valuation assumptions, customer concentration, funding needs and the next earnings report."
                    : "No supporting factors were established in this snapshot. Review original disclosures before drawing a conclusion."}
              </p>
            )}
          </section>
        ))}
      </div>
      <header className="section-head">
        <div>
          <h2>Watch next</h2>
          <p>Evidence to revisit, not predictions.</p>
        </div>
      </header>
      <div className="timeline thesis-checkpoints">
        <div className="step">
          <b>Next earnings</b>
          <strong>{next ? dateLabel(next.date) : "Date not confirmed"}</strong>
          <p>Revenue, cash conversion and guidance.</p>
        </div>
        <div className="step">
          <b>Revenue to revisit</b>
          <strong>{amount(e.latest?.revenue, e.latest?.currency, true)}</strong>
          <p>
            Latest reported period · {dateLabel(e.latest?.end)}. Compare demand
            in the next report.
          </p>
        </div>
        <div className="step">
          <b>Operating margin</b>
          <strong>{percent(e.latest?.margin)}</strong>
          <p>
            Latest reported period · monitor pricing, costs and reinvestment.
          </p>
        </div>
      </div>
      <div className="notice">
        <strong>Revisit the case if</strong> growth and cash conversion weaken
        persistently or the funding picture changes.
      </div>
      <OwnershipPicture research={r} />
      <Analyst research={r} compact />
    </div>
  );
}
