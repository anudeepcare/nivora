"use client";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { customerText } from "@/lib/customer-language";
import { pacePeriods, PACE_LEVELS } from "@/lib/pace-presentation";
import PaceReadings from "./PaceReadings";
import { startQuotePolling } from "@/lib/quote-refresh";
import { FeatureGate, useAccess } from "./Access";
import FreeSnapshot from "./FreeSnapshot";
import type { Feature } from "@/lib/access-policy";
import StockFacts from "./StockFacts";
import {
  ResearchModeSwitch,
  useResearchPreferences,
} from "./ResearchPreferences";
import { researchTabTarget } from "@/lib/research-interaction";
import dynamic from "next/dynamic";
import useLivePrices from "./useLivePrices";
import { quoteHealth } from "@/lib/quote-health";
import { mergePriceTick } from "@/lib/live-price";
import {
  cachedQuotes,
  publishQuotes,
  subscribeQuotes,
} from "@/lib/shared-quotes";
import { retainResearchQuote } from "@/lib/research-quote";
const ResearchReceipt = dynamic(() => import("./ResearchReceipt"));
const ValueStudio = dynamic(() => import("./ValueStudio"), {
  loading: () => <p role="status">Opening valuation…</p>,
});
const OptionsDesk = dynamic(() => import("./OptionsDesk"), {
  loading: () => <p role="status">Opening options…</p>,
});
const AdvancedResearch = dynamic(() => import("./AdvancedResearch"), {
  loading: () => (
    <p role="status" aria-busy="true">
      Loading advanced research…
    </p>
  ),
});

import FinancingContext from "./FinancingContext";
import BusinessHistory from "./BusinessHistory";
import { headerMarketContext } from "@/lib/business-history";
import BusinessMap from "./BusinessMap";
import TimingContext from "./TimingContext";
import DecisionWorkspace from "./DecisionWorkspace";
import DecisionWatch from "./DecisionWatch";
import { useMemo, useState, useRef, useLayoutEffect, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bookmark,
  RefreshCw,
  LayoutDashboard,
  Building2,
  Scale,
  ChartCandlestick,
  Users,
  Newspaper,
  SlidersHorizontal,
  Layers,
  BriefcaseBusiness,
  LineChart,
} from "lucide-react";
import type {
  Research as ResearchData,
  Candle,
  Company,
  Quote,
} from "@/lib/types";
import { perspective } from "@/lib/analysis";
import { restoreWhenReady, browserScrollEnvironment } from "@/lib/navigation";
import { KeyFinancialMetrics, CaseHighlights } from "./ResearchOverview";
import { amount, percent, dateLabel, quoteTime } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import { SecurityLogo, Help, Notice, Empty, DataStamp } from "./Ui";
import PriceStudyChart from "./PriceStudyChart";
import Financials from "./FinancialPicture";
import { TechnicalPicture, ThesisPicture } from "./ResearchDetails";
import { groupHistory } from "@/lib/chart-period";
import EarningsReview from "./EarningsReview";
import ResearchNotes from "./ResearchNotes";
import CompanyBrief from "./CompanyBrief";
import DcaResearch from "./DcaResearch";
import DecisionOverview from "./IntegratedResearch";
import experience from "./IntegratedExperience.module.css";
import tabVisuals from "./ResearchTabVisuals.module.css";
import { selectPriceReference } from "@/lib/price-reference";
import { movementContext } from "@/lib/movement-context";
import PaceHelp from "./PaceHelp";
import { paceCode } from "@/lib/pace-presentation";
import EarningsWorkspace from "./EarningsWorkspace";
import DecisionBrief from "./DecisionBrief";
import TargetsEstimates from "./TargetsEstimates";
import AnalystRatings from "./AnalystRatings";
import CompanyUpdates from "./CompanyUpdates";
import CongressDisclosures from "./CongressDisclosures";
import OverviewContext from "./OverviewContext";
const tabs = [
  "Snapshot",
  "Thesis",
  "Financials",
  "Valuation",
  "Technicals",
  "Analysts",
  "News",
  "Advanced",
  "Options",
] as const;
const ranges = [
  "1D",
  "1W",
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "5Y",
  "ALL",
] as const;
const tabPresentation = {
  Snapshot: { label: "Overview", icon: LayoutDashboard },
  Financials: { label: "Business", icon: Building2 },
  Valuation: { label: "Valuation", icon: Scale },
  Technicals: { label: "Technicals", icon: ChartCandlestick },
  Analysts: { label: "Targets & estimates", icon: Users },
  Options: { label: "Options", icon: Layers },
  Thesis: { label: "Case & ownership", icon: BriefcaseBusiness },
  News: { label: "News & earnings", icon: Newspaper },
  Advanced: { label: "Advanced", icon: SlidersHorizontal },
};
export default function Research({ symbol }: { symbol: string }) {
  const { access } = useAccess();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const workspacePreferences = useWorkspacePreferences();
  const rangeTouched = useRef(false);
  const { preferences } = useResearchPreferences();
  const requestedTab = useSearchParams().get("tab");
  const { demo, workspace, mutate, reduceMotion, cache } = useProduct();
  const [, sharedRevision] = useState(0);
  useEffect(
    () =>
      subscribeQuotes(cache, (symbols) => {
        if (symbols.includes(symbol)) sharedRevision((n) => n + 1);
      }),
    [cache, symbol],
  );
  const resource = useResource<ResearchData>(
      `research/${encodeURIComponent(symbol.replace("/", "-"))}`,
      demo?.research[symbol],
      300000,
    ),
    baseResearch = resource.data;
  const latestQuote = useResource<
    Record<string, { company: Company; quote: Quote }>
  >(
    `quotes?symbols=${encodeURIComponent(symbol)}`,
    demo
      ? ({
          [symbol]: {
            company: demo.research[symbol]?.company,
            quote: demo.research[symbol]?.quote,
          },
        } as Record<string, { company: Company; quote: Quote }>)
      : undefined,
    60000,
  );
  const refreshQuote = useRef(latestQuote.refresh);
  refreshQuote.current = latestQuote.refresh;
  useEffect(() => {
    if (demo) return;
    return startQuotePolling(() => refreshQuote.current());
  }, [symbol, demo]);
  const live = useLivePrices([symbol], !!demo);
  const retainedQuote = useRef<{ symbol: string; quote: Quote | undefined }>({
    symbol,
    quote: undefined,
  });
  const priorQuote =
    retainedQuote.current.symbol === symbol
      ? retainedQuote.current.quote
      : undefined;
  const observedRest = retainResearchQuote(
    retainResearchQuote(priorQuote, baseResearch?.quote),
    retainResearchQuote(
      latestQuote.data?.[symbol]?.quote,
      cachedQuotes(cache, [symbol])[symbol]?.quote,
    ),
  );
  const restQuote = quoteHealth(
    latestQuote.error && observedRest
      ? { ...observedRest, stale: true }
      : observedRest,
  );
  const streamedQuote = live.ticks[symbol]
    ? mergePriceTick(restQuote, {
        ...live.ticks[symbol],
        session: live.connected
          ? live.ticks[symbol].session
          : "Last streamed trade · reconnecting",
      })
    : restQuote;
  const currentQuote = quoteHealth(
    retainResearchQuote(observedRest, streamedQuote),
  );
  retainedQuote.current = { symbol, quote: currentQuote };
  useEffect(() => {
    if (!demo && currentQuote && baseResearch?.company)
      publishQuotes(cache, {
        [symbol]: { company: baseResearch.company, quote: currentQuote },
      });
  }, [cache, demo, symbol, currentQuote, baseResearch?.company]);
  const r = useMemo(
    () =>
      baseResearch &&
      currentQuote &&
      (baseResearch.quote.price == null ||
        Date.parse(currentQuote.asOf || "") >=
          Date.parse(baseResearch.quote.asOf || ""))
        ? {
            ...baseResearch,
            quote: currentQuote,
            priceObservedAt: demo
              ? baseResearch.retrievedAt
              : new Date().toISOString(),
          }
        : baseResearch,
    [baseResearch, currentQuote, demo],
  );
  const [tab, setTab] = useState<(typeof tabs)[number]>(
      () =>
        tabs.find(
          (t) =>
            t ===
            (requestedTab ?? cache?.get(`view:research:${symbol}:tab`)?.value),
        ) ?? "Snapshot",
    ),
    [range, setRange] = useState<(typeof ranges)[number]>("1Y"),
    [style, setStyle] = useState<"line" | "candles">("line"),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false),
    [frequency, setFrequency] = useState<"Daily" | "Weekly" | "Monthly">(
      "Daily",
    );
  useEffect(() => {
    if (
      workspacePreferences.ready &&
      !rangeTouched.current &&
      ranges.includes(
        workspacePreferences.preferences.chartRange as (typeof ranges)[number],
      )
    )
      setRange(
        workspacePreferences.preferences.chartRange as (typeof ranges)[number],
      );
  }, [workspacePreferences.ready, workspacePreferences.preferences.chartRange]);
  const [retainedCharts, setRetainedCharts] = useState<string[]>(() =>
    tab === "Snapshot" || tab === "Technicals" ? [tab] : [],
  );
  // Same-company links update the route without remounting this component.
  useEffect(() => {
    const next = tabs.find((value) => value === requestedTab);
    if (!next) return;
    setTab(next);
    if (next === "Snapshot" || next === "Technicals")
      setRetainedCharts((old) => (old.includes(next) ? old : [...old, next]));
  }, [requestedTab]);
  const [workbenchTarget, setWorkbenchTarget] = useState("risk");
  const researchNavigation = useRef<HTMLElement>(null);
  const switchTab = (next: (typeof tabs)[number]) => {
    if (next === "Technicals" || next === "Snapshot")
      setRetainedCharts((old) => (old.includes(next) ? old : [...old, next]));
    setTab(next);
    cache.set(`view:research:${symbol}:tab`, { at: Date.now(), value: next });
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
    requestAnimationFrame(() => {
      const navigation = researchNavigation.current;
      const top = navigation?.getBoundingClientRect().top;
      const headerHeight =
        document.querySelector("[data-shell] > header")?.getBoundingClientRect()
          .height ?? 72;
      if (
        navigation &&
        top != null &&
        (top < headerHeight || top > window.innerHeight - 100)
      )
        window.scrollTo({
          top: window.scrollY + top - headerHeight - 8,
          behavior: "instant",
        });
    });
  };
  const intraday = range === "1D" || range === "1W";
  const history = r?.history;
  const demoShort = useMemo(
    () =>
      demo && history ? { candles: rangeBars(history, range) } : undefined,
    [demo, history, range],
  );
  const short = useResource<{ candles: Candle[]; source?: string }>(
    intraday
      ? `chart/${encodeURIComponent(symbol.replace("/", "-"))}?range=${range}`
      : null,
    demoShort,
    60000,
  );
  const bars = useMemo(
    () =>
      intraday
        ? (short.data?.candles ?? [])
        : history
          ? rangeBars(history, range)
          : [],
    [intraday, short.data, history, range],
  );
  const chartBars = useMemo(
    () => (frequency === "Daily" ? bars : groupHistory(bars, frequency)),
    [bars, frequency],
  );
  const p = useMemo(() => (r ? perspective(r) : null), [r]);
  const quickDemo = useMemo(
    () =>
      demo?.research[symbol]
        ? {
            [symbol]: {
              company: demo.research[symbol].company,
              quote: demo.research[symbol].quote,
            },
          }
        : undefined,
    [demo, symbol],
  );
  const quick = useResource<Record<string, { company: Company; quote: Quote }>>(
    !r ? `quotes?symbols=${encodeURIComponent(symbol)}` : null,
    quickDemo,
  );
  async function save() {
    setSaving(true);
    setNotice("");
    try {
      await mutate({
        op: workspace?.watchlist.some((x) => x.symbol === symbol)
          ? "unwatch"
          : "watch",
        symbol,
      });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not update watchlist.");
    } finally {
      setSaving(false);
    }
  }
  if (!r || !p) {
    const q = quick.data?.[symbol];
    return resource.loading ? (
      <section aria-busy="true" className="research-loading">
        <header className={experience.stockHeader}>
          <div className="au-flex">
            <SecurityLogo symbol={symbol} />
            <div>
              <h1>{q?.company.name ?? symbol}</h1>
              <small>Loading research</small>
            </div>
          </div>
          <div className="au-price">
            {q ? amount(q.quote.price, q.quote.currency) : "—"}
          </div>
        </header>
        <div className="skeleton insights" />
        <div className="skeleton plot" />
      </section>
    ) : (
      <Empty
        title={`Open ${symbol} research`}
        action={
          <button className="button" onClick={resource.refresh}>
            Try again
          </button>
        }
      >
        {resource.error ||
          "Refresh the sources or confirm the exchange listing in search."}
      </Empty>
    );
  }
  const crypto = r.company.assetType === "crypto",
    saved = workspace?.watchlist.some((x) => x.symbol === symbol),
    visible = crypto
      ? tabs.filter((x) =>
          ["Snapshot", "Technicals", "Thesis", "News", "Advanced"].includes(x),
        )
      : tabs;
  const coreSections = visible.filter(
    (key) => key !== "Options" && key !== "Advanced",
  );
  const labSections = visible.filter(
    (key) => key === "Options" || key === "Advanced",
  );
  const chart = (
    <section className="plot-section">
      <header className="row between chart-head">
        <h3>
          <LineChart size={18} aria-hidden="true" /> Price history
        </h3>
        <div className="ranges" aria-label="Chart period">
          {ranges.map((x) => (
            <button
              key={x}
              aria-pressed={range === x}
              onClick={() => {
                rangeTouched.current = true;
                setRange(x);
                if (x === "1D" || x === "1W") setFrequency("Daily");
              }}
            >
              {x}
            </button>
          ))}
        </div>
      </header>
      {bars.length ? (
        <PriceStudyChart
          research={r}
          onOptions={undefined}
          bars={chartBars}
          range={frequency === "Daily" ? range : `${range} ${frequency}`}
          style={style}
          contrast={tab === "Snapshot"}
        />
      ) : (
        <div className="chart-empty" role="status">
          {short.loading
            ? "Loading this period…"
            : short.error || "No observations in this period."}
        </div>
      )}
      <div className="chart-note">
        <DataStamp
          source={
            intraday
              ? (short.data?.source ?? "Price history")
              : (r.historySource ?? "Price history")
          }
          asOf={bars.at(-1)?.time}
          status={intraday ? "Intraday history" : undefined}
        />
        <div className="segments">
          <button
            aria-pressed={style === "line"}
            onClick={() => setStyle("line")}
          >
            <LineChart size={15} aria-hidden="true" /> Line
          </button>
          <button
            aria-pressed={style === "candles"}
            onClick={() => setStyle("candles")}
          >
            <ChartCandlestick size={15} aria-hidden="true" /> Candles
          </button>
        </div>
      </div>
    </section>
  );
  const headerReference = selectPriceReference(
    r,
    demo ? Date.parse(r.retrievedAt) : Date.now(),
  );
  const headerMovement = movementContext(r, [], {
    now: demo ? Date.parse(r.retrievedAt) : Date.now(),
  });
  const headerContext = headerMarketContext(r);
  return (
    <article
      className="research-page approved-research-page"
      data-research-mode={preferences.detail}
    >
      <header className={experience.stockHeader}>
        <div className={experience.stockIdentity}>
          <SecurityLogo symbol={symbol} size={52} />
          <div>
            <h1>{r.company.name}</h1>
            <p className="muted small">
              {symbol} · {r.company.exchange || "Listing"} · {r.quote.currency}
            </p>
            <div className="security-context">
              {headerContext.sector && <span>{headerContext.sector}</span>}
            </div>
          </div>
        </div>
        <div className={experience.stockPrice}>
          <div className="quote">
            <strong className="num">
              {amount(
                headerReference?.price ?? r.quote.price,
                r.quote.currency,
              )}
            </strong>
            <span
              className={
                headerMovement.change == null || headerMovement.change === 0
                  ? ""
                  : headerMovement.change < 0
                    ? "au-negative"
                    : "au-positive"
              }
            >
              <span className="sr-only">Session change </span>
              {percent(headerMovement.change, true)}
              <Help label="How this price change is calculated">
                <p>
                  {headerMovement.priceBasis === "settled-close"
                    ? `This change compares completed daily closes${headerMovement.changeFrom ? ` against ${dateLabel(headerMovement.changeFrom)}` : ""}. It does not describe a live trading-session move.`
                    : "This change follows the quote source’s session comparison. The quote’s session and timestamp appear below the price; extended-hours and regular-session comparisons can differ."}
                </p>
              </Help>
            </span>
            <DataStamp
              source={r.quote.source}
              asOf={headerReference?.asOf ?? r.quote.asOf}
              status={
                headerReference?.basis === "settled-close"
                  ? "Latest close"
                  : r.quote.stale
                    ? "Older quote"
                    : r.quote.session
              }
            />
          </div>
          <button
            className="icon-button"
            aria-label={saved ? "Remove from watchlist" : "Save to watchlist"}
            aria-pressed={saved}
            disabled={saving}
            onClick={save}
          >
            <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </header>
      <StockFacts research={r} />
      {receiptOpen && (
        <ResearchReceipt research={r} onClose={() => setReceiptOpen(false)} />
      )}

      {notice && <Notice error>{notice}</Notice>}
      {resource.error && <Notice error>{resource.error}</Notice>}
      {r.issues.length > 0 && (
        <div className="coverage-note">
          <span>
            Source coverage{" "}
            <Help label="Research data status" trigger="Details">
              {r.issues.map((issue) => (
                <p key={issue}>{customerText(issue)}</p>
              ))}
            </Help>
          </span>
          <button
            className="icon-button"
            aria-label="Retry data sources"
            disabled={resource.loading}
            onClick={resource.refresh}
          >
            <RefreshCw size={17} />
          </button>
        </div>
      )}
      <label className={experience.researchPicker}>
        Research section
        <select
          value={tab}
          onChange={(e) => switchTab(e.target.value as (typeof tabs)[number])}
        >
          {coreSections.map((key) => (
            <option key={key} value={key}>
              {tabPresentation[key].label}
            </option>
          ))}
          {labSections.length > 0 && (
            <option
              value={
                labSections.includes(tab)
                  ? tab
                  : labSections.includes("Options")
                    ? "Options"
                    : labSections[0]
              }
            >
              Labs
            </option>
          )}
        </select>
      </label>
      <nav
        className={experience.researchNav}
        aria-label="Research sections"
        ref={researchNavigation}
      >
        {coreSections.map((key) => {
          const Icon = tabPresentation[key].icon;
          return (
            <button
              key={key}
              data-section={key}
              aria-current={tab === key ? "page" : undefined}
              aria-controls={
                key === "Snapshot" ? "research-overview" : "research-content"
              }
              onClick={() => switchTab(key)}
            >
              <Icon size={16} />
              {tabPresentation[key].label}
            </button>
          );
        })}
        {labSections.length > 0 && (
          <button
            data-section="Labs"
            aria-current={labSections.includes(tab) ? "page" : undefined}
            aria-controls="research-content"
            onClick={() =>
              switchTab(
                labSections.includes(tab)
                  ? tab
                  : labSections.includes("Options")
                    ? "Options"
                    : labSections[0],
              )
            }
          >
            <Layers size={16} /> Labs
          </button>
        )}
      </nav>
      <div id="research-overview" hidden={tab !== "Snapshot"}>
        {retainedCharts.includes("Snapshot") && (
          <FeatureGate
            feature="overview"
            fallback={<FreeSnapshot research={r} />}
          >
            <DecisionOverview
              key={r.company.symbol}
              research={r}
              onTab={switchTab}
              chart={chart}
            />
          </FeatureGate>
        )}
      </div>
      <section
        className={`signal-research-panel ${tabVisuals.root}`}
        data-research-section={tab}
        hidden={tab === "Snapshot"}
        aria-label={tabPresentation[tab].label}
      >
        <div id="research-content" className="approved-evidence-body au-stack">
          {labSections.includes(tab) && (
            <nav className={experience.labViews} aria-label="Labs views">
              {labSections.map((key) => (
                <button
                  key={key}
                  aria-current={tab === key ? "page" : undefined}
                  onClick={() => switchTab(key)}
                >
                  {key === "Advanced" ? "Research tools" : "Options"}
                </button>
              ))}
            </nav>
          )}
          <FeatureGate
            feature={
              (
                {
                  Snapshot: "overview",
                  Thesis: "business",
                  Financials: "financials",
                  Valuation: "value",
                  Technicals: "technicals",
                  Analysts: "analysts",
                  News: "news",
                  Advanced: "advanced",
                  Options: "options",
                } as const
              )[tab]
            }
            fallback={
              tab === "Snapshot" ? <FreeSnapshot research={r} /> : undefined
            }
          >
            {tab === "News" && (
              <>
                <CompanyUpdates research={r} preview={!!demo} />
                <EarningsReview research={r} />
                <details className="research-reference">
                  <summary>Earnings history &amp; estimates</summary>
                  <EarningsWorkspace research={r} />
                </details>
              </>
            )}
            {tab === "Advanced" && (
              <>
                <CongressDisclosures
                  symbol={r.company.symbol}
                  preview={!!demo}
                />
                <AdvancedResearch
                  key={r.company.symbol}
                  research={r}
                  initialSection={workbenchTarget}
                />
              </>
            )}
            {tab === "Options" && (
              <OptionsDesk
                key={r.company.symbol}
                research={r}
                preview={!!demo}
              />
            )}
            {tab === "Analysts" && (
              <>
                <TargetsEstimates research={r} />
                <AnalystRatings research={r} hideConsensus />
              </>
            )}
            {tab === "Financials" && (
              <>
                <Financials research={r} />
                <BusinessHistory research={r} />
                <FinancingContext research={r} />
                <button
                  className="text-link"
                  onClick={() => setReceiptOpen(true)}
                >
                  Metric formulas &amp; sources
                </button>
              </>
            )}
            {tab === "Valuation" && (
              <ValueStudio
                research={r}
                onWorkbench={() => {
                  setWorkbenchTarget("expectations");
                  switchTab("Advanced");
                }}
              />
            )}
            {access.features.technicals &&
              retainedCharts.includes("Technicals") && (
                <section
                  data-retained-panel="Technicals"
                  hidden={tab !== "Technicals"}
                  className="au-stack"
                >
                  <header className="section-head">
                    <div>
                      <h2>Technicals</h2>
                      <p>
                        Trend, momentum, participation and risk. Studies use
                        completed daily prices.
                      </p>
                    </div>
                    <div className="segments" aria-label="Chart interval">
                      {(["Daily", "Weekly", "Monthly"] as const).map((v) => (
                        <button
                          key={v}
                          className={frequency === v ? "active" : ""}
                          aria-pressed={frequency === v}
                          onClick={() => {
                            setFrequency(v);
                            rangeTouched.current = true;
                            setRange(v === "Monthly" ? "5Y" : "1Y");
                          }}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </header>
                  {p && (
                    <section
                      className="technical-pace"
                      aria-label="AURYN Pace price evidence"
                    >
                      <div>
                        <span className="eyebrow">AURYN PACE</span>
                        <strong>Your price-based accumulation reading</strong>
                        <PaceHelp trigger="What does P mean?" />
                      </div>
                      <PaceReadings
                        readings={pacePeriods({
                          ...p.dca.confirmed,
                          forming: p.dca.forming,
                        })}
                      />
                    </section>
                  )}
                  <div className="technical-canvas-layout">
                    <div className="technical-chart-column">
                      {chart}
                      <TimingContext research={r} />
                    </div>
                    <TechnicalPicture research={r} dca={null} />
                  </div>
                  <details className="value-personal-model">
                    <summary>
                      Monthly price zones and historical policy evidence
                    </summary>
                    <DcaResearch research={r} />
                  </details>
                </section>
              )}
            {tab === "Thesis" && (
              <>
                <BusinessHistory research={r} />
                <ThesisPicture research={r} />
                <BusinessMap key={r.company.symbol} research={r} />
                <details className="edge-method">
                  <summary>How the business is assessed</summary>
                  <DecisionWorkspace
                    research={r}
                    onTab={switchTab}
                    part="detail"
                  />
                  <DecisionWatch key={r.company.symbol} research={r} />
                </details>
                <details className="research-reference">
                  <summary>Notes &amp; saved research</summary>
                  <FeatureGate feature="advanced">
                    <ResearchNotes research={r} />
                  </FeatureGate>
                  <CompanyBrief research={r} />
                </details>
              </>
            )}
          </FeatureGate>
        </div>
      </section>
    </article>
  );
}
function rangeBars(history: Candle[], range: string) {
  const days: Record<string, number> = {
      "1D": 1,
      "1W": 7,
      "1M": 31,
      "3M": 92,
      "6M": 183,
      "1Y": 366,
      "5Y": 1830,
    },
    end = Date.parse(history.at(-1)?.time ?? "");
  const start =
    range === "ALL"
      ? -Infinity
      : range === "YTD"
        ? Date.UTC(new Date(end).getUTCFullYear(), 0, 1)
        : end - (days[range] ?? 366) * 86400000;
  return history.filter((b) => Date.parse(b.time) >= start);
}
export function DcaCard({
  research: r,
  compact = false,
}: {
  research: ResearchData;
  compact?: boolean;
}) {
  const p = useMemo(() => perspective(r), [r]),
    signal = p.dca.confirmed ?? p.dca.forming,
    confirmed = p.dca.confirmed != null;
  const tone = !signal
    ? "neutral"
    : signal.multiplier === 0
      ? "caution"
      : signal.multiplier === 1
        ? "neutral"
        : "positive";
  const month = (value: string) =>
    new Date(value + "-01T12:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  if (compact)
    return (
      <section
        className="pace"
        aria-label="Monthly accumulation signal"
        data-tone={tone}
      >
        <div className="pace-title">
          <div>
            <h3>Monthly accumulation</h3>
            <p className="muted small">
              {signal
                ? `${month(signal.month)} · ${confirmed ? "confirmed" : "forming"}`
                : "24 complete months required"}
            </p>
          </div>
          <div className="pace-value num">
            {signal ? paceCode(signal.multiplier) : "—"}
          </div>
        </div>
        <p className="small muted pace-summary">
          {signal
            ? signal.multiplier === 0
              ? "P0 price-extension pause: pause new contributions; this is not a sell signal."
              : signal.multiplier === 1
                ? "P1 watch zone: no contribution amount is assigned until an accumulation zone is established."
                : `P${signal.multiplier} ${PACE_LEVELS[signal.multiplier].toLowerCase()}: ${signal.multiplier === 2 ? "1×" : signal.multiplier === 3 ? "2×" : "up to 4×"} your planned contribution only when the business qualifies.`
            : "A confirmed contribution zone needs more completed monthly history."}{" "}
          {!confirmed && signal
            ? "This current reading is provisional until month-end."
            : ""}{" "}
          This measures price conditions, not buying activity or business
          quality.
        </p>
        <div className="pace-line" aria-label="AURYN Pace level scale">
          {[0, 1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`pace-zone ${signal?.multiplier === n ? "selected" : ""}`}
              aria-current={signal?.multiplier === n ? "step" : undefined}
            >
              P{n}
            </div>
          ))}
        </div>
        <div className="pace-history">
          {p.dca.history.slice(-6).map((x) => (
            <div key={x.month}>
              {new Date(x.month + "-01T12:00:00Z").toLocaleDateString("en-US", {
                month: "short",
                timeZone: "UTC",
              })}
              <b>{paceCode(x.multiplier)}</b>
            </div>
          ))}
          <div>
            Now · forming
            <b>{p.dca.forming ? paceCode(p.dca.forming.multiplier) : "—"}</b>
          </div>
        </div>
        <Help
          label="Monthly accumulation"
          trigger="What P means and how Pace works"
        >
          <p>
            A multiple of your usual contribution, not leverage or a return
            forecast. The confirmed zone uses completed monthly observations.
            The forming month can change until it closes.
          </p>
          <p>
            {signal?.reason ?? p.dca.reason} This original price-only experiment
            does not determine business quality, fair value or position size. 0×
            pauses contributions; it is not a sell order.
          </p>
        </Help>
        <span className="forming-label">
          {p.dca.forming
            ? `P${p.dca.forming.multiplier} forming this month`
            : "Current month awaits settled closes"}
        </span>
      </section>
    );
  return (
    <aside
      className="au-panel au-dca"
      data-tone={tone}
      aria-label="Monthly accumulation signal"
    >
      <div className="au-between au-dca-top">
        <span className="au-eyebrow">Monthly DCA · price only</span>
        <Help label="AURYN Pace zones">
          P1 means Watch/Hold; P2 starts small, P3 builds gradually and P4 marks
          a deep price zone. Business checks must qualify before buying. These
          are accumulation zones, not purchase multiples or a return forecast.
          Monthly readings compare price with preceding completed history; the
          current month can change until it closes. P0 pauses new buying and is
          not a sell order.
        </Help>
      </div>
      <div className="au-dca-reading">
        <div className="au-dca-number">
          {signal ? signal.multiplier : "—"}
          {signal && <span>×</span>}
        </div>
        <div>
          <h3>
            {!signal
              ? "History needed"
              : signal.multiplier === 0
                ? "Pause contributions"
                : signal.multiplier === 1
                  ? "Watch zone"
                  : PACE_LEVELS[signal.multiplier]}
          </h3>
          <small>
            {signal
              ? `${confirmed ? "Confirmed" : "Forming"} · ${month(signal.month)}`
              : "24 complete months required"}
          </small>
        </div>
      </div>
      <div className="au-dca-scale" aria-label="AURYN Pace level scale">
        {[0, 1, 2, 3, 4].map((n) => (
          <span
            key={n}
            aria-current={signal?.multiplier === n ? "step" : undefined}
            className={signal?.multiplier === n ? "active" : ""}
          >
            P{n}
          </span>
        ))}
      </div>
      <div
        className="au-dca-history"
        aria-label="Last six confirmed monthly signals"
      >
        {p.dca.history.slice(-6).map((x) => (
          <div key={x.month}>
            <span
              style={{ height: `${12 + x.multiplier * 7}px` }}
              data-zone={x.multiplier}
              title={`${month(x.month)} · ${paceCode(x.multiplier)}`}
            />
            <b>{paceCode(x.multiplier)}</b>
            <small>
              {new Date(x.month + "-01T12:00:00Z").toLocaleDateString("en-US", {
                month: "short",
                timeZone: "UTC",
              })}
            </small>
          </div>
        ))}
      </div>
      <p className="au-caption">{signal?.reason ?? p.dca.reason}</p>
      <div className="au-dca-forming">
        <span>Current month</span>
        <b>
          {p.dca.forming
            ? `P${p.dca.forming.multiplier} forming`
            : "Awaiting closes"}
        </b>
      </div>
      <p className="au-caption au-dca-business">
        {r.company.assetType === "crypto"
          ? "Corporate fundamentals do not apply."
          : `Business evidence: ${p.business.toLowerCase()}.`}{" "}
        A price zone does not establish value.
      </p>
    </aside>
  );
}
