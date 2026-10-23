"use client";
import { useMemo } from "react";
import type { Research } from "@/lib/types";
import { modelAssessment } from "@/lib/model-assessment";
export default function ModelAssessment({
  research: r,
}: {
  research: Research;
}) {
  const a = useMemo(() => modelAssessment(r), [r]);
  return (
    <details
      className="model-assessment model-assessment-compact"
      aria-label="Valuation model suitability"
    >
      <summary>
        Valuation methods &amp; data notes{" "}
        <span>
          {a.methods.filter((m) => m.status === "available").length} available
        </span>
      </summary>
      <div className="model-assessment-grid">
        {a.methods.map((m) => (
          <article key={m.key} data-state={m.status}>
            <span className="model-status">
              {m.status === "available"
                ? "Inputs available"
                : m.status === "unsuitable"
                  ? "Different model needed"
                  : "Inputs incomplete"}
            </span>
            <h3>{m.name}</h3>
            <p>{m.reason}</p>
          </article>
        ))}
      </div>
      {a.family !== "operating-company" && (
        <div className="specialist-model">
          <strong>{a.method}</strong>
          <ul>
            {a.next.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
