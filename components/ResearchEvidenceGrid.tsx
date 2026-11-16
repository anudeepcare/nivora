"use client";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import React, { useMemo } from "react";
import { Building2, Scale, Activity, Users, ArrowUpRight } from "lucide-react";
import type { Research } from "@/lib/types";
import type { EvidenceSection } from "@/lib/approved-research";
import { headerMarketContext } from "@/lib/business-history";
import type { OverviewMetric } from "@/lib/overview-evidence";
import { overviewEvidence } from "@/lib/overview-evidence";
import { amount, percent, dateLabel } from "@/lib/format";
import { Help, Source } from "./Ui";
import DetailDialog from "./DetailDialog";
import s from "./ResearchEvidenceGrid.module.css";
export default function ResearchEvidenceGrid({
  research,
  onTab,
}: {
  research: Research;
  onTab: (tab: EvidenceSection) => void;
}) {
  const { preferences } = useWorkspacePreferences();
  const evidence = useMemo(() => overviewEvidence(research), [research]);
  const market = headerMarketContext(research);
  const marketCap: OverviewMetric[] =
    market.marketCap == null
      ? []
      : [
          {
            key: "marketCap",
            label: "Market cap",
            value: market.marketCap,
            unit: "money",
            currency: market.currency,
            help: "Reported equity market capitalization; a dated snapshot, not shares multiplied by the latest trade.",
            tone: "neutral",
            period: market.asOf ?? undefined,
          },
        ];
  const groups = [
    {
      name: "Margins",
      key: "margins",
      icon: Activity,
      rows: evidence.business.filter((x) =>
        ["revenueGrowth", "operatingMargin", "fcfMargin", "netMargin"].includes(
          x.key,
        ),
      ),
      tab: "Financials" as const,
    },
    {
      name: "Business quality",
      key: "business",
      icon: Building2,
      rows: evidence.business.filter(
        (x) =>
          ![
            "revenueGrowth",
            "operatingMargin",
            "fcfMargin",
            "netMargin",
          ].includes(x.key),
      ),
      tab: "Financials" as const,
    },
    {
      name: "Valuation",
      key: "valuation",
      icon: Scale,
      rows: [...evidence.valuation, ...marketCap],
      tab: "Valuation" as const,
    },
    {
      name: "Technical conditions",
      key: "technical",
      icon: Activity,
      rows: evidence.technical,
      tab: "Technicals" as const,
    },
    {
      name: "Ownership",
      key: "ownership",
      icon: Users,
      rows: evidence.ownership,
      tab: "Thesis" as const,
    },
  ]
    .filter(({ key }) =>
      preferences.visibleMetrics.includes(
        key === "technical" ? "price" : key === "margins" ? "business" : key,
      ),
    )
    .filter(({ rows }) => rows.length > 0)
    .filter(
      ({ tab }) =>
        !evidence.crypto || (tab !== "Financials" && tab !== "Valuation"),
    );
  const metricBasis = (row: OverviewMetric) => (
    <>
      {row.help}
      {row.period && (
        <p>
          {row.periodBasis ?? "Reported"} · {dateLabel(row.period)}
        </p>
      )}
      {[
        ...new Set(
          [row.sourceUrl, ...(row.sourceUrls ?? [])].filter(
            (url): url is string => Boolean(url),
          ),
        ),
      ].map((url, index) => (
        <Source key={url} href={url}>
          Source evidence{index ? ` ${index + 1}` : ""}
        </Source>
      ))}
    </>
  );
  const renderRows = (
    rows: OverviewMetric[],
    key: string,
    inDialog = false,
  ) => (
    <dl>
      {rows.map((row) => (
        <div key={row.key} className={s.metric}>
          <dt>
            {inDialog ? (
              <>
                <strong>{row.label}</strong>
                <div className={s.metricBasis}>{metricBasis(row)}</div>
              </>
            ) : (
              <Help label={row.label} trigger={row.label}>
                {metricBasis(row)}
              </Help>
            )}
          </dt>
          <dd data-tone={row.tone}>
            {row.unit === "money"
              ? amount(row.value, row.currency, true)
              : row.unit === "percent"
                ? percent(row.value)
                : row.unit === "ratio"
                  ? `${row.value.toFixed(1)}×`
                  : row.value.toFixed(1)}
          </dd>
          {row.unit === "percent" &&
            row.value >= 0 &&
            row.value <= 100 &&
            (key === "margins" || key === "ownership") && (
              <span className={s.meter} aria-hidden="true">
                <i style={{ width: `${row.value}%` }} />
              </span>
            )}
        </div>
      ))}
    </dl>
  );

  const mobileKeys = [
    "marketCap",
    "revenueGrowth",
    "fcfMargin",
    "operatingMargin",
    "netMargin",
    "TrailingPE",
  ];
  const available = groups.flatMap((group) => group.rows);
  const mobileSummary = mobileKeys.flatMap((key) =>
    available.filter((row) => row.key === key),
  );
  if (!groups.length) return null;
  return (
    <section className={s.grid} aria-label="Research evidence at a glance">
      {mobileSummary.length > 0 && (
        <article
          className={`${s.panel} ${s.mobileEvidence}`}
          aria-label="Financial snapshot"
        >
          {renderRows(mobileSummary, "snapshot")}
          <p className={s.snapshot}>Financials {dateLabel(evidence.period)}</p>
        </article>
      )}
      {groups
        .filter((group) => group.key !== "margins")
        .map(({ name, key, rows }) => {
          const remaining = rows.filter((row) => !mobileKeys.includes(row.key));
          const core =
            key === "business"
              ? remaining.filter((row) =>
                  ["revenue", "operatingCashFlow", "cash"].includes(row.key),
                )
              : remaining;
          const extra =
            key === "business"
              ? remaining.filter(
                  (row) =>
                    !["revenue", "operatingCashFlow", "cash"].includes(row.key),
                )
              : [];
          return (
            <React.Fragment key={`mobile-${key}`}>
              {(core.length > 0 || extra.length > 0) && (
                <article
                  className={`${s.panel} ${s.mobileEvidence} ${key === "business" ? s.businessStrip : ""}`}
                >
                  <h3>{name}</h3>
                  {renderRows(core, key)}
                  {extra.length > 0 && (
                    <DetailDialog
                      title={`${name} · all metrics`}
                      trigger={`View ${rows.length} metrics`}
                      wide
                    >
                      <div className={s.detailMetrics}>
                        {renderRows(rows, key, true)}
                      </div>
                    </DetailDialog>
                  )}
                </article>
              )}
            </React.Fragment>
          );
        })}
      {groups.map(({ name, key, icon: Icon, rows, tab }) => {
        const limit = key === "business" ? 5 : key === "technical" ? 3 : 4;
        const priorities =
          key === "business"
            ? ["revenue", "operatingCashFlow", "cash", "roe", "roa"]
            : key === "valuation"
              ? [
                  "TrailingPE",
                  "ForwardPE",
                  "EnterpriseValueRevenue",
                  "marketCap",
                ]
              : [];
        const ordered = [...rows].sort((a, b) => {
          const rank = (key: string) => {
            const i = priorities.indexOf(key);
            return i < 0 ? priorities.length : i;
          };
          return rank(a.key) - rank(b.key);
        });
        return (
          <React.Fragment key={key}>
            <article
              data-category={key}
              className={`${s.panel} ${s.desktopEvidence}`}
            >
              <header>
                <span className={s.icon}>
                  <Icon size={18} />
                </span>
                <h3>{name}</h3>
                <button aria-label={`Open ${name}`} onClick={() => onTab(tab)}>
                  <ArrowUpRight size={17} />
                </button>
              </header>
              {renderRows(ordered.slice(0, limit), key)}
              {ordered.length > limit && (
                <DetailDialog
                  title={`${name} · all metrics`}
                  trigger={`View ${ordered.length} metrics`}
                  wide
                >
                  <div className={s.detailMetrics}>
                    {renderRows(ordered, key, true)}
                  </div>
                </DetailDialog>
              )}
            </article>
          </React.Fragment>
        );
      })}
      <footer className={s.snapshot}>
        <Help label="Evidence dates">
          <p>Financial period: {dateLabel(evidence.period)}</p>
          <p>Price history: {dateLabel(research.history.at(-1)?.time)}</p>
          <p>
            Updated:{" "}
            {dateLabel(research.evidence?.updatedAt || research.retrievedAt)}
          </p>
          <p>
            Individual metrics retain their own reporting periods and sources.
          </p>
        </Help>
      </footer>
    </section>
  );
}
