"use client";
import { navigateSelection } from "@/lib/selection-navigation";
import { researchLenses, lensForSection } from "@/lib/reference-navigation";
import cockpit from "./ReferenceCockpit.module.css";
import ReferenceAtlas from "./ReferenceAtlas";
import ResearchWorkspace from "./ResearchWorkspace";
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
// Only the active lens downloads its evidence UI; no speculative provider requests.
const SentiSensePanels = dynamic(() => import("./SentiSensePanels"), {
  loading: () => <p role="status">Opening evidence…</p>,
});
const EventsLens = dynamic(
  () => import("./DirectResearchLenses").then((module) => module.EventsLens),
  {
    loading: () => <p role="status">Opening events…</p>,
  },
);
const IndicatorsLens = dynamic(
  () =>
    import("./DirectResearchLenses").then((module) => module.IndicatorsLens),
  {
    loading: () => <p role="status">Opening indicators…</p>,
  },
);
const ValueStudio = dynamic(() => import("./ValueStudio"), {
  loading: () => <p role="status">Opening valuation…</p>,
});
const OptionsDesk = dynamic(() => import("./OptionsDesk"), {
  loading: () => <p role="status">Opening options…</p>,
});

const FinancingContext = dynamic(() => import("./FinancingContext"), {
  loading: () => <p role="status">Loading…</p>,
});
const BusinessHistory = dynamic(() => import("./BusinessHistory"), {
  loading: () => <p role="status">Loading…</p>,
});
import { headerMarketContext } from "@/lib/business-history";
const BusinessMap = dynamic(() => import("./BusinessMap"), {
  loading: () => <p role="status">Loading…</p>,
});
const TimingContext = dynamic(() => import("./TimingContext"));
const DecisionWorkspace = dynamic(() => import("./DecisionWorkspace"));
const DecisionWatch = dynamic(() => import("./DecisionWatch"));
const ResearchNotes = dynamic(() => import("./ResearchNotes"), {
  loading: () => <p role="status">Opening saved research…</p>,
});
const CompanyBrief = dynamic(() => import("./CompanyBrief"), {
  loading: () => <p role="status">Opening export tools…</p>,
});
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
const Financials = dynamic(() => import("./FinancialPicture"), {
  loading: () => <p role="status">Loading…</p>,
});
const TechnicalPicture = dynamic(() =>
  import("./ResearchDetails").then((module) => module.TechnicalPicture),
);
const OwnershipPicture = dynamic(() => import("./OwnershipPicture"));
const Analyst = dynamic(() => import("./Analyst"));
import { groupHistory } from "@/lib/chart-period";
const DcaResearch = dynamic(() => import("./DcaResearch"), {
  loading: () => <p role="status">Loading…</p>,
});
import experience from "./IntegratedExperience.module.css";
import tabVisuals from "./ResearchTabVisuals.module.css";
import deskLayout from "./ResearchDeskLayout.module.css";
import { selectPriceReference } from "@/lib/price-reference";
import { movementContext } from "@/lib/movement-context";
import PaceHelp from "./PaceHelp";
import { paceCode } from "@/lib/pace-presentation";

import DecisionBrief from "./DecisionBrief";
const TargetsEstimates = dynamic(() => import("./TargetsEstimates"), {
  loading: () => <p role="status">Loading…</p>,
});
const AnalystRatings = dynamic(() => import("./AnalystRatings"), {
  loading: () => <p role="status">Loading…</p>,
});

const CongressDisclosures = dynamic(() => import("./CongressDisclosures"), {
  loading: () => <p role="status">Loading…</p>,
});
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
  "Pace",
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
  Snapshot: { label: "Decision atlas", icon: LayoutDashboard },
  Financials: { label: "Business", icon: Building2 },
  Valuation: { label: "Valuation", icon: Scale },
  Technicals: { label: "Technicals", icon: ChartCandlestick },
  Analysts: { label: "Targets & estimates", icon: Users },
  Options: { label: "Options", icon: Layers },
  Thesis: { label: "Case & ownership", icon: BriefcaseBusiness },
  News: { label: "News & earnings", icon: Newspaper },
  Advanced: { label: "Indicators & tools", icon: SlidersHorizontal },
  Pace: { label: "Pace", icon: ChartCandlestick },
};
function ResearchTabIcon({
  section,
}: {
  section: keyof typeof tabPresentation;
}) {
  const Icon = tabPresentation[section].icon;
  return <Icon size={16} aria-hidden="true" />;
}

export default function Research({ symbol }: { symbol: string }) {
  const { access } = useAccess();
  const workspacePreferences = useWorkspacePreferences();
  const congressionalHidden =
    workspacePreferences.preferences.hiddenSignals?.includes("congressional") ??
    false;
  const technicalsHidden =
    workspacePreferences.preferences.hiddenSignals?.includes("technicals") ??
    false;
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
    baseResearch ? `quotes?symbols=${encodeURIComponent(symbol)}` : null,
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
    if (demo || !baseResearch) return;
    return startQuotePolling(() => refreshQuote.current());
  }, [symbol, demo, baseResearch]);
  const live = useLivePrices([symbol], !!demo || !baseResearch);
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
  const researchNavigation = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const revealSelection = () => {
      const navigation = researchNavigation.current;
      const selected = navigation?.querySelector<HTMLElement>(
        '[aria-current="page"]',
      );
      if (!navigation || !selected) return;
      const frame = navigation.getBoundingClientRect();
      const item = selected.getBoundingClientRect();
      if (item.left < frame.left || item.right > frame.right)
        navigation.scrollLeft +=
          item.left - frame.left - (frame.width - item.width) / 2;
    };
    let mounted = true;
    const revealWhenReady = () => {
      if (mounted) revealSelection();
    };
    revealSelection();
    // Fonts and deferred route content can settle after the initial layout pass.
    const observer = new ResizeObserver(revealWhenReady);
    if (researchNavigation.current) {
      observer.observe(researchNavigation.current);
      for (const child of researchNavigation.current.children)
        observer.observe(child);
    }
    void document.fonts.ready.then(revealWhenReady);
    window.addEventListener("resize", revealWhenReady);
    return () => {
      mounted = false;
      observer.disconnect();
      window.removeEventListener("resize", revealWhenReady);
    };
  }, [tab, r?.company.symbol]);
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
      const content = document.getElementById("content");
      if (!navigation || !content) return;
      const top = navigation.getBoundingClientRect().top;
      const bounds = content.getBoundingClientRect();
      if (content.dataset.workspaceScroll === "true") {
        if (top < bounds.top || top > bounds.bottom - 100)
          content.scrollTo({
            top: content.scrollTop + top - bounds.top,
            behavior: "instant",
          });
      } else if (top < 72 || top > window.innerHeight - 100) {
        window.scrollTo({
          top: window.scrollY + top - 80,
          behavior: "instant",
        });
      }
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
          [
            "Snapshot",
            "Technicals",
            "Thesis",
            "News",
            "Advanced",
            "Pace",
          ].includes(x),
        )
      : tabs;
  const activeLens = lensForSection(tab)!;
  const availableLenses = researchLenses.filter((lens) =>
    lens.sections.some((section) => visible.includes(section)),
  );
  const supportingSections = activeLens.sections.filter((section) =>
    visible.includes(section),
  );
  const intervalControls =
    tab === "Technicals" ? (
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
    ) : undefined;
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
          controls={intervalControls}
          onOptions={undefined}
          bars={chartBars}
          range={frequency === "Daily" ? range : `${range} ${frequency}`}
          style={style}
          contrast={tab === "Snapshot"}
        />
      ) : (
        <>
          {intervalControls}
          <div className="chart-empty" role="status">
            {short.loading
              ? "Loading this period…"
              : short.error || "No observations in this period."}
          </div>
        </>
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
  const evidenceToolbar =
    supportingSections.length > 1 ? (
      <nav
        className={cockpit.supporting}
        data-selection-navigation
        onKeyDown={(event) => navigateSelection(event)}
        aria-label={`${activeLens.label} evidence`}
      >
        {supportingSections.map((section) => (
          <button
            key={section}
            aria-current={tab === section ? "page" : undefined}
            onClick={() => switchTab(section)}
          >
            <ResearchTabIcon section={section} />
            {tabPresentation[section].label}
          </button>
        ))}
      </nav>
    ) : null;
  return (
    <article
      className={`research-page approved-research-page ${cockpit.root}`}
      data-research-mode={preferences.detail}
      data-active-lens={activeLens.sections[0]}
    >
      <header className={experience.stockHeader}>
        <div className={experience.stockIdentity}>
          <SecurityLogo symbol={symbol} size={52} />
          <div>
            <h1>{r.company.name}</h1>
            <div className={cockpit.identityMeta}>
              <span>
                {symbol} · {r.company.exchange || "Listing"} ·{" "}
                {r.quote.currency}
              </span>
              {headerContext.sector && <span>{headerContext.sector}</span>}
              <Help label="Company facts and source dates">
                <StockFacts research={r} />
                {r.issues.map((issue) => (
                  <p key={issue}>{customerText(issue)}</p>
                ))}
                <button
                  className="button"
                  disabled={resource.loading}
                  onClick={resource.refresh}
                >
                  <RefreshCw size={17} aria-hidden="true" />
                  Refresh research data
                </button>
              </Help>
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
                <p>
                  Displayed price source:{" "}
                  {(headerReference?.basis === "settled-close"
                    ? r.historySource
                    : r.quote.source) || "not supplied"}
                  .
                  {headerReference?.basis === "settled-close" &&
                    " This is a completed daily close; its date is not an intraday timestamp."}
                </p>
              </Help>
            </span>
            <DataStamp
              source={
                headerReference?.basis === "settled-close"
                  ? r.historySource
                  : r.quote.source
              }
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

      {notice && <Notice error>{notice}</Notice>}
      {resource.error && <Notice error>{resource.error}</Notice>}
      <nav
        className={cockpit.lenses}
        aria-label="Research sections"
        ref={researchNavigation}
      >
        {availableLenses.map((lens) => (
          <button
            key={lens.label}
            data-section={lens.sections[0]}
            aria-current={activeLens.label === lens.label ? "page" : undefined}
            aria-controls={
              lens.sections[0] === "Snapshot"
                ? "research-overview"
                : "research-content"
            }
            onClick={() => switchTab(lens.sections[0])}
          >
            <ResearchTabIcon section={lens.sections[0]} />
            {lens.label}
          </button>
        ))}
      </nav>
      {evidenceToolbar}
      <div id="research-overview" hidden={tab !== "Snapshot"}>
        {retainedCharts.includes("Snapshot") && (
          <FeatureGate
            feature="overview"
            fallback={<FreeSnapshot research={r} />}
          >
            <ReferenceAtlas research={r} onTab={switchTab} />
            <div className={cockpit.primaryChart}>{chart}</div>
          </FeatureGate>
        )}
      </div>
      <section
        className={`signal-research-panel ${tabVisuals.root}`}
        data-research-section={tab}
        hidden={tab === "Snapshot"}
        aria-label={tabPresentation[tab].label}
      >
        <div
          id="research-content"
          className={`approved-evidence-body au-stack ${deskLayout.content}`}
          data-desk={tab}
        >
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
                  Pace: "technicals",
                } as const
              )[tab]
            }
            fallback={
              tab === "Snapshot" ? <FreeSnapshot research={r} /> : undefined
            }
          >
            {tab === "News" && (
              <EventsLens
                key={r.company.symbol}
                research={r}
                preview={!!demo}
              />
            )}
            {tab === "Advanced" && (
              <IndicatorsLens
                key={r.company.symbol}
                research={r}
                preview={!!demo}
              />
            )}
            {tab === "Options" && (
              <section aria-label="Company positioning">
                <ResearchWorkspace
                  key={`${r.company.symbol}-options-tools`}
                  label="Options research"
                  views={[
                    {
                      title: "Positioning & history",
                      content: (
                        <SentiSensePanels
                          symbol={r.company.symbol}
                          preview={!!demo}
                          group="options"
                        />
                      ),
                    },
                    {
                      title: "Chain, gamma & practice",
                      content: (
                        <OptionsDesk
                          key={r.company.symbol}
                          research={r}
                          preview={!!demo}
                        />
                      ),
                    },
                  ]}
                />
              </section>
            )}
            {tab === "Analysts" && (
              <ResearchWorkspace
                key={`${r.company.symbol}-analysts`}
                label="Analyst evidence"
                views={[
                  {
                    title: "Consensus & revisions",
                    content: (
                      <SentiSensePanels
                        group="analysts"
                        symbol={r.company.symbol}
                        preview={!!demo}
                      />
                    ),
                  },
                  {
                    title: "Estimates & model evidence",
                    content: (
                      <section aria-label="Separate estimates and model evidence">
                        <p className="small muted">
                          Separate source coverage and reporting periods. These
                          figures are not merged with the consensus feed.
                        </p>
                        <TargetsEstimates
                          research={r}
                          ratings={
                            <AnalystRatings research={r} hideConsensus />
                          }
                        />
                      </section>
                    ),
                  },
                ]}
              />
            )}
            {tab === "Financials" && (
              <section aria-label="Business evidence">
                <Financials research={r} />
                <ResearchWorkspace
                  key={`${r.company.symbol}-business-support`}
                  label="Additional business evidence"
                  views={[
                    {
                      title: "Operating history",
                      content: <BusinessHistory research={r} />,
                    },
                    {
                      title: "Funding & dilution",
                      content: <FinancingContext research={r} />,
                    },
                  ]}
                />
              </section>
            )}
            {tab === "Valuation" && (
              <ValueStudio research={r} preview={!!demo} />
            )}
            {tab === "Technicals" && technicalsHidden && (
              <section className={cockpit.preferenceNotice} role="status">
                <h2>Technical indicators are hidden</h2>
                <p>
                  Your research preference hides this evidence. It does not
                  change your access or the separate Pace calculation.
                </p>
                <button
                  className="button"
                  disabled={
                    workspacePreferences.saving || !workspacePreferences.ready
                  }
                  onClick={() =>
                    void workspacePreferences.save({
                      hiddenSignals:
                        workspacePreferences.preferences.hiddenSignals.filter(
                          (signal) => signal !== "technicals",
                        ),
                    })
                  }
                >
                  Show technical indicators
                </button>
                {workspacePreferences.error && (
                  <p role="alert">{workspacePreferences.error}</p>
                )}
                <a href="/settings">
                  Restore technical indicators in Settings →
                </a>
              </section>
            )}
            {access.features.technicals &&
              !technicalsHidden &&
              (tab === "Technicals" ||
                retainedCharts.includes("Technicals")) && (
                <section
                  data-retained-panel="Technicals"
                  hidden={tab !== "Technicals"}
                  className="au-stack"
                >
                  <TechnicalPicture
                    research={r}
                    dca={null}
                    chart={
                      <>
                        {chart}
                        <TimingContext research={r} />
                      </>
                    }
                  />
                </section>
              )}
            {tab === "Pace" && (
              <section
                className="au-stack"
                aria-label="Pace monthly price zones and historical evidence"
              >
                <DcaResearch research={r} />
              </section>
            )}
            {tab === "Thesis" && (
              <>
                <div
                  className={cockpit.ownershipGrid}
                  style={
                    congressionalHidden
                      ? { gridTemplateColumns: "minmax(0, 1fr)" }
                      : undefined
                  }
                >
                  <section aria-label="Institutional and insider evidence">
                    <SentiSensePanels
                      symbol={r.company.symbol}
                      preview={!!demo}
                      group="ownership"
                      supplementalOwnership={r}
                    />
                    {demo && <OwnershipPicture research={r} />}
                  </section>
                  {!congressionalHidden && (
                    <section aria-label="Congressional activity">
                      <CongressDisclosures
                        symbol={r.company.symbol}
                        preview={!!demo}
                      />
                    </section>
                  )}
                </div>
                <ResearchWorkspace
                  key={`${r.company.symbol}-ownership-context`}
                  label="Additional ownership evidence"
                  views={[
                    {
                      title: "Business context & assistant",
                      content: (
                        <>
                          <BusinessMap
                            key={r.company.symbol}
                            research={r}
                            preview={!!demo}
                          />
                          <Analyst research={r} compact />
                        </>
                      ),
                    },
                    {
                      title: "Evidence & alerts",
                      content: (
                        <>
                          <DecisionWorkspace
                            research={r}
                            onTab={switchTab}
                            part="detail"
                          />
                          <DecisionWatch key={r.company.symbol} research={r} />
                        </>
                      ),
                    },
                    {
                      title: "Notes & export",
                      content: (
                        <>
                          <FeatureGate feature="advanced">
                            <ResearchNotes research={r} />
                          </FeatureGate>
                          <CompanyBrief research={r} />
                        </>
                      ),
                    },
                  ]}
                />
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
        <span className="au-eyebrow">Monthly Pace · price only</span>
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
