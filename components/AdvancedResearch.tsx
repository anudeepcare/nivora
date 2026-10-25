"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Research } from "@/lib/types";
import { advancedStudies } from "@/lib/advanced-research";
import { dateLabel } from "@/lib/format";
import AdvancedDashboard from "./AdvancedDashboard";
const PositionWorkbench = dynamic(
  () => import("./ProfessionalWorkbench").then((m) => m.PositionWorkbench),
  { loading: () => <p role="status">Opening position workbench…</p> },
);
const ExpectationWorkbench = dynamic(
  () => import("./ProfessionalWorkbench").then((m) => m.ExpectationWorkbench),
  { loading: () => <p role="status">Opening valuation workbench…</p> },
);
const ContextWorkbench = dynamic(
  () => import("./ProfessionalWorkbench").then((m) => m.ContextWorkbench),
  { loading: () => <p role="status">Opening market workbench…</p> },
);
const HistoryWorkbench = dynamic(
  () => import("./ProfessionalWorkbench").then((m) => m.HistoryWorkbench),
  { loading: () => <p role="status">Opening historical workbench…</p> },
);
export default function AdvancedResearch({
  research: r,
  initialSection = "risk",
}: {
  research: Research;
  initialSection?: string;
}) {
  const s = useMemo(
    () => advancedStudies(r.history, r.retrievedAt),
    [r.history, r.retrievedAt],
  );
  const [active, setActive] = useState(initialSection),
    [visited, setVisited] = useState(["risk", initialSection]);
  const sections = [
    ["risk", "Risk & conditions"],
    ["position", "Position design"],
    ["expectations", "Expectations"],
    ["market", "Market context"],
    ["history", "Historical lens"],
  ];
  return (
    <div className="professional-studio depth-advanced">
      <header className="professional-studio-heading">
        <div>
          <span className="eyebrow">Advanced · the decision workbench</span>
          <h2>Pressure-test the decision.</h2>
          <p>
            {s.count.toLocaleString()} completed observations · through{" "}
            {dateLabel(s.asOf)}. Explore the downside before committing capital.
          </p>
        </div>
        <span className="professional-mode-label">
          Research tools · no order execution
        </span>
      </header>
      <nav className="professional-tabs" aria-label="Advanced sections">
        {sections.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={active === id}
            aria-controls={`professional-${id}`}
            onClick={() => {
              setActive(id);
              setVisited((old) => (old.includes(id) ? old : [...old, id]));
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <section id="professional-risk" hidden={active !== "risk"}>
        <AdvancedDashboard research={r} />
      </section>
      {visited.includes("position") && (
        <section id="professional-position" hidden={active !== "position"}>
          <PositionWorkbench research={r} />
        </section>
      )}
      {visited.includes("expectations") && (
        <section
          id="professional-expectations"
          hidden={active !== "expectations"}
        >
          <ExpectationWorkbench research={r} />
        </section>
      )}
      {visited.includes("market") && (
        <section id="professional-market" hidden={active !== "market"}>
          <ContextWorkbench research={r} />
        </section>
      )}
      {visited.includes("history") && (
        <section id="professional-history" hidden={active !== "history"}>
          <HistoryWorkbench research={r} />
        </section>
      )}
    </div>
  );
}
