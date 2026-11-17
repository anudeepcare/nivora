"use client";
import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { Research } from "@/lib/types";
import CompanyEventCalendar from "./CompanyEventCalendar";
import CompanyUpdates from "./CompanyUpdates";
import IndicatorOverview from "./IndicatorOverview";

import SentiSensePanels from "./SentiSensePanels";

import EarningsReview from "./EarningsReview";
import s from "./DirectResearchLenses.module.css";

const AdvancedResearch = dynamic(() => import("./AdvancedResearch"), {
  loading: () => <p role="status">Opening research tools…</p>,
});
const EarningsWorkspace = dynamic(() => import("./EarningsWorkspace"), {
  loading: () => <p role="status">Opening earnings evidence…</p>,
});

/** Secondary datasets are mounted only after opening, not hidden paid requests. */
function MoreEvidence({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [opened, setOpened] = useState(false);
  return (
    <details
      className={s.more}
      onToggle={(event) => {
        if (event.currentTarget.open) setOpened(true);
      }}
    >
      <summary>{title}</summary>
      {opened && children}
    </details>
  );
}
export function EventsLens({
  research,
  preview,
}: {
  research: Research;
  preview: boolean;
}) {
  return (
    <section className={s.lens} aria-label="Events lens">
      <CompanyEventCalendar research={research} />
      <div className={s.supporting}>
        <MoreEvidence title="News, filings & reported activity">
          <CompanyUpdates research={research} preview={preview} />
        </MoreEvidence>
        <MoreEvidence title="Earnings results & estimates">
          <EarningsReview research={research} contextOnly />
          <EarningsWorkspace research={research} />
        </MoreEvidence>
        <MoreEvidence title="Earnings readouts & market reactions">
          <SentiSensePanels
            symbol={research.company.symbol}
            preview={preview}
            group="events"
          />
        </MoreEvidence>
      </div>
    </section>
  );
}
export function IndicatorsLens({
  research,
  preview,
}: {
  research: Research;
  preview: boolean;
}) {
  return (
    <section className={s.lens} aria-label="Indicators lens">
      <IndicatorOverview research={research} />
      <div className={s.supporting}>
        <MoreEvidence title="Risk, position & research tools">
          <AdvancedResearch research={research} />
        </MoreEvidence>
        <MoreEvidence title="Operating metrics & short-interest evidence">
          <SentiSensePanels
            symbol={research.company.symbol}
            preview={preview}
            group="indicators"
          />
        </MoreEvidence>
      </div>
    </section>
  );
}
