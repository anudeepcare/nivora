"use client";
import { navigateSelection } from "@/lib/selection-navigation";
import { useId, useState, type ReactNode } from "react";
/** One visible evidence workspace, with every capability reachable in a labelled control. */
export default function ResearchWorkspace({
  label,
  views,
  preserveState = false,
  initialSelection = 0,
}: {
  label: string;
  preserveState?: boolean;
  initialSelection?: number;
  views: { title: string; shortTitle?: string; content: ReactNode }[];
}) {
  const [selected, setSelected] = useState(initialSelection);
  const id = useId();
  return (
    <section aria-label={label} data-research-workspace>
      <div
        className="auryn-view-tabs research-compact-tabs"
        data-selection-navigation
        data-nested-navigation
        data-research-nav="detail"
        onKeyDown={(event) => navigateSelection(event)}
        role="group"
        aria-label={`${label} views`}
      >
        {views.map((view, index) => (
          <button
            type="button"
            key={view.title}
            aria-label={view.title}
            aria-pressed={selected === index}
            aria-controls={`${id}-content`}
            onClick={() => setSelected(index)}
          >
            <span aria-hidden="true" data-nav-icon={view.title} />
            <span>{view.shortTitle ?? view.title}</span>
          </button>
        ))}
      </div>
      <div
        data-research-view
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
