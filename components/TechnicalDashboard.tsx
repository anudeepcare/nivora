"use client";
import { useMemo, useRef } from "react";
import { X } from "lucide-react";
import type { Research } from "@/lib/types";
import { perspective } from "@/lib/analysis";
import { technicalContext } from "@/lib/technical-context";
import { priceStudies } from "@/lib/price-studies";
import { expandedStudies } from "@/lib/technical-expanded";
import { advancedStudies } from "@/lib/advanced-research";
import { professionalStudies } from "@/lib/professional-studies";
import { moreStudies } from "@/lib/technical-more";
import { amount, percent, dateLabel } from "@/lib/format";
import TechnicalLevels from "./TechnicalLevels";
export default function TechnicalDashboard({
  research: r,
}: {
  research: Research;
}) {
  const p = useMemo(() => perspective(r), [r]),
    s = useMemo(
      () => priceStudies(r.history, r.retrievedAt),
      [r.history, r.retrievedAt],
    ),
    x = useMemo(
      () => expandedStudies(r.history, r.retrievedAt),
      [r.history, r.retrievedAt],
    ),
    a = useMemo(
      () => advancedStudies(r.history, r.retrievedAt),
      [r.history, r.retrievedAt],
    ),
    pro = useMemo(
      () =>
        professionalStudies(
          r.history,
          r.retrievedAt,
          r.company.assetType === "crypto" ? 365 : 252,
        ),
      [r.history, r.retrievedAt, r.company.assetType],
    ),
    more = useMemo(
      () =>
        moreStudies(
          r.history,
          r.retrievedAt,
          r.company.assetType === "crypto" ? "crypto" : "us-equity",
          r.company.assetType === "crypto" ? 365 : 252,
        ),
      [r.history, r.retrievedAt, r.company.assetType],
    ),
    dialog = useRef<HTMLDialogElement>(null),
    currency = r.quote.currency;
  const extra = useMemo(
    () =>
      technicalContext(
        r.history,
        r.retrievedAt,
        r.company.assetType === "crypto" ? "crypto" : "us-equity",
      ),
    [r.history, r.retrievedAt, r.company.assetType],
  );
  const n = (v: number | null | undefined, suffix = "") =>
      v == null ? "Not established" : v.toFixed(2) + suffix,
    m = (v: number | null | undefined) =>
      v == null ? "Not established" : amount(v, currency),
    pct = (v: number | null | undefined) =>
      v == null ? "Not established" : percent(v),
    last = a.last;
  const distance = (ma: number | null) =>
    ma && last
      ? percent((last / ma - 1) * 100) + " from average"
      : "History needed";
  const groups = [
    {
      title: "Trend",
      tone: "blue",
      note: "Direction and strength are different. ADX measures strength; directional movement supplies direction.",
      rows: [
        [
          "50-week WMA",
          m(extra.wma50Week),
          `Linearly weighted completed weekly closes; last observed week ${dateLabel(extra.weeklyAsOf)}.`,
        ],
        [
          "200-week WMA",
          m(extra.wma200Week),
          "Requires 200 consecutive completed weeks; latest close has the largest weight.",
        ],
        ["20-session average", m(pro.ma20), distance(pro.ma20)],
        ["50-session average", m(pro.ma50), distance(pro.ma50)],
        ["100-session average", m(pro.ma100), distance(pro.ma100)],
        ["200-session average", m(pro.ma200), distance(pro.ma200)],
        [
          "20-session EMA",
          m(s.ema20),
          "Exponentially weighted completed closes.",
        ],
        [
          "ADX · 14",
          n(x.adx),
          "Wilder-smoothed directional strength, not a buy/sell probability.",
        ],
        [
          "+DI / −DI",
          x.plusDI == null || x.minusDI == null
            ? "Not established"
            : n(x.plusDI) + " / " + n(x.minusDI),
          "Positive and negative directional movement.",
        ],
      ],
    },
    {
      title: "Momentum",
      tone: "violet",
      note: "Oscillators describe position and momentum. Extremes can persist during strong trends.",
      rows: [
        [
          "CCI · 20",
          n(extra.cci),
          "Typical-price deviation from its 20-session mean, divided by 0.015 times mean absolute deviation.",
        ],
        [
          "Williams %R · 14",
          n(extra.williamsR),
          "Closing location in the 14-session high-low range, from −100 to 0. Extremes can persist.",
        ],
        [
          "Efficiency ratio · 10",
          n(extra.efficiency),
          "Absolute 10-session change divided by total absolute daily movement, from 0 to 1; not a win probability.",
        ],
        [
          "RSI · 14",
          n(p.tech.rsi),
          "Completed-close relative strength oscillator.",
        ],
        [
          "MACD line / signal",
          s.macd == null || s.signal == null
            ? "Not established"
            : n(s.macd) + " / " + n(s.signal),
          "12/26-period EMA difference and 9-period signal.",
        ],
        [
          "MACD histogram",
          n(s.histogram),
          "MACD minus its signal; in quote-price units.",
        ],
        [
          "Stochastic %K / %D",
          x.stochasticK == null || x.stochasticD == null
            ? "Not established"
            : n(x.stochasticK) + " / " + n(x.stochasticD),
          "14-session range, unsmoothed %K and three-session %D.",
        ],
        [
          "5 / 20-session momentum",
          pct(pro.roc5) + " / " + pct(a.roc20),
          "Close-to-close price returns; no dividends or fees.",
        ],
        [
          "60 / 120-session momentum",
          pct(a.roc60) + " / " + pct(pro.roc120),
          "Longer completed-history price context.",
        ],
        [
          "Positive sessions · 20",
          pct(pro.upPct20),
          "Fraction of returns strictly above zero.",
        ],
      ],
    },
    {
      title: "Volatility & range",
      tone: "amber",
      note: "Historical variability and distance are descriptive. They are not guaranteed trading ranges.",
      rows: [
        [
          "Wilder ATR · 14",
          pct(x.atrPct),
          "Wilder-smoothed true range as a percentage of completed close.",
        ],
        [
          "Realized volatility · 30",
          pct(pro.vol30),
          "Sample deviation of daily log returns, annualized.",
        ],
        [
          "Bollinger width / %B",
          pct(x.bandwidth) + " / " + pct(x.percentB),
          "Band width relative to mean; %B can exceed 0–100%.",
        ],
        [
          "20-session price z-score",
          n(pro.z20),
          "Distance from mean in population standard deviations.",
        ],
        [
          "Current closing drawdown",
          pct(pro.currentDrawdown),
          "Relative to highest close in supplied completed history.",
        ],
        [
          "From annual high / low",
          pct(pro.distanceHigh) + " / " + pct(pro.distanceLow),
          "252 stock or 365 crypto observations; high/low references.",
        ],
      ],
    },
    {
      title: "Participation",
      tone: "green",
      note: "Volume measures do not identify institutions or prove buying pressure. Reported volume quality matters.",
      rows: [
        [
          "Money flow index · 14",
          n(extra.mfi),
          "Typical-price × volume, split by positive/negative typical-price movement. Requires valid positive volume; 0–100 oscillator.",
        ],
        [
          "Relative volume",
          n(a.relativeVolume, "×"),
          "Latest completed volume / preceding 20-observation mean.",
        ],
        [
          "20-session OBV change",
          pro.obv20 == null ? "Not established" : pro.obv20.toLocaleString(),
          "Volume signed by close-to-close direction, summed over 20 observations.",
        ],
        [
          "Chaikin money flow · 20",
          pct(pro.cmf),
          "Volume-weighted closing position inside each high/low range.",
        ],
        [
          "Up / down volume · 20",
          n(pro.upDownVolume, "×"),
          "Volume on up closes / down closes; flat closes excluded.",
        ],
        [
          "Average daily traded value",
          a.averageDollarVolume == null
            ? "Not established"
            : amount(a.averageDollarVolume, currency, true),
          "Previous 20 observations, close × reported volume; not order-book depth.",
        ],
      ],
    },
    {
      title: "Trend systems",
      tone: "blue",
      note: "Rule-based trend followers computed from completed daily bars. They lag turning points and describe past price behaviour; they do not establish value.",
      rows: [
        [
          "Supertrend · 10, 3",
          more.supertrend
            ? `${more.supertrend.direction === "up" ? "Up" : "Down"} · line ${m(more.supertrend.level)}`
            : "Not established",
          "Wilder ATR(10) × 3 bands around the high-low midpoint. The line is the support or resistance the rule currently follows; a close through it flips direction.",
        ],
        [
          "Parabolic SAR · 0.02 / 0.2",
          more.parabolicSar
            ? `${more.parabolicSar.direction === "up" ? "Up" : "Down"} · stop ${m(more.parabolicSar.level)}`
            : "Not established",
          "Wilder's accelerating stop-and-reverse level. It accelerates toward price during a trend and flips when price touches it; it whipsaws in sideways markets.",
        ],
        [
          "Ichimoku cloud · 9, 26, 52",
          more.ichimoku
            ? `Price ${more.ichimoku.position} the cloud · ${m(more.ichimoku.cloudBottom)} to ${m(more.ichimoku.cloudTop)}`
            : "History needed",
          "The cloud is the span between two midpoint averages projected 26 sessions ahead; the values shown are the cloud as it stands today. Needs 78 completed sessions.",
        ],
        [
          "Ichimoku Tenkan / Kijun",
          more.ichimoku ? `${m(more.ichimoku.tenkan)} / ${m(more.ichimoku.kijun)}` : "History needed",
          "Midpoints of the 9- and 26-session high-low ranges. Tenkan above Kijun indicates short-term strength relative to the medium term.",
        ],
        [
          "Aroon up / down · 25",
          more.aroon ? `${more.aroon.up.toFixed(0)} / ${more.aroon.down.toFixed(0)}` : "History needed",
          "How recently the 25-session high and low occurred, from 0 to 100. Up near 100 means a new high is recent; it measures timing, not size.",
        ],
        [
          "Keltner channel · 20, 10 × 2",
          more.keltner
            ? `Price ${more.keltner.position} the channel · ${m(more.keltner.lower)} to ${m(more.keltner.upper)}`
            : "History needed",
          "20-session exponential average ± 2 × ATR(10). Price outside the channel shows an unusually large move for recent volatility, not a reversal signal.",
        ],
      ],
    },
    {
      title: "Momentum and risk-adjusted",
      tone: "green",
      note: "Momentum oscillators and one-year risk statistics. No risk-free rate is subtracted, so the ratios are return per unit of risk, not Sharpe or Sortino ratios.",
      rows: [
        [
          "Awesome oscillator · 5, 34",
          n(more.awesome),
          "Difference between 5- and 34-session averages of the high-low midpoint, in quote-price units. Above zero means short-term momentum is above the longer base.",
        ],
        [
          "TRIX · 15",
          n(more.trix, "%"),
          "One-session percentage change of a triple-smoothed exponential average. It filters short noise; sign shows the direction of the smoothed trend.",
        ],
        [
          "Ultimate oscillator · 7, 14, 28",
          n(more.ultimate),
          "Buying pressure over true range blended across three windows, 0–100. Designed to reduce false signals from a single window; extremes can persist.",
        ],
        [
          "20-day volatility percentile",
          more.volatility
            ? `${n(more.volatility.current, "%")} · ${more.volatility.percentile.toFixed(0)}th percentile of the past year`
            : "History needed",
          "Annualized 20-session realized volatility, ranked against its own rolling values over the past year. High percentiles mean unusually active price movement for this company.",
        ],
        [
          "Past-year return / volatility",
          more.risk ? `${pct(more.risk.annualReturn)} / ${pct(more.risk.volatility)}` : "History needed",
          `Average daily return annualized, and the standard deviation of daily returns annualized, over ${more.risk?.observations ?? "the available"} sessions. Past behaviour only.`,
        ],
        [
          "Return per unit of volatility",
          n(more.risk?.returnPerVolatility),
          "Annualized return divided by annualized volatility, with no risk-free rate subtracted. Higher is better only within the same period and asset type.",
        ],
        [
          "Return per unit of downside",
          n(more.risk?.returnPerDownside),
          "Annualized return divided by downside deviation (only losing sessions count as risk, target 0). Not shown when there were no losing sessions.",
        ],
        [
          "Ulcer index · 1 year",
          n(more.risk?.ulcerIndex),
          "Root-mean-square of percentage drawdowns from the running peak. It rises with both the depth and the length of declines, so it penalizes slow recoveries.",
        ],
      ],
    },
  ];
  const priority = [
    "50-session average",
    "200-session average",
    "RSI · 14",
    "MACD line / signal",
    "MACD histogram",
    "Relative volume",
    "20-session OBV change",
    "Wilder ATR · 14",
    "Current closing drawdown",
  ];
  for (const group of groups)
    group.rows.sort((a, b) => {
      const x = priority.indexOf(a[0]),
        y = priority.indexOf(b[0]);
      return (x < 0 ? 99 : x) - (y < 0 ? 99 : y);
    });
  return (
    <section className="technical-dashboard depth-technicals">
      <header className="technical-desk-heading">
        <div>
          <span className="eyebrow">TECHNICALS · COMPLETED DAILY EVIDENCE</span>
          <h2>
            {p.tech.trend === "Constructive"
              ? "Trend constructive. Check momentum."
              : p.tech.trend === "Weak"
                ? "Trend weak. Watch participation and support."
                : "Price signals are mixed. Keep risk in view."}
          </h2>
          <p>
            {a.count} valid completed observations · through {dateLabel(a.asOf)}
            . Chart interval changes do not alter these daily studies.
          </p>
        </div>
      </header>
      <div className="technical-summary-strip">
        {[
          [
            "Trend",
            last != null && pro.ma50 != null
              ? last >= pro.ma50
                ? "Above 50 average"
                : "Below 50 average"
              : "History needed",
          ],
          [
            "Momentum",
            p.tech.rsi == null
              ? "History needed"
              : `RSI ${p.tech.rsi.toFixed(1)}`,
          ],
          [
            "Participation",
            a.relativeVolume == null
              ? "Volume needed"
              : `${a.relativeVolume.toFixed(2)}× usual volume`,
          ],
          [
            "Daily range",
            x.atrPct == null
              ? "History needed"
              : `${percent(x.atrPct)} Wilder ATR`,
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="technical-desk-groups">
        {groups.map((g) => (
          <section key={g.title} data-tone={g.tone}>
            <header>
              <h3>{g.title}</h3>
              <p>{g.note}</p>
            </header>
            <dl>
              {g.rows.map(([label, value, definition]) => (
                <div key={label}>
                  <dt>
                    <details>
                      <summary>{label}</summary>
                      <p>{definition}</p>
                    </details>
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <section className="technical-price-structure">
        <header className="section-head">
          <div>
            <span className="eyebrow">
              LEVELS · CONTEXT, NOT CONFIRMED SUPPORT
            </span>
            <h3>Price reference map</h3>
            <p>
              Automatic Fibonacci anchors use extremes in the last 63 valid
              observations. Open custom anchors to inspect a different
              selection.
            </p>
          </div>
          <button
            className="button"
            onClick={() => dialog.current?.showModal()}
          >
            Custom anchors
          </button>
        </header>
        {a.fib ? (
          <>
            <p className="small muted">
              Low {m(a.fib.low)} · {dateLabel(a.fib.lowDate)} / High{" "}
              {m(a.fib.high)} · {dateLabel(a.fib.highDate)}.{" "}
              {a.fib.direction === "up"
                ? "Pullbacks measured down from high."
                : "Rebounds measured up from low."}
            </p>
            <div className="technical-level-grid">
              {a.fib.levels.map((l) => (
                <div key={l.ratio}>
                  <span>Fib {l.ratio.toFixed(3)}</span>
                  <strong>{m(l.price)}</strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>More valid history and distinct dated extremes are required.</p>
        )}
        <div className="technical-level-grid">
          {[
            ["Prior 20-session high", extra.donchian20?.high],
            ["Prior 20-session low", extra.donchian20?.low],
            ["Prior 55-session high", extra.donchian55?.high],
            ["Prior 55-session low", extra.donchian55?.low],
            ["VWAP · window-low anchor", a.vwap],
            ["Classic S1", pro.pivots?.s1],
            ["Classic pivot", pro.pivots?.p],
            ["Classic R1", pro.pivots?.r1],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <span>{label}</span>
              <strong>
                {typeof value === "number" && value > 0
                  ? m(value)
                  : "Not established"}
              </strong>
            </div>
          ))}
        </div>
        <p className="small muted">
          VWAP uses daily typical prices and reported volume, not ticks. Classic
          pivots use the last completed OHLC bar. The 20/55-session channels
          exclude the latest close; they are prior observed extremes, not
          confirmed support. A touch does not confirm a reversal. Adjustments,
          sparse history and volume inconsistencies can distort studies. DCA
          contribution context remains in Overview; deeper tail-risk and trade
          planning are in Advanced.
        </p>
      </section>
      <dialog
        ref={dialog}
        className="dialog anchors-dialog"
        aria-label="Custom Fibonacci anchors"
      >
        <header className="dialog-head">
          <h2>Custom Fibonacci anchors</h2>
          <button
            className="icon-button"
            aria-label="Close anchors"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        <TechnicalLevels research={r} />
      </dialog>
    </section>
  );
}
