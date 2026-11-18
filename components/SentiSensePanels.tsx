"use client";
import CompanyKpiChart from "./CompanyKpiChart";
import AnalystMarketActivity from "./AnalystMarketActivity";
import PoliticianActivity from "./PoliticianActivity";
import PoliticianMembers from "./PoliticianMembers";
import ProviderRating from "./ProviderRating";
import StockInsights from "./StockInsights";
import NamedAnalystProfiles from "./NamedAnalystProfiles";
import PublicationFeeds from "./PublicationFeeds";
import InsiderAnalystEvidence from "./InsiderAnalystEvidence";
import { navigateSelection } from "@/lib/selection-navigation";
import IntelligenceTable from "./IntelligenceTable";
import OwnershipEvidenceMap from "./OwnershipEvidenceMap";
import OptionsPositioningOverview from "./OptionsPositioningOverview";
import OptionsObservationChart from "./OptionsObservationChart";
import Link from "next/link";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { useState } from "react";
import type { SentiSenseDataset, SentiSenseResult } from "@/lib/sentisense-api";
import { intelligenceView } from "@/lib/sentisense-view";
import { useResource } from "./Session";
import SentiSenseStories from "./SentiSenseStories";
import SentiSenseReport from "./SentiSenseReport";
import SentiSenseConsensus from "./SentiSenseConsensus";
import s from "./SentiSensePanels.module.css";
const groups = {
  analysts: [
    ["consensus", "Consensus"],
    ["estimates", "Estimates"],
    ["consensusHistory", "Revisions"],
    ["analystActions", "Analyst actions"],
    ["analystCoverage", "Coverage"],
  ],
  ownership: [
    ["holders", "Institutions"],
    ["ownershipHistory", "Ownership history"],
    ["insiders", "Insiders"],
    ["politicians", "Public officials"],
    ["stockEtfs", "Fund exposure"],
    ["float", "Free float"],
  ],
  events: [
    ["tickerStories", "Stories & sources"],
    ["earnings", "Earnings reports"],
    ["earningsReactions", "Market reactions"],
    ["filingChanges", "Filing changes"],
    ["documents", "Publications"],
    ["stockInsights", "Insights"],
  ],
  options: [
    ["options", "Positioning"],
    ["optionsHistory", "Daily history"],
    ["optionsIntraday", "Intraday snapshots"],
  ],
  indicators: [
    ["kpis", "Company KPIs"],
    ["kpiTypes", "Metric catalog"],
    ["profile", "Company profile"],
    ["providerRating", "Composite rating"],
    ["aiReport", "Research report"],
    ["fundamentalsCurrent", "Trailing profile"],
    ["fundamentalsQuarterly", "Quarterly statements"],
    ["fundamentalsAnnual", "Annual statements"],
    ["shortInterest", "Short interest"],
    ["shortVolume", "Short-sale volume"],
  ],
} as const;
export type SentiSenseGroupName = keyof typeof groups;
export default function SentiSensePanels({
  symbol,
  group,
  preview = false,
}: {
  symbol: string;
  group: SentiSenseGroupName;
  preview?: boolean;
}) {
  const compact = group === "options" || group === "ownership";
  const { preferences } = useWorkspacePreferences();
  const hidden = preferences.hiddenSignals ?? [];
  const categories: Partial<Record<SentiSenseDataset, string>> = {
    holders: "institutions",
    ownershipHistory: "institutions",
    insiders: "insiders",
    politicians: "congressional",
    options: "options",
    optionsHistory: "options",
    optionsIntraday: "options",
  };
  const choices = groups[group].filter(
    ([id]) => !hidden.includes(categories[id as SentiSenseDataset] ?? ""),
  );
  const [selection, setSelection] = useState<string>(groups[group][0][0]);
  const dataset = (
    choices.some(([id]) => id === selection) ? selection : choices[0]?.[0]
  ) as SentiSenseDataset;
  if (preview) return null;
  if (!choices.length)
    return (
      <section className={s.panel}>
        <h2>Research panels hidden</h2>
        <p>
          Your display preferences hide these evidence panels. Coverage and
          access are unchanged.
        </p>
        <Link href="/settings">Change research preferences</Link>
      </section>
    );
  return (
    <section
      className={compact ? s.optionsPanel : s.panel}
      aria-label="Research intelligence"
    >
      {!compact && (
        <header className={s.header}>
          <div>
            <span className={s.eyebrow}>RESEARCH INTELLIGENCE</span>
            <h2>
              {
                {
                  analysts: "Analyst evidence",
                  ownership: "Ownership evidence",
                  events: "Stories, filings & earnings",
                  options: "Options evidence",
                  indicators: "Company data library",
                }[group]
              }
            </h2>
          </div>
          <details className={s.provider} data-info-disclosure>
            <summary aria-label="Data source details">ⓘ Source</summary>
            <p>
              Source: SentiSense. Dataset dates and coverage are shown with each
              result.
            </p>
          </details>
        </header>
      )}
      <div className={compact ? s.datasetToolbar : undefined}>
        <nav
          className={s.tabs}
          data-selection-navigation
          onKeyDown={(event) => navigateSelection(event)}
          aria-label={`${group} intelligence datasets`}
        >
          {choices.map(([id, label]) => (
            <button
              type="button"
              key={id}
              aria-pressed={dataset === id}
              onClick={() => setSelection(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {compact && (
          <details className={s.provider} data-info-disclosure>
            <summary aria-label="Data source details">ⓘ</summary>
            <p>
              Source: SentiSense. Dataset dates and coverage are shown with each
              result.
            </p>
          </details>
        )}
      </div>
      {(dataset as string) === "providerRating" ? (
        <ProviderRating key={symbol} symbol={symbol} />
      ) : (dataset as string) === "stockInsights" ? (
        <StockInsights key={symbol} symbol={symbol} />
      ) : dataset === "documents" ? (
        <PublicationFeeds key={symbol} symbol={symbol} />
      ) : dataset === "aiReport" ? (
        <SentiSenseReport key={symbol} symbol={symbol} />
      ) : dataset === "tickerStories" ? (
        <SentiSenseStories key={symbol} symbol={symbol} />
      ) : dataset === "consensus" ? (
        <SentiSenseConsensus symbol={symbol} preview={false} />
      ) : (
        <Dataset
          key={`${symbol}:${dataset}`}
          symbol={symbol}
          dataset={dataset}
        />
      )}
      {dataset === "analystActions" && <AnalystMarketActivity />}
      {dataset === "politicians" && (
        <>
          <PoliticianMembers />
          <PoliticianActivity />
        </>
      )}
      {dataset === "insiders" && (
        <InsiderAnalystEvidence
          key={`${symbol}-clusters`}
          symbol={symbol}
          kind="clusters"
        />
      )}
      {dataset === "analystCoverage" && (
        <InsiderAnalystEvidence
          key={`${symbol}-calls`}
          symbol={symbol}
          kind="calls"
        />
      )}
    </section>
  );
}
function Dataset({
  symbol,
  dataset,
}: {
  symbol: string;
  dataset: SentiSenseDataset;
}) {
  // Documented company-level estimate storage uses Alphabet's primary class.
  // Fetch and display that security explicitly; never remap data into GOOG models.
  const primaryClass = symbol === "GOOG" && dataset === "estimates";
  const evidenceSymbol = primaryClass ? "GOOGL" : symbol;
  const resource = useResource<SentiSenseResult>(
    `intelligence/${encodeURIComponent(evidenceSymbol)}?dataset=${dataset}`,
    undefined,
    60_000,
  );
  const result = resource.data;
  const verifiedPrimary =
    !primaryClass ||
    (result?.symbol === "GOOGL" &&
      result.data != null &&
      typeof result.data === "object" &&
      !Array.isArray(result.data) &&
      (result.data as { ticker?: unknown }).ticker === "GOOGL");
  const available =
    verifiedPrimary &&
    (result?.status === "available" || result?.status === "preview");
  const view = intelligenceView(dataset, result?.data);
  const count = view.groups.reduce((n, g) => n + g.rows.length, 0);
  const tables = view.groups.map(
    (group) =>
      group.rows.length > 0 && (
        <section className={s.group} key={group.title}>
          <div className={s.groupHeading}>
            <h4>{group.title}</h4>
            <span>{group.rows.length} displayed</span>
          </div>
          <IntelligenceTable
            rows={group.rows}
            title={group.title}
            dateHeading={
              dataset === "estimates"
                ? group.title === "Consensus by period"
                  ? "Fiscal period ending"
                  : "Report date"
                : dataset === "earnings"
                  ? "Report date"
                  : "Date"
            }
          />
        </section>
      ),
  );
  return (
    <div className={s.content}>
      {primaryClass && (
        <p className={s.notice} role="note">
          <strong>GOOGL · Alphabet Class A estimates</strong>. The provider
          stores company estimates under its primary share class. These are
          GOOGL records, not GOOG Class C per-share estimates. No share-class
          conversion is assumed; this display does not replace GOOG prices or
          valuation inputs.
        </p>
      )}
      {dataset !== "options" && (
        <div className={s.intro}>
          <h3>{view.title}</h3>
          <p>{view.note}</p>
          {dataset === "estimates" && (
            <p>
              Source: SentiSense analyst estimates. Fiscal period endings are
              not earnings announcement dates. Events uses a separate feed;
              dates and EPS may differ by reporting basis or update time. Values
              are not reconciled across feeds.
            </p>
          )}
        </div>
      )}
      {resource.loading ? (
        <p className={s.state} role="status">
          Loading {view.title.toLowerCase()}…
        </p>
      ) : resource.error ? (
        <div className={s.state}>
          <p role="status">{resource.error}</p>
          <button
            type="button"
            className="button"
            onClick={resource.refresh}
            aria-label={`Retry ${view.title}`}
          >
            Retry {view.title}
          </button>
        </div>
      ) : !available ? (
        <p className={s.state} role="status">
          This dataset is{" "}
          {!verifiedPrimary
            ? "unverified for the primary share class"
            : (result?.status.replaceAll("-", " ") ?? "unavailable")}{" "}
          for {evidenceSymbol}. No substitute records are shown.
        </p>
      ) : (
        <>
          {result?.isPreview && (
            <p className={s.notice}>
              Limited provider preview. Coverage and fields may be reduced.
            </p>
          )}
          {dataset === "options" && (
            <OptionsPositioningOverview data={result?.data} />
          )}
          {dataset === "analystCoverage" && (
            <NamedAnalystProfiles key={symbol} data={result?.data} />
          )}
          {dataset === "holders" && (
            <OwnershipEvidenceMap symbol={symbol} data={result?.data} />
          )}
          {(dataset === "optionsHistory" || dataset === "optionsIntraday") && (
            <OptionsObservationChart
              data={result?.data}
              intraday={dataset === "optionsIntraday"}
            />
          )}
          {dataset === "kpis" && <CompanyKpiChart data={result?.data} />}
          {!count ? (
            <p className={s.state}>
              No displayable records were returned for this section. This does
              not imply zero activity.
            </p>
          ) : dataset === "kpis" ? (
            <details>
              <summary>All source metric records</summary>
              {tables}
            </details>
          ) : dataset === "options" ? (
            <details>
              <summary>Detailed positioning observations</summary>
              {tables}
            </details>
          ) : (
            tables
          )}
          <details className={s.provenance}>
            <summary>Evidence dates & coverage</summary>
            <span>Source: {result?.source ?? "SentiSense"}</span>
            <span>
              Evidence date {result?.asOf?.slice(0, 10) ?? "not supplied"}
            </span>
            <span>
              Retrieved {result?.retrievedAt?.slice(0, 19).replace("T", " ")}{" "}
              UTC
            </span>
            {result?.totalCount != null && (
              <span>
                {result.totalCount.toLocaleString()} provider records in scope;
                this view may be a subset
              </span>
            )}
          </details>
        </>
      )}
    </div>
  );
}
