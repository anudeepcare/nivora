"use client";
import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";
import { sections, companies } from "@/lib/presentation/preview";
import {
  Button,
  Metric,
  Section,
  Chart,
  Pace,
  DataTable,
  Note,
  LinkAction,
} from "./Primitives";
import s from "./Preview.module.css";
export default function ResearchView({
  symbol,
  onEvidence,
  onAlert,
}: {
  symbol: string;
  onEvidence: () => void;
  onAlert: () => void;
}) {
  const [tab, setTab] = useState<string>("Overview");
  const [saved, setSaved] = useState(false);
  const [period, setPeriod] = useState("TTM");
  const [option, setOption] = useState("Market map");
  const [advanced, setAdvanced] = useState("Risk & conditions");
  const [growth, setGrowth] = useState(12);
  const company = companies.find((c) => c.symbol === symbol) || companies[0];
  return (
    <>
      <header className={s.companyHead}>
        <div className={s.companyIdentity}>
          <div className={s.companyMonogram}>{company.symbol.slice(0, 1)}</div>
          <div>
            <span className={s.eyebrow}>
              {company.symbol} / NASDAQ · SAMPLE COMPANY
            </span>
            <h1>{company.name}</h1>
            <p>
              {company.sector} <span>· USD</span>
            </p>
          </div>
        </div>
        <div className={s.quote}>
          <strong>${company.price.toFixed(2)}</strong>
          <span className={company.change > 0 ? s.positive : s.negative}>
            {company.change > 0 ? "+" : ""}
            {company.change}%
          </span>
          <small>Illustrative quote · Nov 4, 2026</small>
        </div>
        <button
          className={s.iconButton}
          aria-label={saved ? "Remove from watchlist" : "Save to watchlist"}
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
        >
          {saved ? <Check /> : <Bookmark />}
        </button>
      </header>
      <nav className={s.tabs} aria-label="Research sections">
        {sections.map((t) => (
          <button
            aria-current={tab === t ? "page" : undefined}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </nav>
      <label className={s.mobileSelect}>
        Research section
        <select value={tab} onChange={(e) => setTab(e.target.value)}>
          {sections.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      {tab === "Overview" && (
        <>
          <div className={s.metricStrip}>
            {[
              ["Market cap", "$76.9B", "Illustrative market value"],
              ["Revenue growth", "24.6%", "Year over year"],
              ["Operating margin", "31.2%", "Trailing 12 months"],
              ["Free cash flow", "$4.5B", "Trailing 12 months"],
              ["Net debt", "$461M", "Latest quarter"],
              ["Forward P/E", "24.8×", "Illustrative estimate"],
            ].map(([label, value, detail]) => (
              <Metric key={label} label={label} value={value} detail={detail} />
            ))}
          </div>
          <div className={s.researchGrid}>
            <Section
              title="Price in perspective"
              detail="A longer view. A more informed next step."
              action={<span className={s.badge}>Sample history</span>}
            >
              <Chart price={company.price} />
            </Section>
            <Pace
              key={company.symbol}
              stage={company.pace}
              onEvidence={onEvidence}
            />
          </div>
          <div className={s.evidenceStrip}>
            <div>
              <ShieldCheck />
              <span>
                <strong>Business supported</strong>
                <small>Growth and cash generation meet sample checks</small>
              </span>
            </div>
            <div>
              <TrendingUp />
              <span>
                <strong>Valuation needs context</strong>
                <small>Inspect the assumptions behind the range</small>
              </span>
            </div>
            <LinkAction onClick={() => setTab("Valuation")}>
              Review valuation
            </LinkAction>
          </div>
          <div className={s.twoCol}>
            <Section
              title="What matters next"
              detail="Your next research checkpoint"
            >
              <div className={s.event}>
                <div className={s.dateTile}>
                  NOV<strong>12</strong>
                </div>
                <div>
                  <strong>Quarterly earnings</strong>
                  <p>Watch revenue durability and cash conversion.</p>
                </div>
                <LinkAction onClick={() => setTab("News & earnings")}>
                  Open
                </LinkAction>
              </div>
            </Section>
            <Section
              title="Keep the decision connected"
              detail="Your research, followed through"
            >
              <p>Set a condition and return when the evidence changes.</p>
              <Button secondary onClick={onAlert}>
                <Bell size={16} /> Create an alert
              </Button>
            </Section>
          </div>
        </>
      )}
      {tab === "Business" && (
        <>
          <Section
            title="The business, in numbers"
            detail="Growth, profitability and the cash left over."
            action={
              <div className={s.segment}>
                {["TTM", "Annual", "Quarterly"].map((p) => (
                  <button
                    key={p}
                    aria-pressed={period === p}
                    onClick={() => setPeriod(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            }
          >
            <div className={s.metricStrip}>
              {[
                [
                  "Revenue",
                  period === "Quarterly"
                    ? "$3.10B"
                    : period === "Annual"
                      ? "$10.80B"
                      : "$12.40B",
                  "+24.6% YoY",
                ],
                ["Operating margin", "31.2%", "+280 bps YoY"],
                [
                  "Free cash flow",
                  period === "Quarterly"
                    ? "$1.125B"
                    : period === "Annual"
                      ? "$3.92B"
                      : "$4.50B",
                  "36.3% of revenue",
                ],
                ["Cash conversion", "116%", "FCF / net income"],
              ].map(([label, value, detail]) => (
                <Metric
                  key={label}
                  label={label}
                  value={value}
                  detail={detail}
                />
              ))}
            </div>
            <div className={s.twoCol}>
              <div>
                <h3>Revenue & free cash flow</h3>
                <div className={s.barChart}>
                  {[46, 58, 72, 88, 98].map((v, i) => (
                    <div key={i}>
                      <span style={{ height: v + "%" }} />
                      <i style={{ height: v * 0.36 + "%" }} />
                      <small>
                        {period === "Quarterly"
                          ? ["Q3 ’25", "Q4 ’25", "Q1 ’26", "Q2 ’26", "Q3 ’26"][
                              i
                            ]
                          : period === "Annual"
                            ? 2021 + i
                            : [
                                "Sep ’22",
                                "Sep ’23",
                                "Sep ’24",
                                "Sep ’25",
                                "Sep ’26",
                              ][i]}
                      </small>
                    </div>
                  ))}
                </div>
                <small>
                  Blue: revenue · Pale blue: free cash flow · sample scale
                </small>
              </div>
              <div>
                <h3>Financial statements</h3>
                <DataTable
                  headers={["Metric", period, "Prior period"]}
                  rows={[
                    [
                      "Revenue",
                      period === "Quarterly"
                        ? "$3.10B"
                        : period === "Annual"
                          ? "$10.80B"
                          : "$12.40B",
                      period === "Quarterly"
                        ? "$2.488B"
                        : period === "Annual"
                          ? "$8.67B"
                          : "$9.95B",
                    ],
                    [
                      "Operating income",
                      period === "Quarterly"
                        ? "$967M"
                        : period === "Annual"
                          ? "$3.37B"
                          : "$3.87B",
                      period === "Quarterly"
                        ? "$706M"
                        : period === "Annual"
                          ? "$2.46B"
                          : "$2.82B",
                    ],
                    [
                      "Operating cash flow",
                      period === "Quarterly"
                        ? "$1.205B"
                        : period === "Annual"
                          ? "$4.20B"
                          : "$4.82B",
                      period === "Quarterly"
                        ? "$935M"
                        : period === "Annual"
                          ? "$3.26B"
                          : "$3.74B",
                    ],
                    [
                      "Capital expenditure",
                      period === "Quarterly"
                        ? "$80M"
                        : period === "Annual"
                          ? "$280M"
                          : "$320M",
                      period === "Quarterly"
                        ? "$70M"
                        : period === "Annual"
                          ? "$244M"
                          : "$280M",
                    ],
                    [
                      "Free cash flow",
                      period === "Quarterly"
                        ? "$1.125B"
                        : period === "Annual"
                          ? "$3.92B"
                          : "$4.50B",
                      period === "Quarterly"
                        ? "$865M"
                        : period === "Annual"
                          ? "$3.016B"
                          : "$3.46B",
                    ],
                  ]}
                />
              </div>
            </div>
          </Section>
          <Section title="Balance sheet & ownership costs">
            <DataTable
              headers={["Metric", "Latest", "Context"]}
              rows={[
                ["Cash & equivalents", "$3.1B", "Latest quarter"],
                ["Total debt", "$3.56B", "Latest quarter"],
                ["Net debt", "$461M", "Debt less cash"],
                ["Stock compensation", "$340M", "2.7% of revenue"],
                ["Diluted shares", "598M", "+1.4% YoY"],
              ]}
            />
          </Section>
        </>
      )}
      {tab === "Valuation" && (
        <>
          <Section
            title="A range of outcomes"
            detail="Model scenarios · separate from analyst targets"
          >
            <div className={s.scenarios}>
              {[
                ["Bear case", "96", "Slower growth"],
                ["Base case", String(120 + growth), "Current assumptions"],
                ["Bull case", "168", "Stronger execution"],
              ].map(([label, value, note], i) => (
                <div key={label}>
                  <span
                    className={
                      i === 0 ? s.negative : i === 2 ? s.positive : s.blue
                    }
                  >
                    {label}
                  </span>
                  <strong>${value}</strong>
                  <p>{note}</p>
                  <small>
                    {i === 0 ? "8%" : i === 1 ? growth + "%" : "18%"} revenue
                    growth
                  </small>
                </div>
              ))}
            </div>
            <label className={s.slider}>
              Test base-case revenue growth <strong>{growth}%</strong>
              <input
                type="range"
                min="5"
                max="25"
                value={growth}
                onChange={(e) => setGrowth(+e.target.value)}
              />
            </label>
            <Note>
              This prototype slider demonstrates an interaction. Its
              illustrative result is not a production valuation calculation.
            </Note>
          </Section>
          <Section title="Assumptions you can inspect">
            <DataTable
              headers={["Input", "Base assumption", "Definition"]}
              rows={[
                ["Forecast horizon", "10 years", "Explicit projection period"],
                ["Discount rate", "10%", "Illustrative required return"],
                ["Terminal growth", "3%", "Long-run growth assumption"],
                ["Cash-flow margin", "28%", "Normalized model assumption"],
              ]}
            />
          </Section>
        </>
      )}
      {tab === "Technicals" && (
        <>
          <Section
            title="The setup, clearly mapped"
            detail="Completed daily studies · illustrative values"
            action={
              <Button secondary onClick={onEvidence}>
                <SlidersHorizontal size={16} /> Study definitions
              </Button>
            }
          >
            <Chart price={company.price} />
          </Section>
          <div className={s.twoCol}>
            {[
              [
                "Trend",
                [
                  ["50-session SMA", "$121.24", "Above average"],
                  ["200-session SMA", "$108.68", "Above average"],
                  [
                    "200-week WMA",
                    "Not established",
                    "Requires 200 completed weeks",
                  ],
                  ["ADX · 14", "27.4", "Trend strength"],
                ],
              ],
              [
                "Momentum",
                [
                  ["RSI · 14", "58.6", "0–100 oscillator"],
                  ["MACD / signal", "2.16 / 1.84", "Daily 12 / 26 / 9"],
                  ["Stochastic %K / %D", "64.2 / 61.8", "Daily 14 / 3"],
                  ["CCI · 20", "82.4", "Daily price deviation"],
                ],
              ],
              [
                "Volatility & levels",
                [
                  ["ATR · 14", "$3.12", "2.43% of price"],
                  ["Bollinger %B", "72%", "Position in range"],
                  ["Fibonacci · 0.618", "$116.80", "Illustrative anchors"],
                  ["Closing drawdown", "−8.4%", "From observed peak"],
                ],
              ],
              [
                "Participation",
                [
                  ["Relative volume", "1.24×", "Previous 20 sessions"],
                  ["Money flow index", "62.1", "Daily 14"],
                  ["Chaikin money flow", "0.12", "Daily 20"],
                  ["20-session OBV change", "+4.2M", "Signed volume"],
                ],
              ],
            ].map(([title, rows]) => (
              <Section key={String(title)} title={String(title)}>
                <DataTable
                  headers={["Study", "Reading", "Basis"]}
                  rows={rows as string[][]}
                />
              </Section>
            ))}
          </div>
        </>
      )}
      {tab === "Analysts" && (
        <>
          <Section
            title="Expectations, with context"
            detail="Illustrative coverage · opinions are not fair value"
          >
            <div className={s.metricStrip}>
              <Metric
                label="Consensus"
                value="Buy"
                detail="18 sample analysts"
              />
              <Metric
                label="Average target"
                value="$142"
                detail="12-month expectations"
              />
              <Metric
                label="Target range"
                value="$105–175"
                detail="Low to high"
              />
            </div>
            <div className={s.ratingBar}>
              <span style={{ width: "61%" }}>11 Buy</span>
              <span style={{ width: "28%" }}>5 Hold</span>
              <span style={{ width: "11%" }}>2 Sell</span>
            </div>
          </Section>
          <Section title="Recent revisions">
            <DataTable
              headers={[
                "Research firm",
                "Rating",
                "Previous → current",
                "Observed",
              ]}
              rows={[
                ["Sample Research A", "Buy", "$138 → $148", "Nov 2"],
                ["Sample Research B", "Hold", "$130 → $132", "Oct 28"],
                ["Sample Research C", "Buy", "$155 → $160", "Oct 22"],
              ]}
            />
          </Section>
        </>
      )}
      {tab === "Options" && (
        <>
          <Section
            title="Options workspace"
            detail="One illustrative expiration · no order execution"
            action={
              <select aria-label="Expiration (one sample available)">
                <option>Nov 20, 2026</option>
              </select>
            }
          >
            <div className={s.subnav}>
              {[
                "Market map",
                "Contracts",
                "Long-term",
                "Strategy builder",
                "Understand options",
              ].map((v) => (
                <button
                  key={v}
                  aria-pressed={option === v}
                  onClick={() => setOption(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            {option === "Market map" ? (
              <>
                <div className={s.metricStrip}>
                  <Metric
                    label="Implied volatility"
                    value="42.6%"
                    detail="Sample near-money IV"
                  />
                  <Metric
                    label="Put / call OI"
                    value="0.82"
                    detail="Selected expiration"
                  />
                  <Metric
                    label="Sample expected move"
                    value="±$8.40"
                    detail="Illustrative, not guaranteed"
                  />
                </div>
                <div className={s.gamma}>
                  {[20, 36, 58, 82, 63, 35, 12, 28, 51, 90, 76, 44, 25].map(
                    (v, i) => (
                      <div
                        key={i}
                        style={{
                          height: v + "%",
                          background:
                            i < 6 ? "var(--negative)" : "var(--positive)",
                          alignSelf: i < 6 ? "flex-start" : "flex-end",
                        }}
                      />
                    ),
                  )}
                </div>
                <Note>
                  Gamma exposure requires model assumptions. Contract activity
                  does not reveal actual dealer positions.
                </Note>
              </>
            ) : option === "Understand options" ? (
              <div className={s.prose}>
                <h3>Start with the risk</h3>
                <p>
                  Premium, expiration, liquidity and exercise all affect an
                  options position. Inspect the bid–ask spread before
                  interpreting a displayed price.
                </p>
              </div>
            ) : (
              <DataTable
                headers={[
                  "Type",
                  "Strike",
                  "Bid",
                  "Ask",
                  "IV",
                  "Open interest",
                ]}
                rows={[
                  [
                    option === "Long-term" ? "Jan 2028 call" : "Call",
                    "$120",
                    "$11.20",
                    "$11.60",
                    "43.1%",
                    "4,210",
                  ],
                  ["Call", "$130", "$5.30", "$5.65", "42.6%", "6,840"],
                  ["Put", "$120", "$2.10", "$2.35", "44.2%", "3,620"],
                ]}
              />
            )}
          </Section>
          {option === "Strategy builder" && (
            <Section title="Test a long call">
              <Note>
                Preview only. Full payoff modeling and editable legs are
                pending; no strategy is recommended.
              </Note>
            </Section>
          )}
        </>
      )}
      {tab === "Ownership" && (
        <>
          <Section
            title="Who holds the business"
            detail="Illustrative filings · reported with a delay"
          >
            <div className={s.metricStrip}>
              <Metric
                label="Institutional ownership"
                value="64.2%"
                detail="Reported holdings"
              />
              <Metric
                label="Insider ownership"
                value="7.4%"
                detail="Reported beneficial ownership"
              />
              <Metric
                label="Share count change"
                value="+1.4%"
                detail="Year over year"
              />
            </div>
            <DataTable
              headers={["Holder", "Position", "Reported change", "Period"]}
              rows={[
                ["Sample Asset Management", "18.2M shares", "+4.2%", "Q2 2026"],
                ["Sample Index Partners", "14.6M shares", "+1.1%", "Q2 2026"],
                ["Sample Capital", "9.8M shares", "−2.3%", "Q2 2026"],
              ]}
            />
          </Section>
          <Section title="The business case">
            <p>
              Durable revenue, cash conversion and reinvestment are the
              questions to track. Ownership changes alone do not establish
              business quality.
            </p>
          </Section>
        </>
      )}
      {tab === "News & earnings" && (
        <>
          <Section title="The next checkpoint" detail="Illustrative calendar">
            <div className={s.event}>
              <div className={s.dateTile}>
                NOV<strong>12</strong>
              </div>
              <div>
                <h3>Quarterly results</h3>
                <p>After market close · schedule unconfirmed in this sample</p>
              </div>
              <Button secondary onClick={onAlert}>
                <Bell size={16} /> Set reminder
              </Button>
            </div>
          </Section>
          <Section title="Company updates">
            {[
              "Revenue expansion continues across core products",
              "What to watch in the next earnings release",
              "New product investment and margin implications",
            ].map((v, i) => (
              <article className={s.news} key={v}>
                <span className={s.eyebrow}>
                  ILLUSTRATIVE UPDATE · NOV {4 - i}
                </span>
                <h3>{v}</h3>
                <p>
                  Sample editorial content for design review. Live articles and
                  source links will be supplied by the news adapter.
                </p>
              </article>
            ))}
          </Section>
        </>
      )}
      {tab === "Advanced" && (
        <Section
          title="Risk & scenarios"
          detail="Research tools · assumptions stay visible"
        >
          <div className={s.subnav}>
            {[
              "Risk & conditions",
              "Position design",
              "Expectations",
              "Market context",
              "Historical lens",
            ].map((v) => (
              <button
                key={v}
                aria-pressed={advanced === v}
                onClick={() => setAdvanced(v)}
              >
                {v}
              </button>
            ))}
          </div>
          {advanced === "Position design" ? (
            <PositionDesign />
          ) : (
            <>
              <div className={s.metricStrip}>
                <Metric
                  label={
                    advanced === "Historical lens"
                      ? "Completed observations"
                      : "Historical volatility"
                  }
                  value={advanced === "Historical lens" ? "252" : "32.4%"}
                  detail="Illustrative sample"
                />
                <Metric
                  label="Maximum drawdown"
                  value="−24.6%"
                  detail="Observed sample window"
                />
                <Metric
                  label="Market sensitivity"
                  value="1.18×"
                  detail="Illustrative beta"
                />
              </div>
              <Note>
                {advanced}: this visual preview shows the information hierarchy.
                Full analytical controls and history validation remain on the
                coverage checklist.
              </Note>
            </>
          )}
        </Section>
      )}
    </>
  );
}
function PositionDesign() {
  const [capital, setCapital] = useState(10000),
    [risk, setRisk] = useState(1),
    [entry, setEntry] = useState(128),
    [stop, setStop] = useState(115);
  const valid =
    capital > 0 &&
    risk > 0 &&
    risk <= 10 &&
    entry > 0 &&
    stop >= 0 &&
    stop < entry;
  const shares = valid
    ? Math.floor(
        Math.min(capital / entry, (capital * risk) / 100 / (entry - stop)),
      )
    : 0;
  return (
    <div className={s.twoCol}>
      <div className={s.formGrid}>
        {[
          ["Capital", capital, setCapital],
          ["Risk budget %", risk, setRisk],
          ["Entry price", entry, setEntry],
          ["Invalidation price", stop, setStop],
        ].map(([label, value, setter]) => (
          <label key={String(label)}>
            {String(label)}
            <input
              type="number"
              value={Number(value)}
              onChange={(e) => (setter as (v: number) => void)(+e.target.value)}
            />
          </label>
        ))}
      </div>
      <div className={s.calculation}>
        <span className={s.eyebrow}>FROM YOUR INPUTS</span>
        <h2>{valid ? `${shares} whole shares` : "Check your inputs"}</h2>
        <p>
          {valid
            ? `At-risk amount: $${(shares * (entry - stop)).toFixed(2)} before fees and slippage.`
            : "Use positive capital and entry, risk above 0% up to 10%, and invalidation below entry."}
        </p>
        <small>Hypothetical sizing · not a recommendation</small>
      </div>
    </div>
  );
}
