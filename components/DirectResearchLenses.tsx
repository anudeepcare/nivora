"use client";
import dynamic from "next/dynamic";
import type { Research } from "@/lib/types";
import CompanyEventCalendar from "./CompanyEventCalendar";
import CompanyUpdates from "./CompanyUpdates";
import IndicatorOverview from "./IndicatorOverview";

import SentiSensePanels from "./SentiSensePanels";

import EarningsReview from "./EarningsReview";
import EconomicContext from "./EconomicContext";
import s from "./DirectResearchLenses.module.css";

const EntityMetricHistory = dynamic(() => import("./EntityMetricHistory"));

const StockSentiment = dynamic(() => import("./StockSentiment"));

const AdvancedResearch = dynamic(() => import("./AdvancedResearch"), {
  loading: () => <p role="status">Opening research tools…</p>,
});
const EarningsWorkspace = dynamic(() => import("./EarningsWorkspace"), {
  loading: () => <p role="status">Opening earnings evidence…</p>,
});

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
      <EconomicContext symbol={research.company.symbol} preview={preview} />
      <div className={s.supporting}>
        <CompanyUpdates research={research} preview={preview} />
        <EarningsWorkspace research={research} />
        <EarningsReview research={research} contextOnly />
        <SentiSensePanels
          symbol={research.company.symbol}
          preview={preview}
          group="events"
        />
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
      <EntityMetricHistory
        key={`history-${research.company.symbol}`}
        symbol={research.company.symbol}
        preview={preview}
      />
      <StockSentiment
        key={research.company.symbol}
        symbol={research.company.symbol}
        preview={preview}
      />
      <div className={s.supporting}>
        <AdvancedResearch research={research} />
        <SentiSensePanels
          symbol={research.company.symbol}
          preview={preview}
          group="indicators"
        />
      </div>
    </section>
  );
}
