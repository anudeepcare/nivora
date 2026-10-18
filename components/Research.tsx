"use client";
import { useMemo, useState, useRef, useLayoutEffect } from "react";
import { Bookmark, RefreshCw } from "lucide-react";
import type {
  Research as ResearchData,
  Candle,
  Company,
  Quote,
} from "@/lib/types";
import { perspective } from "@/lib/analysis";
import { restoreWhenReady, browserScrollEnvironment } from "@/lib/navigation";
import {
  ResearchOutlook,
  KeyFinancialMetrics,
  CaseHighlights,
} from "./ResearchOverview";
import { amount, percent, dateLabel, quoteTime } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import { SecurityLogo, Help, Notice, Empty, DataStamp } from "./Ui";
import { PriceChart } from "./Charts";
import Financials from "./FinancialPicture";
import { TechnicalPicture, ThesisPicture } from "./ResearchDetails";
import { groupHistory } from "@/lib/chart-period";
import DecisionBrief from "./DecisionBrief";
const tabs = [
  "Snapshot",
  "Financials",
  "Valuation",
  "Technicals",
  "Thesis",
] as const;
const ranges = ["1D", "1W", "1M", "6M", "1Y", "5Y"] as const;
export default function Research({ symbol }: { symbol: string }) {
  const { demo, workspace, mutate } = useProduct();
  const resource = useResource<ResearchData>(
      `research/${encodeURIComponent(symbol.replace("/", "-"))}`,
      demo?.research[symbol],
      300000,
    ),
    r = resource.data;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Snapshot"),
    [range, setRange] = useState<(typeof ranges)[number]>("1Y"),
    [style, setStyle] = useState<"line" | "candles">("line"),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false),
    [frequency, setFrequency] = useState<"Daily" | "Weekly" | "Monthly">(
      "Daily",
    );
  const tabOffsets = useRef(new Map<string, number>());
  const pendingTab = useRef<number | null>(null);
  const switchTab = (next: (typeof tabs)[number]) => {
    if (next === tab) return;
    tabOffsets.current.set(tab, window.scrollY);
    pendingTab.current = tabOffsets.current.get(next) ?? 0;
    setTab(next);
  };
  useLayoutEffect(() => {
    if (pendingTab.current == null) return;
    const top = pendingTab.current;
    pendingTab.current = null;
    return restoreWhenReady(top, browserScrollEnvironment());
  }, [tab]);
  const intraday = range === "1D" || range === "1W";
  const demoShort = useMemo(
    () => (demo && r ? { candles: rangeBars(r.history, range) } : undefined),
    [demo, r, range],
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
        : r
          ? rangeBars(r.history, range)
          : [],
    [intraday, short.data, r, range],
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
        <header className="page-head security-head">
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
        title="Research is unavailable"
        action={
          <button className="button" onClick={resource.refresh}>
            Try again
          </button>
        }
      >
        {resource.error || "Search for another instrument."}
      </Empty>
    );
  }
  const crypto = r.company.assetType === "crypto",
    saved = workspace?.watchlist.some((x) => x.symbol === symbol),
    visible = crypto
      ? tabs.filter((x) => ["Snapshot", "Technicals", "Thesis"].includes(x))
      : tabs;
  const chart = (
    <section className="plot-section">
      <header className="row between chart-head">
        <h3>Price</h3>
        <div className="ranges" aria-label="Chart period">
          {ranges.map((x) => (
            <button
              key={x}
              aria-pressed={range === x}
              onClick={() => {
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
        <PriceChart
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
            Line
          </button>
          <button
            aria-pressed={style === "candles"}
            onClick={() => setStyle("candles")}
          >
            Candles
          </button>
        </div>
      </div>
    </section>
  );
  return (
    <article className="research-page">
      <header className="page-head security-head">
        <div className="identity">
          <SecurityLogo symbol={symbol} size={52} />
          <div>
            <h1>{r.company.name}</h1>
            <p className="muted small">
              {symbol} · {r.company.exchange || "Listing"} · {r.quote.currency}
            </p>
          </div>
        </div>
        <div className="row quote-actions gap24">
          <div className="quote">
            <strong className="num">
              {amount(r.quote.price, r.quote.currency)}
            </strong>
            <span
              className={
                r.quote.changePct == null || r.quote.changePct === 0
                  ? ""
                  : r.quote.changePct < 0
                    ? "au-negative"
                    : "au-positive"
              }
            >
              {percent(r.quote.changePct, true)}
            </span>
            <DataStamp
              source={r.quote.source}
              asOf={r.quote.asOf}
              status={r.quote.stale ? "Older quote" : r.quote.session}
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
      <nav
        className="local-tabs"
        role="tablist"
        aria-label="Research sections"
        style={{
          gridTemplateColumns: `repeat(${visible.length},minmax(0,1fr))`,
        }}
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
            return;
          e.preventDefault();
          const index =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? visible.length - 1
                : (visible.indexOf(tab) +
                    (e.key === "ArrowRight" ? 1 : -1) +
                    visible.length) %
                  visible.length;
          switchTab(visible[index]);
          (e.currentTarget.children[index] as HTMLButtonElement).focus();
        }}
      >
        {visible.map((name) => (
          <button
            role="tab"
            id={`tab-${name}`}
            className={tab === name ? "active" : ""}
            aria-selected={tab === name}
            aria-pressed={tab === name}
            aria-controls="research-content"
            tabIndex={tab === name ? 0 : -1}
            key={name}
            onClick={() => switchTab(name)}
          >
            {name === "Snapshot"
              ? "Overview"
              : name === "Valuation"
                ? "Value"
                : name}
          </button>
        ))}
      </nav>
      {notice && <Notice error>{notice}</Notice>}
      {resource.error && <Notice error>{resource.error}</Notice>}
      {r.issues.length > 0 && (
        <div className="coverage-note">
          <span>
            Some research data could not be loaded.{" "}
            <Help label="Research data status" trigger="Details">
              {r.issues.map((issue) => (
                <p key={issue}>{issue}</p>
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
      <div
        id="research-content"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="au-stack"
      >
        {tab === "Snapshot" && (
          <>
            <div className="research-layout">
              <div className="research-canvas">
                <DecisionBrief
                  research={r}
                  onDca={() => switchTab("Technicals")}
                />
                <div className="overview-dca">
                  <DcaCard research={r} compact />
                </div>
                {chart}
              </div>
              <ResearchOutlook research={r} />
            </div>
            <KeyFinancialMetrics research={r} />
            <CaseHighlights research={r} />
          </>
        )}
        {tab === "Financials" && (
          <>
            <Financials research={r} />
          </>
        )}
        {tab === "Valuation" && (
          <>
            <ResearchOutlook research={r} detailed />
          </>
        )}
        {tab === "Technicals" && (
          <>
            <header className="section-head">
              <div>
                <h2>Price structure</h2>
                <p>Chart interval · studies use completed daily prices.</p>
              </div>
              <div className="segments" aria-label="Chart interval">
                {(["Daily", "Weekly", "Monthly"] as const).map((v) => (
                  <button
                    key={v}
                    className={frequency === v ? "active" : ""}
                    aria-pressed={frequency === v}
                    onClick={() => {
                      setFrequency(v);
                      setRange(v === "Monthly" ? "5Y" : "1Y");
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </header>
            {chart}
            <TechnicalPicture
              research={r}
              dca={<DcaCard research={r} compact />}
            />
          </>
        )}
        {tab === "Thesis" && <ThesisPicture research={r} />}
      </div>
    </article>
  );
}
function rangeBars(history: Candle[], range: string) {
  const days: Record<string, number> = {
      "1D": 1,
      "1W": 7,
      "1M": 31,
      "6M": 183,
      "1Y": 366,
      "5Y": 1830,
    },
    end = Date.parse(history.at(-1)?.time ?? "");
  return history.filter(
    (b) => Date.parse(b.time) >= end - (days[range] ?? 366) * 86400000,
  );
}
export function DcaCard({
  research: r,
  compact = false,
}: {
  research: ResearchData;
  compact?: boolean;
}) {
  const p = useMemo(() => perspective(r), [r]),
    signal = p.dca.confirmed;
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
                ? `${month(signal.month)} · confirmed`
                : "24 complete months required"}
            </p>
          </div>
          <div className="pace-value num">
            {signal ? `${signal.multiplier}×` : "—"}
          </div>
        </div>
        <div className="pace-line" aria-label="Contribution multiplier scale">
          {[0, 1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`pace-zone ${signal?.multiplier === n ? "selected" : ""}`}
              aria-current={signal?.multiplier === n ? "step" : undefined}
            >
              {n}×
            </div>
          ))}
        </div>
        <div className="pace-history">
          {p.dca.history.slice(-4).map((x) => (
            <div key={x.month}>
              {new Date(x.month + "-01T12:00:00Z").toLocaleDateString("en-US", {
                month: "short",
                timeZone: "UTC",
              })}
              <b>{x.multiplier}×</b>
            </div>
          ))}
          <div>
            Now · forming
            <b>{p.dca.forming ? `${p.dca.forming.multiplier}×` : "—"}</b>
          </div>
        </div>
        <Help label="Monthly accumulation" trigger="How to read the multiplier">
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
            ? `${p.dca.forming.multiplier}× forming this month`
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
        <Help label="DCA multiplier">
          A multiple of your usual contribution, not leverage or a return
          forecast. AURYN’s original experimental rules use 24 completed monthly
          closes. 0× pauses new scheduled contributions; it is not a sell order.
          Stronger pullbacks can earn larger multipliers even in a deteriorating
          business. Review financial evidence before adding. The current month
          can change until it closes.
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
                  ? "Baseline pace"
                  : `${signal.multiplier === 4 ? "Deep" : signal.multiplier === 3 ? "Larger" : "Moderate"} pullback`}
          </h3>
          <small>
            {signal
              ? `Confirmed · ${month(signal.month)}`
              : "24 complete months required"}
          </small>
        </div>
      </div>
      <div className="au-dca-scale" aria-label="Contribution multiplier scale">
        {[0, 1, 2, 3, 4].map((n) => (
          <span
            key={n}
            aria-current={signal?.multiplier === n ? "step" : undefined}
            className={signal?.multiplier === n ? "active" : ""}
          >
            {n}×
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
              title={`${month(x.month)} · ${x.multiplier}×`}
            />
            <b>{x.multiplier}×</b>
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
            ? `${p.dca.forming.multiplier}× forming`
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
