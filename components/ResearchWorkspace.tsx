"use client";
import { useId, useState, type ReactNode } from "react";
/** One visible evidence workspace, with every capability reachable in a labelled control. */
export default function ResearchWorkspace({
  label,
  views,
  preserveState = false,
}: {
  label: string;
  preserveState?: boolean;
  views: { title: string; content: ReactNode }[];
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  return (
    <section aria-label={label}>
      <div
        className="segmented"
        role="group"
        aria-label={`${label} views`}
        style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}
      >
        {views.map((view, index) => (
          <button
            type="button"
            key={view.title}
            aria-pressed={selected === index}
            aria-controls={`${id}-content`}
            onClick={() => setSelected(index)}
          >
            {view.title}
          </button>
        ))}
      </div>
      <div
        id={`${id}-content`}
        role="region"
        aria-label={views[selected]?.title}
      >
        {preserveState
          ? views.map((view, index) => (
              <div key={view.title} hidden={index !== selected}>
                {view.content}
              </div>
            ))
          : views[selected]?.content}
      </div>
    </section>
  );
}
