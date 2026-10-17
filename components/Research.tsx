"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowUp,
  TriangleAlert,
  Sparkles,
  Bookmark,
  RefreshCw,
  TrendingUp,
  FileText,
  ChevronRight,
} from "lucide-react";
import type { Research as ResearchData, Candle } from "@/lib/types";
import { perspective, valuationInputs } from "@/lib/analysis";
import { cashFlowValue } from "@/lib/engine";
import { amount, dateLabel, percent, quoteTime } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import { SecurityLogo, Help, Notice, Empty, Source } from "./Ui";
import { PriceChart } from "./Charts";
import Financials from "./Financials";
import Accumulation from "./Accumulation";
import Analyst from "./Analyst";
import SpecializedScenario from "./SpecializedScenario";
import TechnicalLevels from "./TechnicalLevels";
import CompanyEvents from "./CompanyEvents";
import ResearchNotes from "./ResearchNotes";
import { weeklyStudies, reverseGrowth } from "@/lib/research-depth";
const tabs = [
  "Overview",
  "Financials",
  "Valuation",
  "Technicals",
  "DCA",
  "Business",
  "AI Analyst",
  "Events",
  "Compare",
] as const;
const ranges = ["1D", "1W", "1M", "6M", "1Y", "5Y"] as const;
export default function Research({ symbol }: { symbol: string }) {
  const { demo, workspace, mutate } = useProduct(),
    resource = useResource<ResearchData>(
      `research/${encodeURIComponent(symbol)}`,
      demo?.research[symbol],
      300_000,
    ),
    r = resource.data;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview"),
    [range, setRange] = useState<(typeof ranges)[number]>("1Y"),
    [horizon, setHorizon] = useState<"tactical" | "swing" | "longTerm">(
      "longTerm",
    ),
    [saving, setSaving] = useState(false),
    [notice, setNotice] = useState(""),
    [style, setStyle] = useState<"line" | "candles">("line");
  const intraday = range === "1D" || range === "1W",
    shortDemo = useMemo(
      () => (demo && r ? { candles: demoChart(r.history, range) } : undefined),
      [demo, r, range],
    );
  const short = useResource<{ candles: Candle[] }>(
    intraday ? `chart/${encodeURIComponent(symbol)}?range=${range}` : null,
    shortDemo,
  );
  const bars = useMemo(
    () =>
      intraday
        ? (short.data?.candles ?? [])
        : r
          ? demoChart(r.history, range)
          : [],
    [r, range, intraday, short.data],
  );
  async function save() {
    setSaving(true);
    setNotice("");
    try {
      await mutate({
        op: workspace?.watchlist.some((w) => w.symbol === symbol)
          ? "unwatch"
          : "watch",
        symbol,
      });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Watchlist update failed.");
    } finally {
      setSaving(false);
    }
  }
  if (resource.loading && !r)
    return (
      <div className="research-loading" role="status">
        <div className="skeleton title" />
        <div className="skeleton insights" />
        <div className="skeleton plot" />
        <p>Loading company evidence and price history…</p>
      </div>
    );
  if (!r)
    return (
      <Empty
        title="Research could not be loaded"
        action={
          <button className="button" onClick={resource.refresh}>
            Try again
          </button>
        }
      >
        {resource.error || "Select another company or retry the request."}
      </Empty>
    );
  const p = perspective(r),
    weekly = weeklyStudies(r.history, r.retrievedAt),
    price = r.quote.price,
    change = r.quote.changePct,
    saved = workspace?.watchlist.some((w) => w.symbol === symbol),
    prefix = demo ? "/preview" : "",
    crypto = r.company.assetType === "crypto",
    visibleTabs = crypto
      ? tabs.filter((t) => ["Overview", "Technicals", "DCA"].includes(t))
      : tabs;
  const chart = (
    <section className="panel chart-panel">
      <header className="chart-heading">
        <h2>Price history</h2>
        <div className="range-row" aria-label="Price chart range">
          {ranges.map((v) => (
            <button
              key={v}
              aria-pressed={v === range}
              onClick={() => setRange(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </header>
      {bars.length ? (
        <PriceChart bars={bars} range={range} style={style} />
      ) : (
        <div className="chart-empty" role="status">
          {short.loading
            ? "Loading this range…"
            : short.error || "No price history was returned for this range."}
        </div>
      )}
      <footer className="chart-footer">
        <span>
          {r.quote.source} · {dateLabel(bars.at(-1)?.time)}
        </span>
        <div className="segment">
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
      </footer>
    </section>
  );
  return (
    <article className="research-page">
      <header className="company-header">
        <div className="company-identity">
          <SecurityLogo key={symbol} symbol={symbol} size={46} />
          <div>
            <h1>{r.company.name}</h1>
            <p>
              {symbol}
              {r.company.exchange ? ` · ${r.company.exchange}` : ""}
              {r.demo && <span className="tag">Demo data</span>}
            </p>
          </div>
        </div>
        <div className="company-quote">
          <div>
            <strong>{amount(price, r.quote.currency)}</strong>
            <span
              className={
                change == null ? "muted" : change < 0 ? "red" : "green"
              }
            >
              {percent(change, true)}
            </span>
          </div>
          <small>
            {r.quote.stale ? "Older quote" : r.quote.session} ·{" "}
            {r.company.assetType === "crypto"
              ? quoteTime(r.quote.asOf)
              : dateLabel(r.quote.asOf)}
          </small>
        </div>
        <button
          type="button"
          className={`icon-button save-button ${saved ? "blue" : ""}`}
          aria-label={saved ? "Remove from watchlist" : "Save to watchlist"}
          aria-pressed={saved}
          disabled={saving}
          onClick={save}
        >
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </button>
      </header>
      <div
        className="research-tabs"
        role="tablist"
        aria-label="Research sections"
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          e.preventDefault();
          const index = visibleTabs.indexOf(tab),
            next =
              (index + (e.key === "ArrowRight" ? 1 : -1) + visibleTabs.length) %
              visibleTabs.length;
          setTab(visibleTabs[next]);
          (e.currentTarget.children[next] as HTMLButtonElement)?.focus();
        }}
      >
        {visibleTabs.map((name) => (
          <button
            role="tab"
            aria-selected={tab === name}
            tabIndex={tab === name ? 0 : -1}
            aria-controls="research-content"
            key={name}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {notice && <Notice>{notice}</Notice>}
      {resource.error && <Notice error>{resource.error}</Notice>}
      {r.issues.length > 0 && (
        <div className="coverage-note">
          <TriangleAlert size={15} />
          <span>{r.issues.join(" ")}</span>
          <button
            onClick={resource.refresh}
            disabled={resource.loading}
            aria-label="Retry research sources"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}
      <div id="research-content" role="tabpanel" aria-label={tab}>
        {tab === "Overview" && (
          <>
            <section className="first-glance">
              <div className="first-glance-heading">
                <span className="chip blue">
                  {r.snapshot?.newCapital ?? p.heading}
                </span>
                <div
                  className="segment horizon-control"
                  aria-label="Investment horizon"
                >
                  {(["tactical", "swing", "longTerm"] as const).map((h) => (
                    <button
                      key={h}
                      aria-pressed={horizon === h}
                      onClick={() => setHorizon(h)}
                    >
                      {h === "longTerm"
                        ? "Long term"
                        : h === "swing"
                          ? "Swing"
                          : "Tactical"}
                    </button>
                  ))}
                </div>
              </div>
              <h2>{p.heading}</h2>
              <p>
                {r.snapshot?.horizons[horizon] ??
                  "Review the evidence for your investment horizon."}
              </p>
              <div className="perspectives">
                {!crypto && (
                  <>
                    <div>
                      <span>
                        Business{" "}
                        <Help label="Business economics">
                          This summarizes reported profitability and cash
                          generation. It does not establish a competitive moat
                          or a probability of success.
                        </Help>
                      </span>
                      <strong className={p.strong ? "green" : "blue"}>
                        {p.business}
                      </strong>
                    </div>
                    <div>
                      <span>
                        Valuation{" "}
                        <Help label="Valuation context">
                          Cash-flow scenarios use visible assumptions. They are
                          sensitivity estimates, not verified intrinsic values
                          or analyst targets.
                        </Help>
                      </span>
                      <strong className="amber">{p.valuation}</strong>
                    </div>
                  </>
                )}
                {crypto && (
                  <>
                    <div>
                      <span>
                        RSI · 14D{" "}
                        <Help label="Crypto momentum">
                          Momentum from completed daily closes. Overbought or
                          oversold readings do not predict a reversal.
                        </Help>
                      </span>
                      <strong className="violet">
                        {p.tech.rsi?.toFixed(1) ?? "—"}
                      </strong>
                    </div>
                    <div>
                      <span>
                        Daily range · ATR{" "}
                        <Help label="Daily range">
                          Mean true range over 14 completed days as a percentage
                          of the latest close. A measure of recent volatility,
                          not a forecast.
                        </Help>
                      </span>
                      <strong className="amber">{percent(p.tech.atr)}</strong>
                    </div>
                  </>
                )}
                <div>
                  <span>
                    Entry timing{" "}
                    <Help label="Entry timing">
                      Price relative to its 50- and 200-day moving averages
                      describes trend. This does not independently validate a
                      long-term thesis.
                    </Help>
                  </span>
                  <strong className="blue">{p.tech.trend}</strong>
                </div>
                <div>
                  <span>
                    Monthly DCA{" "}
                    <Help label="Monthly DCA">
                      An experimental contribution multiplier based on completed
                      monthly prices. It is neither leverage nor a return
                      prediction. Open DCA to see the rules and history.
                    </Help>
                  </span>
                  <button
                    className="metric-link violet"
                    onClick={() => setTab("DCA")}
                  >
                    {p.dca.confirmed
                      ? p.dca.confirmed.multiplier === 0
                        ? "Pause"
                        : `${p.dca.confirmed.multiplier}× ${p.dca.confirmed.multiplier === 1 ? "Baseline" : "Zone"}`
                      : "History needed"}
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </section>
            {crypto ? (
              chart
            ) : (
              <div className="research-split">
                {chart}
                <EvidenceBrief
                  research={r}
                  onOpen={() => setTab("AI Analyst")}
                />
              </div>
            )}
            {!crypto && <Financials research={r} compact />}
          </>
        )}
        {tab === "Financials" && <Financials research={r} />}
        {tab === "Valuation" && <Valuation research={r} />}
        {tab === "DCA" && <Accumulation research={r} />}
        {tab === "AI Analyst" && <Analyst key={symbol} research={r} />}
        {tab === "Technicals" && (
          <>
            <header className="section-heading">
              <div>
                <h2>Price structure</h2>
                <p>
                  Trend, momentum and reference levels ·{" "}
                  {dateLabel(p.tech.last)}
                </p>
              </div>
            </header>
            <TechnicalLevels research={r} />
            <div className="technical-metrics support">
              {[
                [
                  "50-week average",
                  amount(weekly.ma50, r.quote.currency),
                  "Mean of the last 50 completed weekly closes; WMA here means weekly moving average, not weighted moving average.",
                ],
                [
                  "200-week average",
                  amount(weekly.ma200, r.quote.currency),
                  "Mean of the last 200 completed weekly closes. A missing or short history is not estimated.",
                ],
                [
                  "RSI · 14D",
                  p.tech.rsi?.toFixed(1),
                  "Recent price momentum. Above 70 or below 30 is context, not an automatic trade.",
                ],
                [
                  "50-day average",
                  amount(p.tech.ma50, r.quote.currency),
                  "Arithmetic average of the last 50 completed daily closes.",
                ],
                [
                  "200-day average",
                  amount(p.tech.ma200, r.quote.currency),
                  "Arithmetic average of the last 200 completed daily closes.",
                ],
                [
                  "Relative volume",
                  p.tech.volumeRatio != null
                    ? `${p.tech.volumeRatio.toFixed(2)}×`
                    : null,
                  "Last completed session compared with the previous 20 sessions.",
                ],
                [
                  "Range · 14D",
                  percent(p.tech.atr),
                  "Mean true range as a percent of price. Measures volatility rather than direction.",
                ],
                [
                  "Trend",
                  p.tech.trend,
                  "Price and the ordering of the 50- and 200-day averages.",
                ],
              ].map(([label, value, help]) => (
                <article className="panel" key={label}>
                  <span className="metric-label">
                    {label}
                    <Help label={label!}>{help}</Help>
                  </span>
                  <strong className="metric-value small-value">
                    {value ?? "—"}
                  </strong>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "Business" && <Business research={r} />}
        {tab === "Events" && (
          <>
            <Filings research={r} />
            <CompanyEvents symbol={symbol} />
          </>
        )}
        {tab === "Compare" && (
          <Empty
            title="Put companies side by side"
            icon={TrendingUp}
            action={
              <Link
                className="button primary"
                href={`${prefix}/compare?symbols=${encodeURIComponent(symbol)}`}
              >
                Open comparison <ArrowUpRight size={16} />
              </Link>
            }
          >
            Compare reported growth, cash generation, profitability and price
            structure on consistent periods.
          </Empty>
        )}
      </div>
    </article>
  );
}
function demoChart(history: Candle[], range: string) {
  if (!history.length) return [];

  const last = Date.parse(history.at(-1)!.time),
    days =
      range === "5Y"
        ? 1827
        : range === "1D"
          ? 1
          : range === "1W"
            ? 7
            : range === "1M"
              ? 31
              : range === "6M"
                ? 183
                : 366;
  return history.filter((b) => Date.parse(b.time) >= last - days * 86400_000);
}
export function EvidenceBrief({
  research: r,
  onOpen,
}: {
  research: ResearchData;
  onOpen: () => void;
}) {
  const p = perspective(r),
    last = p.last;
  const strength =
    last?.fcf != null
      ? `Reported free cash flow: ${amount(last.fcf, last.currency, true)}.`
      : last?.revenue != null
        ? `Reported revenue: ${amount(last.revenue, last.currency, true)}.`
        : "Reported financial evidence is incomplete.";
  const risk =
    last?.capex != null &&
    last.operatingCashFlow != null &&
    last.operatingCashFlow > 0
      ? `Capital spending uses ${percent((Math.abs(last.capex) / last.operatingCashFlow) * 100)} of operating cash flow.`
      : "Review funding, dilution and competitive risks.";
  return (
    <aside className="panel evidence-brief">
      <h2>
        <Sparkles size={19} className="violet" />
        The evidence, in three points
      </h2>
      <small>From reported data · {dateLabel(last?.filed)}</small>
      <div>
        <span className="brief-icon green">
          <ArrowUp size={19} />
        </span>
        <p>
          <b className="green">Cash generation</b>
          {strength}
        </p>
      </div>
      <div>
        <span className="brief-icon amber">
          <TriangleAlert size={18} />
        </span>
        <p>
          <b className="amber">Keep in view</b>
          {risk}
        </p>
      </div>
      <div>
        <span className="brief-icon violet">
          <TrendingUp size={18} />
        </span>
        <p>
          <b className="violet">Watch next</b>
          {p.growth == null
            ? "Comparable growth and operating milestones."
            : `Revenue grew ${percent(p.growth)} across the last comparable annual periods.`}
        </p>
      </div>
      <button className="text-button" onClick={onOpen}>
        Open AI analyst <ArrowUpRight size={15} />
      </button>
    </aside>
  );
}
function Valuation({ research: r }: { research: ResearchData }) {
  const input = valuationInputs(r),
    [growth, setGrowth] = useState(0),
    [selectedScenario, setSelectedScenario] = useState<string | null>(null),
    [discount, setDiscount] = useState(10),
    [terminal, setTerminal] = useState(2),
    [dilution, setDilution] = useState(1);
  const estimate = input.eligible
    ? cashFlowValue(
        input.latest!.fcf!,
        input.share!.value,
        growth,
        discount,
        terminal,
        dilution,
      )
    : null;
  return (
    <section>
      <header className="section-heading">
        <div>
          <h2>What assumptions does the price require?</h2>
          <p>
            Explore cash-flow scenarios. Model estimates are separate from
            reported facts.
          </p>
        </div>
        <Help label="Cash-flow scenario">
          Five annual cash flows plus a terminal value, discounted per share.
          Annual dilution applies to each year and the terminal period. This
          exploratory model does not reconcile all financing, acquisitions,
          non-operating assets or future cash claims.
        </Help>
      </header>
      <div className="valuation-context">
        <div>
          <span>Current quote</span>
          <strong>{amount(r.quote.price, r.quote.currency)}</strong>
          <small>{dateLabel(r.quote.asOf)}</small>
        </div>
        <div>
          <span>Reported annual FCF</span>
          <strong>
            {amount(input.latest?.fcf, input.latest?.currency, true)}
          </strong>
          <small>{dateLabel(input.latest?.end)}</small>
        </div>
        <div>
          <span>Outstanding shares</span>
          <strong>
            {input.share
              ? new Intl.NumberFormat("en", {
                  notation: "compact",
                  maximumFractionDigits: 2,
                }).format(input.share.value)
              : "—"}
          </strong>
          <small>{dateLabel(input.share?.end)}</small>
        </div>
      </div>
      {input.eligible ? (
        <>
          <section className="panel">
            <div className="section-heading">
              <h2>Explore the valuation range</h2>
              <span className="muted small">Five-year cash-flow scenarios</span>
            </div>
            {r.quote.price != null &&
              input.scenarios.every((s) => s.value != null) &&
              (() => {
                const values = input.scenarios.map((s) => s.value!),
                  low = Math.min(...values),
                  high = Math.max(...values);
                const left =
                  high > low
                    ? Math.max(
                        5,
                        Math.min(
                          95,
                          5 + (90 * (r.quote.price! - low)) / (high - low),
                        ),
                      )
                    : 50;
                return (
                  <>
                    <div className="valuation-track">
                      <i
                        className="valuation-marker"
                        style={{ left: `${left}%` }}
                        aria-hidden="true"
                      />
                      <span
                        className="value-pin"
                        style={{
                          left: `${left}%`,
                          transform:
                            left > 75
                              ? "translateX(-100%)"
                              : left < 25
                                ? "none"
                                : "translateX(-50%)",
                        }}
                      >
                        {r.quote.price! > high
                          ? "Above range · "
                          : r.quote.price! < low
                            ? "Below range · "
                            : "Price "}
                        {amount(r.quote.price, r.quote.currency)}
                      </span>
                    </div>
                    <div className="valuation-labels">
                      <span>{amount(low, r.quote.currency)}</span>
                      <span>Scenario range</span>
                      <span>{amount(high, r.quote.currency)}</span>
                    </div>
                  </>
                );
              })()}
            <div className="scenarios">
              {input.scenarios.map((s) => (
                <button
                  className={`scenario ${selectedScenario === s.name ? "active" : ""}`}
                  key={s.name}
                  aria-pressed={selectedScenario === s.name}
                  onClick={() => {
                    setSelectedScenario(s.name);
                    setGrowth(s.growth);
                    setDiscount(s.discount);
                    setTerminal(s.terminal);
                    setDilution(1);
                  }}
                >
                  <span>{s.name} scenario</span>
                  <strong>{amount(s.value, r.quote.currency)}</strong>
                  <small>
                    {s.growth}% growth · {s.discount}% discount
                  </small>
                </button>
              ))}
            </div>
          </section>
          <section className="panel support">
            <div className="section-heading">
              <div>
                <h2>Your assumptions</h2>
                <p>Changes update this scenario immediately.</p>
                <p>
                  Implied five-year annual FCF growth at this quote:{" "}
                  <b>
                    {r.quote.price != null
                      ? percent(
                          reverseGrowth(
                            input.latest!.fcf!,
                            input.share!.value,
                            r.quote.price,
                            discount,
                            terminal,
                            dilution,
                          ),
                        )
                      : "—"}
                  </b>
                </p>
              </div>
              <strong className="scenario-value">
                {amount(estimate, r.quote.currency)}
              </strong>
            </div>
            <div className="assumptions">
              {[
                {
                  label: "Annual cash-flow growth",
                  v: growth,
                  set: setGrowth,
                  min: -30,
                  max: 40,
                },
                {
                  label: "Required annual return",
                  v: discount,
                  set: setDiscount,
                  min: 4,
                  max: 25,
                },
                {
                  label: "Terminal growth",
                  v: terminal,
                  set: setTerminal,
                  min: 0,
                  max: 5,
                },
                {
                  label: "Annual dilution",
                  v: dilution,
                  set: setDilution,
                  min: 0,
                  max: 15,
                },
              ].map((x) => (
                <label key={x.label}>
                  <span>
                    {x.label}
                    <b>{x.v}%</b>
                  </span>
                  <input
                    type="range"
                    min={x.min}
                    max={x.max}
                    step={0.5}
                    value={x.v}
                    onChange={(e) => {
                      setSelectedScenario(null);
                      x.set(Number(e.target.value));
                    }}
                  />
                </label>
              ))}
            </div>
            {discount <= terminal && (
              <Notice error>
                The required return must exceed terminal growth.
              </Notice>
            )}
          </section>
        </>
      ) : (
        <div className="valuation-unavailable">
          <h3>A suitable model needs more evidence.</h3>
          {input.issues.map((i) => (
            <p key={i}>
              <TriangleAlert size={15} />
              {i}
            </p>
          ))}
          <p>
            Reported financials remain available. No fair value is inferred from
            the stock price.
          </p>
        </div>
      )}
      <SpecializedScenario research={r} />
      <p className="footnote">
        These scenarios are sensitivity analyses, not analyst targets or a
        verified valuation verdict. Review business-specific economics and model
        assumptions before relying on a per-share estimate.
      </p>
    </section>
  );
}
function Business({ research: r }: { research: ResearchData }) {
  const p = perspective(r);
  return (
    <section>
      <header className="section-heading">
        <div>
          <h2>The business behind the ticker</h2>
          <p>
            Start with reported economics. Build the thesis from source
            disclosures.
          </p>
        </div>
      </header>
      <div className="two-col">
        <section className="panel">
          <h3>Reported economics</h3>
          <div className="data-list">
            <div>
              <span>Revenue growth</span>
              <strong>{percent(p.growth)}</strong>
            </div>
            <div>
              <span>Operating margin</span>
              <strong>{percent(p.last?.margin)}</strong>
            </div>
            <div>
              <span>Free cash flow</span>
              <strong>{amount(p.last?.fcf, p.last?.currency, true)}</strong>
            </div>
            <div>
              <span>Latest annual period</span>
              <strong>{dateLabel(p.last?.end)}</strong>
            </div>
          </div>
          <Source href={p.last?.sourceUrl}>Read the filing</Source>
        </section>
        <section className="panel">
          <h3>Moat & long-term thesis</h3>
          <p>
            Financial performance alone does not establish a durable competitive
            advantage.
          </p>
          <div className="thesis-check">
            <span>Switching costs</span>
            <span>Pricing power</span>
            <span>Customer concentration</span>
            <span>Funding & dilution</span>
          </div>
          <p className="small muted">
            Company-specific claims need dated disclosures. Use the AI analyst
            to review the available evidence, then inspect the original source.
          </p>
        </section>
      </div>
      <Filings research={r} />
      <ResearchNotes research={r} />
    </section>
  );
}
function Filings({ research: r }: { research: ResearchData }) {
  return (
    <section className="support">
      <header className="section-heading">
        <div>
          <h2>Company disclosures</h2>
          <p>Filed documents, with dates and original sources.</p>
        </div>
      </header>
      {r.filings.length ? (
        <div className="filing-list">
          {r.filings.map((f) => (
            <a key={f.url} href={f.url} target="_blank" rel="noreferrer">
              <span className="filing-icon">
                <FileText size={20} />
              </span>
              <span>
                <b>{f.form}</b>
                <small>{f.title}</small>
              </span>
              <time>{dateLabel(f.date)}</time>
              <ArrowUpRight size={17} />
            </a>
          ))}
        </div>
      ) : (
        <div className="inline-empty" role="status">
          <FileText size={20} />
          <p>
            {r.issues.find((i) => /filings|disclosures/i.test(i)) ||
              "No supported company reports returned for this listing."}
          </p>
        </div>
      )}
    </section>
  );
}
