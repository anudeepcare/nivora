"use client";
import { useMemo, useState } from "react";
import {
  Bookmark,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
} from "lucide-react";
import type {
  Research as ResearchData,
  Candle,
  Company,
  Quote,
} from "@/lib/types";
import { perspective } from "@/lib/analysis";
import { priceStudies } from "@/lib/price-studies";
import { expandedStudies } from "@/lib/technical-expanded";
import { weeklyStudies } from "@/lib/research-depth";
import { amount, percent, dateLabel, quoteTime } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import { SecurityLogo, Help, Notice, Empty, DataStamp } from "./Ui";
import { PriceChart } from "./Charts";
import Financials from "./Financials";
import DecisionBrief from "./DecisionBrief";
import { InvestmentCase, EarningsScenario } from "./ResearchSummary";
import Valuation from "./Valuation";
import TechnicalLevels from "./TechnicalLevels";
import { ProviderMetrics, Forecasts, ResearchThesis } from "./ResearchEvidence";
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
    [saving, setSaving] = useState(false);
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
        <header className="au-securityhead">
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
  const upcoming = r.evidence?.earnings
    .filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const chart = (
    <section className="au-panel">
      <header className="au-panel-head">
        <h2>Price history</h2>
        <div className="au-ranges" aria-label="Chart period">
          {ranges.map((x) => (
            <button
              key={x}
              aria-pressed={range === x}
              onClick={() => setRange(x)}
            >
              {x}
            </button>
          ))}
        </div>
      </header>
      {bars.length ? (
        <PriceChart bars={bars} range={range} style={style} />
      ) : (
        <div className="chart-empty" role="status">
          {short.loading
            ? "Loading this period…"
            : short.error || "No observations in this period."}
        </div>
      )}
      <div className="au-chart-foot">
        <DataStamp
          source={
            intraday
              ? (short.data?.source ?? "Price history")
              : (r.historySource ?? "Price history")
          }
          asOf={bars.at(-1)?.time}
          status={intraday ? "Intraday history" : undefined}
        />
        <div className="au-segment">
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
      <header className="au-securityhead">
        <div className="au-flex security-identity">
          <SecurityLogo symbol={symbol} size={52} />
          <div>
            <h1>{r.company.name}</h1>
            <p className="au-caption">
              {symbol} · {r.company.exchange || "Listing"} · {r.quote.currency}
            </p>
          </div>
        </div>
        <div className="au-flex security-actions">
          <div className="au-quote">
            <div className="au-price au-num">
              {amount(r.quote.price, r.quote.currency)}
            </div>
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
        className="au-localtabs"
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
          setTab(visible[index]);
          (e.currentTarget.children[index] as HTMLButtonElement).focus();
        }}
      >
        {visible.map((name) => (
          <button
            role="tab"
            id={`tab-${name}`}
            aria-selected={tab === name}
            aria-pressed={tab === name}
            aria-controls="research-content"
            tabIndex={tab === name ? 0 : -1}
            key={name}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      {notice && <Notice error>{notice}</Notice>}
      {resource.error && <Notice error>{resource.error}</Notice>}
      {r.issues.length > 0 && (
        <div className="coverage-note">
          <span>{r.issues.join(" ")}</span>
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
            <DecisionBrief research={r} onDca={() => setTab("Technicals")} />
            <div className="au-mainrail">
              {chart}
              <DcaCard research={r} />
            </div>
            {!crypto && (
              <>
                <Financials research={r} compact />
                <ProviderMetrics research={r} compact />
                <InvestmentCase research={r} />
                {upcoming && (
                  <div className="au-event">
                    <div className="au-event-date">
                      {upcoming.date.slice(8)}
                      <small>
                        {new Date(
                          upcoming.date + "T12:00:00Z",
                        ).toLocaleDateString("en-US", { month: "short" })}
                      </small>
                    </div>
                    <div>
                      <p>Next earnings · {dateLabel(upcoming.date)}</p>
                      <small>
                        Estimated EPS {upcoming.estimate?.toFixed(2) ?? "—"} ·
                        Provider EPS; currency/unit unverified. Schedule can
                        change
                      </small>
                    </div>
                    <button
                      className="au-link"
                      onClick={() => setTab("Thesis")}
                    >
                      View context <ArrowUpRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {tab === "Financials" && (
          <>
            <Financials research={r} />
            <Forecasts research={r} />
          </>
        )}
        {tab === "Valuation" && (
          <>
            <ProviderMetrics research={r} />
            <Valuation research={r} />
            <EarningsScenario research={r} />
          </>
        )}
        {tab === "Technicals" && (
          <>
            <div className="au-mainrail">
              {chart}
              <DcaCard research={r} />
            </div>
            <TechnicalDashboard research={r} />
            <TechnicalLevels research={r} />
            <DcaHistory research={r} />
          </>
        )}
        {tab === "Thesis" && <ResearchThesis research={r} />}
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
export function DcaCard({ research: r }: { research: ResearchData }) {
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

function DcaHistory({ research: r }: { research: ResearchData }) {
  const d = useMemo(() => perspective(r).dca, [r]);
  return (
    <section className="au-panel">
      <header className="au-panel-head">
        <h2>Monthly accumulation history</h2>
        <Help label="Accumulation rules">
          Pause above 25% of the 24-month average. 2× requires drawdown of at
          least 15% and deviation below average of at least 10%; 3× uses 30% /
          20%; 4× uses 50% / 35%. Otherwise 1×. These are original, experimental
          thresholds and have not been shown to outperform a fixed schedule.
        </Help>
      </header>
      {d.history.length ? (
        <div className="timeline">
          {d.history.slice(-6).map((x) => (
            <div key={x.month}>
              <small>{x.month}</small>
              <b>{x.multiplier}×</b>
              <small>{amount(x.close, r.quote.currency)}</small>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">{d.reason}</p>
      )}
      <p className="footnote">
        Closed months only · {d.version} · Price conditions do not establish
        business value.
      </p>
    </section>
  );
}
function TechnicalDashboard({ research: r }: { research: ResearchData }) {
  const benchmark = useResource<{ candles: Candle[]; source?: string }>(
    r.company.assetType === "stock" ? "chart/SPY?range=1Y" : null,
    undefined,
    900000,
  );
  const p = useMemo(() => perspective(r), [r]),
    s = useMemo(() => priceStudies(r.history, r.retrievedAt), [r]),
    x = useMemo(
      () => expandedStudies(r.history, r.retrievedAt, benchmark.data?.candles),
      [r, benchmark.data],
    ),
    weekly = useMemo(() => weeklyStudies(r.history, r.retrievedAt), [r]);
  const num = (v: number | null | undefined) =>
      v == null ? "—" : v.toFixed(2),
    cash = (v: number | null | undefined) => amount(v, r.quote.currency);
  const groups = [
    {
      title: "Trend",
      icon: Activity,
      items: [
        [
          "20D EMA",
          cash(s.ema20),
          "Exponential average of 20 completed daily closes.",
        ],
        [
          "50D SMA",
          cash(p.tech.ma50),
          "Simple mean of 50 completed daily closes.",
        ],
        [
          "200D SMA",
          cash(p.tech.ma200),
          "Simple mean of 200 completed daily closes.",
        ],
        [
          "ADX · 14",
          num(x.adx),
          "Wilder ADX measures trend strength, not direction. A reading above 25 is a convention, not a buy signal.",
        ],
      ],
    },
    {
      title: "Momentum",
      icon: ArrowUpRight,
      items: [
        [
          "RSI · 14",
          num(p.tech.rsi),
          "Wilder RSI. Readings above 70 or below 30 can persist.",
        ],
        ["MACD", num(s.macd), "12-day EMA minus 26-day EMA."],
        ["Signal", num(s.signal), "9-observation EMA of MACD."],
        ["Histogram", num(s.histogram), "MACD minus the signal line."],
      ],
    },
    {
      title: "Volatility",
      icon: ArrowDownRight,
      items: [
        ["ATR · 14", cash(x.atr), "Wilder-smoothed true range in price units."],
        [
          "ATR / price",
          percent(x.atrPct),
          "Wilder ATR as a percentage of the latest completed close.",
        ],
        [
          "Band width",
          percent(x.bandwidth),
          "Bollinger upper minus lower band divided by the 20-close mean.",
        ],
        [
          "52W drawdown",
          percent(x.drawdown),
          "Decline from the highest closing price in the available last 252 sessions.",
        ],
      ],
    },
    {
      title: "Participation",
      icon: Layers,
      items: [
        [
          "Relative volume",
          x.relativeVolume == null ? "—" : `${x.relativeVolume.toFixed(2)}×`,
          "Last completed volume divided by the prior 20-session average.",
        ],
        [
          "OBV",
          x.obv == null
            ? "—"
            : Intl.NumberFormat("en", { notation: "compact" }).format(x.obv),
          "Cumulative signed volume, starting at zero at the beginning of the available series.",
        ],
        [
          "Bollinger %B",
          percent(x.percentB),
          "Position inside the band: 0% at the lower and 100% at the upper band. Can exceed that range.",
        ],
        [
          "3M vs SPY",
          percent(x.relativeReturn, true),
          "63 matched daily intervals: asset return minus SPY price return, in percentage points. Not dividend-adjusted total return.",
        ],
      ],
    },
  ];
  return (
    <section>
      <header className="au-section-head">
        <div>
          <h2>Technicals, at a glance</h2>
          <p className="au-caption">
            Completed daily prices · {dateLabel(p.tech.last)}
          </p>
        </div>
      </header>
      <div className="study-grid">
        {groups.map((g) => (
          <section className="au-panel study-group" key={g.title}>
            <h3>
              <g.icon size={17} />
              {g.title}
            </h3>
            {g.items.map(([label, value, help]) => (
              <div className="study-row" key={label}>
                <span>
                  {label}
                  <Help label={label}>{help}</Help>
                </span>
                <b>{value}</b>
              </div>
            ))}
          </section>
        ))}
      </div>
      <div className="weekly-row">
        <span>
          Long-term reference{" "}
          <Help label="Weekly averages">
            Simple averages of 50 or 200 completed weekly closes. These are
            weekly, not weighted, moving averages. Levels are references, not
            guaranteed support.
          </Help>
        </span>
        <span>
          50W SMA <b>{cash(weekly.ma50)}</b>
        </span>
        <span>
          200W SMA <b>{cash(weekly.ma200)}</b>
        </span>
      </div>
    </section>
  );
}
