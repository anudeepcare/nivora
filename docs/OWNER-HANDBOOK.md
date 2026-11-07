# AURYN Owner Handbook
Private operating reference • source snapshot 7 November 2026

## 1. How to explain AURYN
Start with the business, then valuation, then price conditions, then portfolio limits. A price zone is one input; it is not proof that the business is healthy. Use the displayed observation date, reporting period and model version when answering questions. Quotes, financial statements, analyst expectations and options observations have different clocks.

A short explanation: “AURYN brings the evidence together. Pace describes the price zone, business checks determine whether accumulation qualifies, and your portfolio determines how much risk you can take.”

This handbook describes this source build. It does not prove that production runs the same version. The executable reference chapters at the end preserve exact thresholds, fallbacks and formulas; update this handbook whenever those modules change. No proprietary formula from the social-media screenshots has been inferred or copied.

## 2. Home and Discover
Home summarizes holdings, watchlist, confirmed Pace and dated company events. An item in Needs your attention is a review prompt, not an automatically executed trade. Missing event coverage is not evidence that no event exists.
Discover filters the loaded company universe by the selected criteria. Saved screens retain sector, Pace and quality criteria. A scan is not an exhaustive search of every listed security. Read the number checked and unavailable before comparing results.

Explain: “This is a shortlist to investigate. Open a company to inspect the evidence behind it.”

## 3. Research overview and price header
Read company identity, listing currency, price timestamp and session first. Market capitalization is a supplied or derived market measure; it is not enterprise value. A quote percentage change needs its displayed comparison basis. After-hours movement and completed daily indicators can legitimately disagree.
Revenue growth = (current comparable revenue / prior comparable revenue − 1) × 100. AURYN selects matching currency and period basis, with comparable prior periods approximately one year apart. Annual and TTM observations must not be blended casually. TTM is assembled from compatible quarterly evidence; balance-sheet amounts are point-in-time values, not four-quarter sums.
A blank or unassessed value is different from measured zero. A fallback quote must retain its date/status. Never describe an older observation as live.

## 4. Monthly Pace: exact current policy
The active monthly policy is monthly-v5, called through analysis.ts and the accumulation components. Older candidate/v3/v4 implementations remain in the repository; do not use their accumulation thresholds as the current monthly rules. V5 reuses v3's robust extension guard.

Inputs: at least 12 uninterrupted completed prior monthly closes; up to 24 prior months for the longer-cycle check. Fewer than 24 prior months is explicitly limited history. The evaluated month is excluded from its reference window. Invalid OHLC, conflicting duplicate observations and unsupported completion dates are excluded.

Let P be evaluated close, M the arithmetic mean of the preceding 12 monthly closes, and S = max(0.10 × M, sample standard deviation of those 12 closes, denominator 11). Deviation D = 100 × (P/M − 1); z = (P − M)/S. L is the mean of up to 24 consecutive prior closes.

Evaluate extension first. Otherwise apply deepest qualifying zone first:
P4: D ≤ −35% AND z ≤ −1.30.
P3: D ≤ −25% AND z ≤ −0.95.
P2: D ≤ −10% AND z ≤ −0.50.
P1: none of those pullback conditions qualifies.
A raw P3/P4 is capped at P2 when P > L. This longer-cycle check prevents a large recent pullback above the longer average from automatically becoming a deep zone.

P0: either the reused robust trend extension condition qualifies, or P ≥ 3M AND z ≥ 2. Robust guard: fit log closes with median pairwise slope and median intercept; residual center is their median; scale is max(0.07, 1.4826 × residual MAD, 1.4826 × return MAD × √3). Project trend T one period forward. Extension requires log(P/T)/scale ≥ 2 AND P/T ≥ 1.25.

Displayed conditional levels:
P2 = max(0, min(0.90M, M − 0.50S)).
P3 = min(max(0, min(0.75M, M − 0.95S)), L).
P4 = min(max(0, min(0.65M, M − 1.30S)), L).
Pause boundary is the smaller of the robust pause boundary and max(3M, M + 2S).
These are conditional levels against a fixed reference window. A future month changes the window and therefore can change the levels.

Worked example: M=100, S=20, L=85, P=64. D=−36%, z=−1.8, and P≤L: P4, assuming no extension condition. P=80 produces D=−20%, z=−1: P2. The same price alone cannot tell you Pace without its history.

## 5. Weekly Pace, confirmed versus forming, contribution rules
Weekly-v1 requires 52 consecutive completed prior weeks and uses the robust trend calculation with a 0.03 scale floor. It is a separate policy from monthly-v5. Weekly P4 requires drawdown ≤−40% and robust z≤−2; P3 ≤−25% and z≤−1.35; P2 ≤−12% and z≤−0.7. P0 uses robust z≥2 and price/trend≥1.25. The prior weekly peak supplies drawdown.
Confirmed refers to an eligible completed period. Forming uses the available settled observations of the current incomplete period and can change. Do not present forming P4 as confirmed P4, or call a monthly observation a daily signal.
P0 pauses new contributions; it is not automatically a sell. P1 watches for a new entry; existing owners may hold if the business remains supported. P2 starts small, P3 builds gradually, P4 permits the largest planned accumulation within limits.
Contribution guide, only when the separate action is Buy/Add: P2=1× planned contribution, P3=2×, P4=up to 4×. Other actions or unavailable levels get no qualifying contribution multiple. P4 is a level, not inherently a 4× purchase instruction. Cash and position limits still apply.

## 6. Why Buy, Add, Hold, Watch, Review, Reduce or Avoid?
Decision priority in assessDecision is explicit:
1. Unusable financials → Review.
2. Insolvency → Sell for an existing position, Avoid for a new one.
3. Funding distress or deterioration → Reduce for an owner, Avoid for a new buyer.
4. Unusable price → Review.
5. Unsupported business/growth case → Review.
6. Supported business + confirmed P0 → Hold/Wait; P1 → Hold/Watch; P2–P4 → Add/Buy.
7. With no qualifying confirmed Pace, attractive value and no extension can qualify Add/Buy; otherwise Review/history.
Ordinary-business support checks positive FCF, positive operating income and nonnegative comparable revenue growth. Financial-company checks use positive income, ROE≥8% and nonnegative growth. Specialist families and funded-growth alternatives have separate eligibility; consult the exact decision reference below for their gates.
Explain: “The price zone is attractive, but the business/data gate has not cleared.” A score of 8.9 does not override a funding gate.

## 7. Case & ownership
The case collects supporting evidence, risks and ownership context. Display weights express qualitative importance, not probabilities. Reported institutional holdings are dated disclosures; they do not show real-time buying. Ownership percentages can refer to different denominators and dates. Missing ownership or moat evidence remains unscored.
A saved thesis is the user's reasoning. AURYN does not establish that an earnings beat proves the thesis. Revisit demand, margins, funding, dilution and the original assumptions.

## 8. Business and financial metrics
Revenue: sales recognized for the period. Gross profit: revenue less compatible cost of revenue. Operating income excludes financing/tax effects; net income includes them. EPS is reported diluted earnings per share, with split and basis consistency required.
FCF = operating cash flow − capital expenditure outflow. Source sign normalization and compatible periods matter. This may differ from company-defined adjusted FCF.
Gross/operating/net/FCF margin = corresponding profit or cash measure / revenue ×100.
SBC/revenue = stock compensation/revenue ×100. Capex/revenue = absolute capex/revenue ×100.
FCF/share = FCF/weighted shares. SBC-adjusted FCF/share = (FCF−SBC)/weighted shares; this is a screening adjustment, not GAAP earnings.
Current ratio = current assets/current liabilities. Debt/equity = debt/equity. Net debt = debt−cash. Interest coverage = operating income/interest expense. Cash conversion = operating cash flow/net income.
ROE uses net income divided by average positive current/prior year-end equity. A small equity denominator can produce an unusually high figure. Negative or missing denominators are not treated as attractive multiples.
Growth = current/prior−1 with compatible positive comparison basis. CAGR = (ending/beginning)^(1/years)−1 where eligible. Percentage-point margin change is current percentage minus prior percentage, not percentage growth.
The Financial catalog reference below contains every displayed financial field and its help text. Financial formulas and period-selection references explain null guards, derived facts and compatibility.

## 9. Business scores and research styles
Evidence lenses: valuation, profitability, growth, financial health, cash quality, owner returns, business moat, ownership & expectations. Each scored metric is mapped through explicit absolute anchors using anchorScore; it is not a peer percentile. Each lens averages available scored metrics. The overall composite requires at least four scored lenses and is the weighted average of available lens scores; unavailable lenses do not silently become zero.
Style weights, in the lens order above:
Balanced: 1,1,1,1,1,1,1,1.
Value: 3,1,0.5,1.5,1.5,1,0.5,0.5.
Growth: 0.5,1.5,3,1,1,0.3,1.5,0.7.
Income: 1.5,1,0.5,1.5,1.5,3,1,0.5.
Quality: 0.7,2.5,1,1.5,2,0.5,2.5,0.3.
Changing style changes emphasis, not the Pace policy or decision gates. Read coverage, such as 5/8 lenses, beside the score. Exact per-metric anchors are in the Evidence scoring reference below.

## 10. Valuation
Keep reported market multiples, conditional valuation models and analyst targets separate. Multiples depend on compatible price/share/currency/financial-period inputs. A negative denominator is not a bargain multiple.
The decision cash-flow model starts with positive eligible cash/share. Each year's company growth fades linearly over 10 years from starting growth to terminal growth; cash/share is additionally divided by (1+dilution). Discount each cash/share by (1+discount)^year. Add discounted terminal cash/share/(discount−per-share terminal growth).
Decision scenarios: bear starts0%, discount15%, terminal1%; base starts comparable growth clamped0–10%, discount12%, terminal2%; bull starts min(15%,base growth+5%), discount10%, terminal3%. Invalid or unordered results are withheld. These are model assumptions, not promised outcomes or dynamically observed WACC.
The interactive fadeDcf model has its own selected assumptions and guards. It should not be described as identical to the decision model. Source references below distinguish them.
Implied annualized change = ((target/reference)^(1/years)−1)×100. The assumed horizon must be known. A scenario price is conditional on assumptions; it is not a probability-weighted forecast.

## 11. Technicals and trends
Completed daily prices feed indicators; the price header can be newer. SMA50/SMA200 are arithmetic means of the last50/200 eligible closes. Constructive: close>SMA50>SMA200. Weak: close<SMA50<SMA200. Otherwise Mixed; insufficient data Not assessed.
RSI14 uses initial average gains/losses and Wilder smoothing: next average=(13×previous+new)/14; RSI=100−100/(1+gain/loss). Flat gains/losses gives50; positive gain with no loss gives100.
Displayed ATR percent in analysis.ts = mean(last14 true ranges)/lastclose×100. True range=max(high−low,abs(high−previousclose),abs(low−previousclose)). This implementation is a simple14-range mean, not Wilder ATR.
Relative volume = latest completed session volume / mean(previous20 sessions excluding latest).
Weekly WMA weights oldest1 through newestN: Σ(weight×close)/[N(N+1)/2], requiring consecutive completed weeks. A 200-week WMA is not a 200-day average.
Fibonacci retracement = high−ratio×(high−low). Ratios include0.236,0.382,0.5,0.618,0.786;0.686 is custom. The standard indicator window uses recent126 eligible bars. Chart-selected anchors may differ. Extensions use the separate overlay convention shown in technical-depth.ts.
Trend-alignment markers occur when close>SMA50>SMA200 becomes true after being false. Marker price/date is the qualifying historical observation; the displayed invalidation reference is SMA50 then. It does not prove a future profitable trade.
CCI20=(typical price−mean typical price)/(0.015×mean absolute deviation). Typical price=(H+L+C)/3. Williams %R14=−100×(highesthigh−close)/(highesthigh−lowestlow). MFI uses positive/negative typical-price×volume flows over14 changes. Efficiency10=absolute net10-change move/sum absolute changes.
Other technical studies, exact windows, seeding and gates are preserved in the Price studies and expanded technical references. Explain one study at a time; a cluster of related indicators is not independent evidence.

## 12. Targets, estimates and historical price risk
Analyst consensus is supplied opinion. Target contributors, target horizon and individual publication dates cannot be invented from rating counts or dataset timestamps. Annual estimates are expectations, not actual results.
Historical price risk uses up to1260 settled bars, at least80 bars and40 intact return windows. Horizon63 sessions when at least252 bars, otherwise20. It computes log(close_end/close_start), interpolates empirical10th/50th/90th percentiles, then applies them to the reference price with exp(return). Overlapping windows are not independent trials. These percentiles are not calibrated future probabilities, fair values or analyst targets.
A target's percent change =100×(target/reference−1). Reference date and currency must accompany it.

## 13. News & earnings
EPS surprise compares supplied actual and estimate; confirm GAAP/adjusted basis before explaining a beat. Revenue/margin evidence may end before the announcement. Earnings time can be unconfirmed. A revenue increase does not establish guidance, cash collection or a future stock move.
Use the original release for guidance, cash conversion, share dilution and one-off items. The app's earnings-to-thesis prompt identifies questions, not an automatic thesis verdict.

## 14. Options: reading order and vocabulary
First check stock reference price, options observation date, expiry, loaded-contract coverage and missing fields. Strike is the contract's exercise price. Expiration is when the option expires; it is not the observation date. Calls and puts grant different rights; their presence alone does not identify the trader's direction or dealer inventory.
Premiums are per share. A standard contract controls100 shares. Premium2.50 means250 dollars per contract before costs. Nonstandard deliverables are excluded from these models.
Volume counts reported trades in the session. Open interest counts outstanding contracts at its observation. Neither establishes whether someone bought to open, sold to open or closed a position. Highest volume, highest OI and strongest gamma are three different rankings.
Nearest-strike straddle proxy = eligible call midpoint+put midpoint at the same nearest strike and expiry. It is an option-priced move proxy, not a guaranteed trading range. A midpoint is indicative, not executable.
Guide is the starting explanation; Calls & puts shows contracts; Price levels shows concentration; Practice uses simulated money; advanced tools expose additional models without changing the underlying data.

## 15. Gamma heatmap: formula and every control
For each eligible standard contract: unsigned gamma dollars per1% stock move = gamma × open interest ×100×stockprice²×0.01. Apply + to calls, − to puts, then sum within strike/expiry. This call-positive/put-negative convention is a model assumption; it does not reveal actual dealer long/short inventory and is not automatically bullish/bearish.
Example: gamma0.02, OI1000, stock100 →200,000 gamma dollars per1% move for one call bucket; same put inputs →−200,000. Summing can cancel large opposing exposures.
A cell requires coherent observation dates and valid gamma/OI for all included contracts. Missing data is null, not zero. Loaded coverage is not necessarily the complete market. A historical timestamp and current spot can mix sensitivities; read both.
Measure switches gamma estimate versus OI (and any available activity view); the units and meaning change. Nearby strikes limits visible strike rows around price. Expiration range All/1/2/6 months selects loaded future expirations; it does not create daily historical gamma observations. Hide values below suppresses small visible values; it is not removal of underlying contracts. % of largest rescales relative to the selected view's maximum; it is not probability.
Heatmap shows strike rows and expiry columns. Key levels ranks measured concentrations for easier reading. Strongest concentration means largest absolute measured exposure in the visible selection. Above/below price refers to strike relative to stockprice. Selection changes can change the strongest cell. Center moves to the price region; Largest selects the biggest measured cell; tapping a cell shows date/inputs. Save snapshot records the current loaded view; Export exports its evidence; Contracts opens contract detail.
Say: “The largest measured concentration is around this strike for this expiry. We watch how price behaves there.” Do not say “price must touch or bounce here.” A data gap is not a proven gamma air pocket.

## 16. Gamma flip, Vanna, trade tape and advanced options
Gamma flip is a modeled zero crossing, not an observed inventory fact. Current implementation requires complete selected coverage, coherent gamma/OI inputs and IV. It reprices gamma at81 spots from0.5× to1.5×reference using Black–Scholes, fixed4% rate and the code's expiry-time convention, then linearly interpolates sign crossings. Missing prerequisites mean no supported flip.
Vanna = −exp(−qT)×normalDensity(d1)×d2/IV, with d1=[ln(S/K)+(r−q+IV²/2)T]/(IV√T), d2=d1−IV√T. Defaults r4%, q0. Units are sensitivity per absolute decimal-IV change before the exposure scaling in options-vanna.ts. European-model approximations do not model every American exercise/dividend feature.
Trade tape only describes the supplied trade observations. Do not imply complete market coverage or buyer/seller intention without supplied classification. Strategy payoffs and long-dated views depend on their explicit contract and scenario assumptions.
Snapshot comparison requires compatible stock reference and identical contract universe in compareExposure. Otherwise it declines to produce a misleading exposure-change ranking. Saved device history is not a provider's complete historical archive.

## 17. Practice / option simulation
Starting simulated cash100,000. Long calls/puts only, premiums paid in full, standard100-share contracts. Entry uses supplied ask; exit and open marks use supplied bid. Quote dates cannot be future dated or more than3 calendar days old. No real broker order is placed.
Debit=ask×100×contracts. Open marked value=bid×100×remainingcontracts. Open P/L=(bid−entrypremium)×100×remainingcontracts. Realized P/L sums(exitpremium−entrypremium)×100×closedcontracts. Equity=cash+eligible open marked values. Fees and slippage are excluded; unavailable marks must not be presented as reliable equity.
Your screenshot's ask277.59 means27,759 for one standard contract, not277.59 total. A deep in-the-money strike can have a large premium; that alone is not a quote error. Check the timestamp, bid/ask, underlying and contract identity.
A current stock reference is not a verified expiry closing price. Do not settle an expired option from an unrelated current quote. Save on device and Save to account are separate persistence actions; read their status before assuming synchronization.

## 18. Watchlist and portfolio
Watchlist groups monitored symbols and confirmed Pace; it is not a portfolio. Pending means insufficient eligible evidence, not P0. Company events have their own timestamps.
Holding value=quantity×eligible quote. Cost=quantity×recorded average cost. Unrealized gain=value−cost; return%=gain/cost×100 when denominator eligible. Portfolio weight needs a clearly stated denominator, currency and coverage. Cash, managed balances and margin are separate from marked securities.
Current holdings plotted at past prices is a hypothetical holdings-value history, not actual account performance. Deposits, withdrawals, historical trades, fees and changing positions make the difference.
Transactions support USD buys, sells, deposits, withdrawals, dividends, fees and splits. Average-cost reconciliation is not tax-lot accounting. Import is previewed, validated and saved with revision conflict protection. Append skips exact duplicates and rejects conflicting IDs; replacement explicitly corrects the complete ledger. Reconciling transactions does not silently overwrite manually recorded holdings.
Annualized money-weighted return solves Σ cashflow_i/(1+r)^((date_i−date_0)/365)=0 including ending value. It is withheld when the ledger is draft, not confirmed complete, disagrees with holdings, has incompatible/missing marks, errors, insufficient duration or ambiguous cash flows. It is not time-weighted performance. Broker synchronization, FX, mergers and tax-lot reporting require additional implementation/data.

## 19. Advanced research, comparisons and planning
Advanced evidence adds depth; scores and scenario assumptions remain separate from confirmed Pace. Compare companies using matching metric definitions, currencies and periods; do not rank a bank with ordinary-business FCF rules. Unscored specialist sectors are not zero-quality companies.
Planning combines the qualifying action, contribution guide and user limits. A historical replay is an experiment under assumptions, not an actual strategy return or proof of future advantage. Examine costs, sampling, missing history and whether inputs were known at each historical date.
Settings change presentation and access preferences; a different density, color theme or research style must not silently change price history or financial facts.

## 20. Owner operations and support explanations
People controls grant/revoke dated complimentary access to an existing account. Preview access lets the owner inspect plan restrictions without changing the subscription. Features controls availability; Payments reports supported billing operations and readiness, not fabricated revenue. Support search/status/priority/assignment/bulk actions operate on authorized tickets; email delivery needs configured production infrastructure.
When asked about a number, record symbol, tab, field, screenshot, observation time, reporting period, selected expiry/window and model version. Reproduce those selections; inspect the exact inputs; distinguish missing from zero; verify units; then explain the rule. If production differs from this handbook snapshot, investigate version/data mismatch before asserting an algorithm bug.

## 21. Answers you can reuse
“Why is it P4 while falling?” Pace measures a historically deep price zone, not a confirmed bottom. Business and portfolio checks still apply.
“Why P1 but a good business?” Business quality and the price accumulation zone answer different questions.
“Why weekly and monthly disagree?” They use different windows and policies; neither should be relabeled as the other.
“Does green gamma mean buy?” No. It reflects the model's sign and magnitude convention; it is not known dealer inventory or a directional instruction.
“Why no number?” The required compatible inputs are unavailable or fail validation. Zero would mean a measured result.
“Why does the score change with style?” The same evidence receives different explicit weights. Pace and action rules do not change.
“Why doesn't my portfolio chart match my broker?” Current-holdings history excludes actual timing of trades and flows. Compare a complete reconciled transaction ledger instead.

## 22. Exact implementation reference
The following chapters preserve the actual source for detailed formula, threshold, validation and fallback questions. They are owner-only supporting material, not public explanatory copy. File hashes identify the source snapshot. Function names make individual calculations searchable. No secrets or environment values are included.

## Reference: accumulation-policy-v5
Source: lib/accumulation-policy-v5.ts
SHA-256: e84c1c261b7a04e5a11f96a15f9d5f4e5fb9db5df152160f7e09c237bc8b03e9

```typescript
import type { Candle, Signal } from "./types";
import {
  adaptiveSettledBars,
  trendAccumulationReading,
  type AdaptiveSignal,
} from "./accumulation-policy-v3.ts";
import { monthEndSession } from "./calendar.ts";
import { evidenceMemo } from "./evidence-memo.ts";
export { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
export const ACCUMULATION_VERSION = "monthly-v5";
export type CycleSignal = AdaptiveSignal & {
  trimTier: "light" | "strong" | null;
  historyBasis: "standard" | "limited";
  priorMonths: number;
  longTrend: number;
  cycleCorroborated: boolean;
};
/** Original calibrated policy. No instrument-specific branches or future inputs. */
export function cycleReading(
  previous: Candle[],
  bar: Candle,
  legacy: AdaptiveSignal,
): CycleSignal | null {
  const window = previous.slice(-12);
  if (
    window.length !== 12 ||
    !window.every((b) => Number.isFinite(b.close) && b.close > 0) ||
    !Number.isFinite(bar.close) ||
    bar.close <= 0
  )
    return null;
  const trend = window.reduce((s, b) => s + b.close, 0) / 12;
  const spread = Math.max(
    trend * 0.1,
    Math.sqrt(window.reduce((s, b) => s + (b.close - trend) ** 2, 0) / 11),
  );
  const deviation = (bar.close / trend - 1) * 100,
    z = (bar.close - trend) / spread;
  const severeExtension = bar.close >= 3 * trend && z >= 2,
    extension = legacy.multiplier === 0 || severeExtension;
  const rawMultiplier: Signal["multiplier"] = extension
    ? 0
    : deviation <= -35 && z <= -1.3
      ? 4
      : deviation <= -25 && z <= -0.95
        ? 3
        : deviation <= -10 && z <= -0.5
          ? 2
          : 1;
  const longer = previous.slice(-24);
  if (!longer.every((b) => Number.isFinite(b.close) && b.close > 0))
    return null;
  const longTrend = longer.reduce((n, b) => n + b.close, 0) / longer.length;
  const cycleCorroborated = bar.close <= longTrend;
  const multiplier: Signal["multiplier"] =
    rawMultiplier >= 3 && !cycleCorroborated ? 2 : rawMultiplier;
  const strong =
    legacy.trimReview ||
    (severeExtension && z >= 3 && bar.close / window.at(-1)!.close >= 1.5);
  const trimTier = extension ? (strong ? "strong" : "light") : null;
  const level = (distance: number, deviations: number) =>
    Math.max(0, Math.min(trend * (1 - distance), trend - deviations * spread));
  const limited = previous.length < 24;
  return {
    ...legacy,
    multiplier,
    trend,
    z,
    scale: spread / trend,
    deviation,
    trimTier,
    trimReview: !!trimTier,
    historyBasis: limited ? "limited" : "standard",
    priorMonths: previous.length,
    longTrend,
    cycleCorroborated,
    buy2: level(0.1, 0.5),
    buy3: Math.min(level(0.25, 0.95), longTrend),
    buy4: Math.min(level(0.35, 1.3), longTrend),
    pauseAbove: Math.min(
      legacy.pauseAbove,
      Math.max(3 * trend, trend + 2 * spread),
    ),
    reason:
      (extension
        ? `${strong ? "Strong" : "Light"} price-extension review; no sale amount is implied.`
        : multiplier === 1
          ? "Ordinary cycle-relative conditions; increased contributions are not established."
          : `${Math.abs(deviation).toFixed(1)}% below the prior 12-month average and ${Math.abs(z).toFixed(2)} prior-window spread units below it.`) +
      (rawMultiplier >= 3 && !cycleCorroborated
        ? " Stronger upsize is capped at 2×: price remains above the longer-cycle average."
        : "") +
      (limited
        ? ` Limited consecutive history: ${previous.length} prior completed months.`
        : ""),
  };
}
const monthIndex = (m: string) =>
  Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
function compute(bars: Candle[], asOf: string, market: "us-equity" | "crypto") {
  const empty = {
    version: ACCUMULATION_VERSION,
    confirmed: null as CycleSignal | null,
    forming: null as CycleSignal | null,
    history: [] as CycleSignal[],
    reason:
      "At least 12 consecutive completed prior months and a settled observation are required.",
  };
  if (!Number.isFinite(Date.parse(asOf))) return empty;
  const month = new Intl.DateTimeFormat("en-CA", {
    timeZone: market === "crypto" ? "UTC" : "America/New_York",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(asOf));
  const current = `${month.find((x) => x.type === "year")!.value}-${month.find((x) => x.type === "month")!.value}`;
  const rows = [
    ...new Map(
      adaptiveSettledBars(bars, asOf, market).map((b) => [
        b.time.slice(0, 7),
        b,
      ]),
    ).entries(),
  ];
  const history: CycleSignal[] = [];
  let forming: CycleSignal | null = null;
  for (let i = 12; i < rows.length; i++) {
    const [m, bar] = rows[i];
    // Only the trailing uninterrupted segment can support a monthly window.
    // An older gap cannot invalidate 12 complete months, or masquerade as a
    // 24-month slow guard by pulling an even older observation into its place.
    let start = i;
    for (let j = i - 1; j >= Math.max(0, i - 24); j--) {
      const [key, previous] = rows[j],
        next = rows[j + 1][0];
      if (
        previous.time !== monthEndSession(key, market) ||
        monthIndex(next) - monthIndex(key) !== 1
      )
        break;
      start = j;
    }
    const prior = rows.slice(start, i);
    if (prior.length < 12) continue;
    const closed = bar.time === monthEndSession(m, market);
    if (m < current && !closed) continue;
    const observations = prior.map(([, b]) => b),
      reading = cycleReading(
        observations,
        bar,
        trendAccumulationReading(observations, bar),
      );
    if (
      !reading ||
      !Object.values(reading).every(
        (v) => typeof v !== "number" || Number.isFinite(v),
      )
    )
      continue;
    if (closed) history.push(reading);
    else if (m === current) forming = reading;
  }
  const last = history.at(-1),
    confirmed =
      last && monthIndex(current) - monthIndex(last.month) <= 1 ? last : null;
  return {
    ...empty,
    confirmed,
    forming,
    history,
    reason:
      confirmed || forming
        ? "Cycle-relative contribution conditions; not company value or a return prediction."
        : empty.reason,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function researchAccumulation(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  return memo(bars, `${asOf}:${market}`, () => compute(bars, asOf, market));
}

```

## Reference: accumulation-policy-v3
Source: lib/accumulation-policy-v3.ts
SHA-256: 633f2609c5b54db25783f580456a1438c8bf2872e689780276c4a3e3cb9403b3

```typescript
import type { Candle, Signal } from "./types";
import { monthEndSession } from "./calendar.ts";
import { evidenceMemo } from "./evidence-memo.ts";
export const ACCUMULATION_VERSION = "monthly-v3";
export type AdaptiveSignal = Signal & {
  date: string;
  trend: number;
  z: number;
  scale: number;
  buy2: number;
  buy3: number;
  buy4: number;
  pauseAbove: number;
  trimReview: boolean;
  risk: string;
};
const median = (values: number[]) => {
  const a = [...values].sort((x, y) => x - y),
    i = Math.floor(a.length / 2);
  return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
};
const monthIndex = (m: string) =>
  Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
function settlement(asOf: string, market: "us-equity" | "crypto") {
  const at = new Date(asOf);
  if (!Number.isFinite(at.getTime())) return null;
  const timeZone = market === "crypto" ? "UTC" : "America/New_York";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  return {
    day,
    month: day.slice(0, 7),
    includeDay: market === "us-equity" && Number(parts.hour) >= 17,
  };
}
export function adaptiveSettledBars(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  const cutoff = settlement(asOf, market);
  if (!cutoff) return [];
  const seen = new Map<string, Candle>();
  for (const b of bars) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(b.time) ||
      !Number.isFinite(Date.parse(b.time)) ||
      new Date(b.time).toISOString().slice(0, 10) !== b.time ||
      b.time > cutoff.day ||
      (!cutoff.includeDay && b.time === cutoff.day) ||
      ![b.open, b.high, b.low, b.close].every(
        (x) => Number.isFinite(x) && x > 0,
      ) ||
      b.high < Math.max(b.open, b.close, b.low) ||
      b.low > Math.min(b.open, b.close, b.high)
    )
      continue;
    if (
      market === "us-equity" &&
      [0, 6].includes(new Date(b.time + "T12:00:00Z").getUTCDay())
    )
      continue;
    const previous = seen.get(b.time);
    // Conflicting duplicate closes cannot silently win by input order.
    if (
      previous &&
      [previous.open, previous.high, previous.low, previous.close].some(
        (x, i) => x !== [b.open, b.high, b.low, b.close][i],
      )
    )
      seen.set(b.time, { ...b, close: NaN });
    else if (!previous) seen.set(b.time, b);
  }
  return [...seen.values()]
    .filter((b) => Number.isFinite(b.close))
    .sort((a, b) => a.time.localeCompare(b.time));
}
export function trendAccumulationReading(
  previous: Candle[],
  bar: Candle,
  cadence: "monthly" | "weekly" = "monthly",
): AdaptiveSignal {
  const logs = previous.map((b) => Math.log(b.close)),
    slopes: number[] = [];
  for (let i = 0; i < logs.length; i++)
    for (let j = i + 1; j < logs.length; j++)
      slopes.push((logs[j] - logs[i]) / (j - i));
  const slope = median(slopes),
    intercept = median(logs.map((v, i) => v - slope * i));
  const residuals = logs.map((v, i) => v - intercept - slope * i),
    centre = median(residuals);
  const returns = logs.slice(1).map((v, i) => v - logs[i]),
    returnCentre = median(returns);
  const scale = Math.max(
    cadence === "weekly" ? 0.03 : 0.07,
    1.4826 * median(residuals.map((x) => Math.abs(x - centre))),
    1.4826 *
      median(returns.map((x) => Math.abs(x - returnCentre))) *
      Math.sqrt(3),
  );
  const trend = Math.exp(intercept + slope * logs.length + centre),
    peak = Math.max(...previous.map((b) => b.close));
  const z = Math.log(bar.close / trend) / scale,
    drawdown = Math.min(0, (bar.close / peak - 1) * 100),
    deviation = (bar.close / trend - 1) * 100;
  const multiplier: Signal["multiplier"] =
    z >= 2 && bar.close / trend >= 1.25
      ? 0
      : drawdown <= -40 && z <= -2
        ? 4
        : drawdown <= -25 && z <= -1.35
          ? 3
          : drawdown <= -12 && z <= -0.7
            ? 2
            : 1;
  const last3 =
    [...previous.slice(-2), bar].reduce((s, b) => s + b.close, 0) / 3;
  const last6 =
    [...previous.slice(-5), bar].reduce((s, b) => s + b.close, 0) / 6;
  const falling = bar.close < last3 && last3 < last6;
  return {
    month: bar.time.slice(0, 7),
    date: bar.time,
    close: bar.close,
    multiplier,
    drawdown,
    deviation,
    trend,
    z,
    scale,
    buy2: Math.min(peak * 0.88, trend * Math.exp(-0.7 * scale)),
    buy3: Math.min(peak * 0.75, trend * Math.exp(-1.35 * scale)),
    buy4: Math.min(peak * 0.6, trend * Math.exp(-2 * scale)),
    pauseAbove: Math.max(trend * 1.25, trend * Math.exp(2 * scale)),
    trimReview:
      z >= 3 &&
      bar.close / previous.at(cadence === "weekly" ? -26 : -12)!.close >= 1.5,
    risk: falling
      ? "Downtrend persists; the zone does not confirm support."
      : "Price condition only; check business, funding and position risk.",
    reason:
      multiplier === 0
        ? `${deviation.toFixed(1)}% above its prior fitted trend; an extension condition.`
        : multiplier === 1
          ? "A stronger pullback condition is not established."
          : `${Math.abs(drawdown).toFixed(1)}% below the prior ${cadence} high and ${Math.abs(z).toFixed(1)} robust deviations below trend.`,
  };
}
function compute(bars: Candle[], asOf: string, market: "us-equity" | "crypto") {
  const cutoff = settlement(asOf, market),
    groups = new Map<string, Candle>();
  const empty = {
    version: ACCUMULATION_VERSION,
    confirmed: null as AdaptiveSignal | null,
    forming: null as AdaptiveSignal | null,
    history: [] as AdaptiveSignal[],
    reason:
      "24 consecutive completed prior months and a settled observation are required.",
  };
  if (!cutoff) return empty;
  for (const b of adaptiveSettledBars(bars, asOf, market))
    groups.set(b.time.slice(0, 7), b);
  const rows = [...groups.entries()],
    history: AdaptiveSignal[] = [];
  let forming: AdaptiveSignal | null = null;
  for (let i = 24; i < rows.length; i++) {
    const prior = rows.slice(i - 24, i),
      [month, bar] = rows[i];
    if (
      prior.some(
        ([m, b], j) =>
          b.time !== monthEndSession(m, market) ||
          (j > 0 && monthIndex(m) - monthIndex(prior[j - 1][0]) !== 1),
      ) ||
      monthIndex(month) - monthIndex(prior.at(-1)![0]) !== 1
    )
      continue;
    const closed = bar.time === monthEndSession(month, market);
    if (month < cutoff.month && !closed) continue;
    const signal = trendAccumulationReading(
      prior.map(([, b]) => b),
      bar,
    );
    if (
      !Object.values(signal).every(
        (v) => typeof v !== "number" || Number.isFinite(v),
      )
    )
      continue;
    if (closed) history.push(signal);
    else if (month === cutoff.month) forming = signal;
  }
  const latest = history.at(-1),
    confirmed =
      latest && monthIndex(cutoff.month) - monthIndex(latest.month) <= 1
        ? latest
        : null;
  return {
    ...empty,
    confirmed,
    forming,
    history,
    reason: confirmed
      ? "Trend-adjusted price conditions; not a return prediction or company valuation."
      : empty.reason,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function researchAccumulation(
  bars: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  return memo(bars, `${asOf}:${market}`, () => compute(bars, asOf, market));
}

```

## Reference: accumulation-weekly
Source: lib/accumulation-weekly.ts
SHA-256: 6b4041af27feecfd170cc53a410cdf5e11009fb903e87b8dfb528ba7fe1ad779

```typescript
import type { Candle } from "./types";
import {
  adaptiveSettledBars,
  trendAccumulationReading,
  type AdaptiveSignal,
} from "./accumulation-policy-v3.ts";
import { evidenceMemo } from "./evidence-memo.ts";
type Market = "us-equity" | "crypto";
const dayMs = 86400000;
/** Week keys are Friday for US equities, Sunday for 24/7 crypto. */
export function weekKey(day: string, market: Market = "us-equity") {
  const d = new Date(day + "T12:00:00Z");
  const weekday = d.getUTCDay();
  // Weekend equity observations belong to the preceding Friday; input filtering rejects them.
  const delta =
    market === "crypto" ? (7 - weekday) % 7 : weekday === 0 ? -2 : 5 - weekday;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
/** Standard Friday closures only; exceptional/missing final sessions withhold the reading.
 * NYSE calendar: https://www.nyse.com/markets/hours-calendars
 * New Year's Saturday has no preceding-Friday closure (year-end exception).
 */
export function weekEndSession(day: string, market: Market = "us-equity") {
  const key = weekKey(day, market);
  if (market === "crypto") return key;
  const y = Number(key.slice(0, 4)),
    a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    n = Math.floor((a + 11 * h + 22 * l) / 451),
    em = Math.floor((h + l - 7 * n + 114) / 31),
    ed = ((h + l - 7 * n + 114) % 31) + 1;
  const goodFriday = new Date(Date.UTC(y, em - 1, ed - 2))
    .toISOString()
    .slice(0, 10);
  const fridayHolidays = new Set([
    goodFriday,
    `${y}-01-01`,
    `${y}-07-04`,
    `${y}-07-03`,
    `${y}-12-25`,
    `${y}-12-24`,
  ]);
  if (y >= 2022) {
    fridayHolidays.add(`${y}-06-19`);
    fridayHolidays.add(`${y}-06-18`);
  }
  return fridayHolidays.has(key)
    ? new Date(Date.parse(key) - dayMs).toISOString().slice(0, 10)
    : key;
}
function compute(bars: Candle[], asOf: string, market: Market) {
  const empty = {
    version: "weekly-v1",
    confirmed: null as AdaptiveSignal | null,
    forming: null as AdaptiveSignal | null,
    history: [] as AdaptiveSignal[],
    bars: [] as Candle[],
    reason:
      "52 consecutive completed prior weeks and a settled observation are required.",
  };
  if (!Number.isFinite(Date.parse(asOf))) return empty;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: market === "crypto" ? "UTC" : "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(asOf));
  const currentWeek = weekKey(today, market),
    groups = new Map<string, Candle>();
  for (const bar of adaptiveSettledBars(bars, asOf, market)) {
    const key = weekKey(bar.time, market),
      prior = groups.get(key);
    groups.set(
      key,
      prior
        ? {
            ...prior,
            time: bar.time,
            high: Math.max(prior.high, bar.high),
            low: Math.min(prior.low, bar.low),
            close: bar.close,
            volume: prior.volume + bar.volume,
          }
        : { ...bar },
    );
  }
  const rows = [...groups.entries()],
    history: AdaptiveSignal[] = [];
  let forming: AdaptiveSignal | null = null;
  for (let i = 52; i < rows.length; i++) {
    const prior = rows.slice(i - 52, i),
      [key, bar] = rows[i];
    if (
      prior.some(
        ([k, b], j) =>
          b.time !== weekEndSession(k, market) ||
          (j > 0 && Date.parse(k) - Date.parse(prior[j - 1][0]) !== 7 * dayMs),
      ) ||
      Date.parse(key) - Date.parse(prior.at(-1)![0]) !== 7 * dayMs
    )
      continue;
    const complete = bar.time === weekEndSession(key, market);
    if (key < currentWeek && !complete) continue;
    const signal = trendAccumulationReading(
      prior.map(([, b]) => b),
      bar,
      "weekly",
    );
    if (
      !Object.values(signal).every(
        (v) => typeof v !== "number" || Number.isFinite(v),
      )
    )
      continue;
    if (complete) history.push(signal);
    else if (key === currentWeek) forming = signal;
  }
  const end = weekEndSession(currentWeek, market),
    hour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(new Date(asOf)),
    );
  const completed =
    today > end || (market === "us-equity" && today === end && hour >= 17);
  const expected = completed
    ? currentWeek
    : new Date(Date.parse(currentWeek) - 7 * dayMs).toISOString().slice(0, 10);
  const latest = history.at(-1),
    confirmed =
      latest && weekKey(latest.date, market) === expected ? latest : null;
  return {
    ...empty,
    history,
    bars: [...groups.values()],
    confirmed,
    forming,
    reason: confirmed
      ? "Weekly price conditions are separate from monthly contribution discipline; no return prediction."
      : empty.reason,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function weeklyAccumulation(
  bars: Candle[],
  asOf: string,
  market: Market = "us-equity",
) {
  return memo(bars, `${asOf}:${market}`, () => compute(bars, asOf, market));
}

```

## Reference: pace-presentation
Source: lib/pace-presentation.ts
SHA-256: 7337b08fa0ef03c2b6c35303a8358616f036d0967ef354dad914e7dfc45a7135

```typescript
import type { DecisionAction } from "./auryn-decision";

export const PACE_LEVELS = [
  "Paused",
  "Watch zone",
  "Initial zone",
  "Deeper zone",
  "Deep zone",
] as const;
export const PACE_DESCRIPTIONS = [
  "Price-extension pause. Pause new buying and reassess; this is not a sell signal.",
  "No accumulation zone established. Watch for a new entry; hold if already owned and the business remains supported.",
  "Initial accumulation zone. Start or add small if the business qualifies, within your cash budget and position limit.",
  "Deeper accumulation zone. Buy or add gradually if the business qualifies, within your cash budget and position limit.",
  "Deepest qualifying price zone. Consider a larger part of your planned accumulation only if the business qualifies, within your cash budget and position limit.",
] as const;
export const PACE_EXPLANATION =
  "P means Pace — AURYN’s accumulation-zone scale. P0 pauses buying; P1 watches; P2 starts small; P3 builds gradually; P4 supports deeper planned accumulation when the business qualifies. Levels describe price conditions relative to history, not purchase multiples, business quality, fair value or expected returns. Business risks can block buying at any level.";
export function paceLevel(value: number | null | undefined): number | null {
  return value != null && Number.isInteger(value) && value >= 0 && value <= 4
    ? value
    : null;
}
export function paceCode(value: number | null | undefined): string {
  const level = paceLevel(value);
  return level == null ? "Pending" : `P${level}`;
}
export function contributionGuide(action: DecisionAction, level: number | null | undefined) {
  const rawLevel = paceLevel(level);
  const permitted = action === "Buy" || action === "Add";
  const multiple = permitted && rawLevel != null && rawLevel >= 2
    ? rawLevel === 2 ? 1 : rawLevel === 3 ? 2 : 4
    : 0;
  if (multiple === 0) {
    const gatedZone = action === "Review" && rawLevel != null;
    const label =
      rawLevel === 0
        ? "0× · price pause"
        : ["Reduce", "Sell", "Avoid"].includes(action)
          ? "Additions blocked"
          : gatedZone
            ? `${paceCode(rawLevel)} zone · business gate`
          : action === "Review"
            ? rawLevel == null
              ? "Business evidence pending"
              : `${paceCode(rawLevel)} zone · business gate`
            : action === "Watch" && rawLevel === 1
              ? "P1 watch zone"
              : rawLevel != null
                ? `${paceCode(rawLevel)} zone · entry pending`
                : "Entry conditions pending";
    const meaning =
      rawLevel === 0
        ? "P0 is a price-extension pause. New buyer: pause; existing holder: this is not a sell signal."
        : ["Reduce", "Sell", "Avoid"].includes(action)
          ? "A risk action takes priority over the price zone. Do not add until the holding case is reviewed."
          : gatedZone
            ? `A confirmed ${paceCode(rawLevel)} price zone is visible. Complete the stated business and data checks before assigning a contribution; the zone does not override them.`
          : action === "Review"
            ? "A price zone may be visible, but the business or data checks have not qualified a contribution."
            : rawLevel === 1
              ? "P1 is a watch zone. No contribution multiple is assigned yet; existing holders can hold only while the business case remains supported."
              : "The price zone is visible, but this assessment does not qualify a contribution. Existing holders should follow the separate holding guidance.";
    return { multiple: 0, label, meaning } as const;
  }
  if (multiple === 1)
    return {
      multiple: 1,
      label: "1× your planned contribution",
      meaning: "Start with your normal planned amount.",
    } as const;
  if (multiple === 2)
    return {
      multiple: 2,
      label: "2× your planned contribution",
      meaning: "Twice your normal planned amount.",
    } as const;
  return {
    multiple: 4,
    label: "Up to 4× your planned contribution",
    meaning: "A maximum guide, only within your budget and position limit.",
  } as const;
}
type Reading = {
  multiplier?: number | null;
  date?: string | null;
  month?: string | null;
  reason?: string | null;
};
/** Choose the latest available display reading without masking its state. */
export function dcaDisplay(input: {
  confirmed?: Reading | null;
  forming?: Reading | null;
}) {
  const reading = input.confirmed ?? input.forming ?? null;
  return {
    reading,
    period: input.confirmed
      ? `${input.confirmed.month ?? ""} · confirmed`
      : input.forming
        ? "Current month · forming"
        : "View coverage",
  } as const;
}
/** Keep period identity: a forming P4 and a completed P2 are different observations. */
export function pacePeriods(
  input: Reading & { forming?: Reading | null },
  weekly = false,
) {
  return (
    [
      {
        key: "forming",
        label: `Current ${weekly ? "week" : "month"} · forming`,
        value: input.forming,
      },
      {
        key: "confirmed",
        label: `Completed ${weekly ? "week" : "month"} · confirmed`,
        value: input,
      },
    ] as const
  ).map(({ key, label, value }) => ({
    key,
    label,
    code: paceCode(value?.multiplier),
    level: paceLevel(value?.multiplier),
    name:
      paceLevel(value?.multiplier) == null
        ? null
        : PACE_LEVELS[value!.multiplier!],
    date: value?.date ?? null,
    month: value?.month ?? null,
    reason: value?.reason ?? null,
  }));
}
export function pacePresentation(
  action: DecisionAction,
  multiplier: number | null | undefined,
) {
  const rawLevel = paceLevel(multiplier);
  const blocked = ["Reduce", "Sell", "Avoid"].includes(action);
  const permitted = action === "Buy" || action === "Add";
  const gatedReview = action === "Review" && rawLevel != null;
  const status = blocked
    ? "paused"
    : action === "Hold"
      ? "maintain"
      : permitted
        ? "active"
        : "context";
  const label = blocked
    ? "Additions paused"
    : action === "Hold"
      ? "Maintain position"
      : !permitted
        ? gatedReview
          ? `${paceCode(rawLevel)} business gate`
          : "Price context"
        : rawLevel == null
          ? "Building history"
          : PACE_LEVELS[rawLevel];
  const detail = blocked
    ? `The AURYN View is ${action}. Review the business risk before adding; the price-only reading does not override it.`
    : action === "Hold"
      ? rawLevel === 0
        ? PACE_DESCRIPTIONS[0]
        : PACE_DESCRIPTIONS[1]
      : action === "Review"
        ? gatedReview
          ? `A confirmed ${paceCode(rawLevel)} price zone is visible. Review the stated business or data checks before adding; the zone does not establish business quality on its own.`
          : "Review the stated business or data checks before adding. A price reading alone cannot complete the assessment or establish business quality."
        : !permitted
          ? "Entry conditions are not yet met. This reading explains the price setup; it is not an instruction to add."
          : rawLevel == null
            ? "The business and price case align; a contribution level needs enough completed price history."
            : rawLevel === 0
              ? "The price policy pauses scheduled contributions. P0 is not a sell signal."
              : PACE_DESCRIPTIONS[rawLevel];
  const effectiveCode =
    permitted && rawLevel != null && rawLevel > 0 ? paceCode(rawLevel) : null;
  const actionLabel = permitted
    ? rawLevel === 0
      ? "Pause new contributions"
      : rawLevel === 1
        ? action === "Add"
          ? "Hold"
          : "Watch"
        : rawLevel === 2
          ? `${action} small`
          : rawLevel === 4
            ? "Accumulate"
            : `${action} gradually`
    : action === "Hold"
      ? rawLevel === 0
        ? "Hold · pause additions"
        : "Hold"
      : action === "Wait"
        ? "Wait before buying"
        : gatedReview
          ? `Review business · ${paceCode(rawLevel)}`
          : action;
  return {
    actionLabel,
    effectiveCode,
    rawLevel,
    code: paceCode(rawLevel),
    label,
    status,
    permitted,
    detail,
    explanation: PACE_EXPLANATION,
  };
}

```

## Reference: auryn-decision
Source: lib/auryn-decision.ts
SHA-256: 21d5af8966444535b00d9136a7dbd7bb6796eeab7d3bc6dc75a05bfd44661c2d

```typescript
import { pacePresentation } from "./pace-presentation.ts";
import type { Research } from "./types";
import {
  annualRows,
  latestFinancialEvidence,
  perspective,
} from "./analysis.ts";
import { researchBrief } from "./research-brief.ts";

import { financingContext, metricEvidence } from "./research-integrity.ts";
import { comparableGrowth, reportedCashPerShare } from "./research-summary.ts";
import { selectPriceReference } from "./price-reference.ts";
import { amount, percent } from "./format.ts";

export type DecisionAction =
  | "Buy"
  | "Add"
  | "Hold"
  | "Reduce"
  | "Sell"
  | "Wait"
  | "Watch"
  | "Review"
  | "Avoid";
export type DecisionInput = {
  ownsPosition: boolean;
  growthEligible?: boolean;
  confirmedPace?: number | null;
  priceUsable: boolean;
  financialsUsable: boolean;
  business: "strong" | "developing" | "weak" | "missing";
  value: "attractive" | "fair" | "expensive" | "unassessed";
  extended: boolean;
  distress: boolean;
  deterioration: boolean;
  insolvency: boolean;
};
/** Funding pressure requires operating liquidity evidence, not expansion capex alone. */
export function fundingRisk(x: {
  applicable: boolean;
  operatingCashFlow: number | null | undefined;
  freeCashFlow: number | null | undefined;
  interestCoverage: number | null | undefined;
  netDebt: number | null | undefined;
  operatingRunway: number | null | undefined;
  cash: number | null | undefined;
}) {
  const finite = (n: number | null | undefined): n is number =>
    n != null && Number.isFinite(n);
  const operatingBurn =
    x.applicable && finite(x.operatingCashFlow) && x.operatingCashFlow < 0;
  const shortRunway =
    operatingBurn &&
    finite(x.operatingRunway) &&
    x.operatingRunway >= 0 &&
    x.operatingRunway < 12;
  const interestPressure =
    x.applicable &&
    finite(x.interestCoverage) &&
    x.interestCoverage < 1 &&
    finite(x.netDebt) &&
    x.netDebt > 0 &&
    finite(x.freeCashFlow) &&
    x.freeCashFlow < 0;
  // Interest coverage is an accrual-profit warning. It is not proof that debt payments cannot be funded.
  const distress =
    shortRunway ||
    (operatingBurn && interestPressure && finite(x.cash) && x.cash <= 0);
  return { operatingBurn, shortRunway, interestPressure, distress };
}
/** Conservative funded-growth screen. These disclosed thresholds are heuristics, not backtested probabilities. */
export function fundedGrowthCase(x: {
  applicable: boolean;
  financialsUsable: boolean;
  growth: number | null | undefined;
  margin: number | null | undefined;
  priorMargin: number | null | undefined;
  cash: number | null | undefined;
  netDebt: number | null | undefined;
  operatingCashFlow: number | null | undefined;
  freeCashFlow: number | null | undefined;
  operatingRunway: number | null | undefined;
  investmentRunway: number | null | undefined;
  dilution: number | null | undefined;
}) {
  const finite = (v: number | null | undefined): v is number =>
    v != null && Number.isFinite(v);
  const checks = {
    comparableReports: x.applicable && x.financialsUsable,
    growth: finite(x.growth) && x.growth >= 20,
    marginProgress:
      finite(x.margin) &&
      finite(x.priorMargin) &&
      x.margin - x.priorMargin >= 5,
    netCash:
      finite(x.cash) && x.cash > 0 && finite(x.netDebt) && x.netDebt <= 0,
    dilution: finite(x.dilution) && x.dilution <= 10,
    operationsFunded:
      finite(x.operatingCashFlow) &&
      (x.operatingCashFlow >= 0 ||
        (finite(x.operatingRunway) && x.operatingRunway >= 24)),
    investmentFunded:
      finite(x.freeCashFlow) &&
      (x.freeCashFlow >= 0 ||
        (finite(x.investmentRunway) && x.investmentRunway >= 18)),
  };
  const descriptions: Record<keyof typeof checks, string> = {
    comparableReports: "Current, comparable reports without conflicting inputs",
    growth: "Revenue growth of at least 20%",
    marginProgress:
      "Operating margin improvement of at least 5 percentage points",
    netCash: "Positive cash and no net debt",
    dilution: "Reported diluted share growth of 10% or less",
    operationsFunded:
      "Nonnegative operating cash flow or at least 24 months of operating runway",
    investmentFunded:
      "Nonnegative cash after capex or at least 18 months of investment runway",
  };
  const requirements = (Object.keys(checks) as (keyof typeof checks)[]).map(
    (key) => ({ key, label: descriptions[key], met: checks[key] }),
  );
  return {
    eligible: Object.values(checks).every(Boolean),
    checks,
    requirements,
  };
}
/** Published screening policy. Thresholds are transparent heuristics, not fitted probabilities. */
export function assessDecision(x: DecisionInput): {
  action: DecisionAction;
  code:
    | "financials"
    | "insolvency"
    | "funding"
    | "deterioration"
    | "price"
    | "accumulation"
    | "history"
    | "pace"
    | "zone"
    | "entry"
    | "business";
} {
  if (!x.financialsUsable) return { action: "Review", code: "financials" };
  if (x.insolvency)
    return { action: x.ownsPosition ? "Sell" : "Avoid", code: "insolvency" };
  if (x.distress || x.deterioration)
    return {
      action: x.ownsPosition ? "Reduce" : "Avoid",
      code: x.distress ? "funding" : "deterioration",
    };
  if (!x.priceUsable) return { action: "Review", code: "price" };
  const supported = x.business === "strong" || x.growthEligible === true;
  if (!supported) return { action: "Review", code: "business" };
  if (x.confirmedPace === 0)
    return { action: x.ownsPosition ? "Hold" : "Wait", code: "pace" };
  if (x.confirmedPace === 1)
    return { action: x.ownsPosition ? "Hold" : "Watch", code: "zone" };
  // Confirmed accumulation zones require a supported business.
  // Do not let forming readings, RSI or a conservative model rewrite this plan.
  if (
    Number.isInteger(x.confirmedPace) &&
    x.confirmedPace! >= 2 &&
    x.confirmedPace! <= 4
  )
    return { action: x.ownsPosition ? "Add" : "Buy", code: "accumulation" };
  if (x.value === "attractive" && !x.extended)
    return { action: x.ownsPosition ? "Add" : "Buy", code: "entry" };
  return {
    action: "Review",
    code: "history",
  };
}
export function evaluateDecision(x: DecisionInput): DecisionAction {
  return assessDecision(x).action;
}
export function annualizedReturn(
  target: number,
  price: number,
  years: number,
): number | null {
  if (
    ![target, price, years].every(Number.isFinite) ||
    target < 0 ||
    price <= 0 ||
    years <= 0
  )
    return null;
  const value = ((target / price) ** (1 / years) - 1) * 100;
  return Number.isFinite(value) ? value : null;
}
/** Levered cash-flow sensitivity; no enterprise-value/debt subtraction is mixed into equity cash flow. */
export function cashFlowValuation(x: {
  cashPerShare: number;
  growth: number;
  dilution: number;
}) {
  if (
    !Object.values(x).every(Number.isFinite) ||
    x.cashPerShare <= 0 ||
    x.dilution < 0
  )
    return null;
  const growth = Math.max(0, Math.min(10, x.growth));
  const presentValue = (
    startGrowth: number,
    discount: number,
    terminal: number,
  ) => {
    let cash = x.cashPerShare,
      pv = 0;
    for (let year = 1; year <= 10; year++) {
      const companyGrowth =
        startGrowth - ((startGrowth - terminal) * (year - 1)) / 9;
      cash *= (1 + companyGrowth / 100) / (1 + x.dilution / 100);
      pv += cash / (1 + discount / 100) ** year;
    }
    const perShareTerminal = (1 + terminal / 100) / (1 + x.dilution / 100) - 1;
    const terminalValue =
      (cash * (1 + perShareTerminal)) / (discount / 100 - perShareTerminal);
    const value = pv + terminalValue / (1 + discount / 100) ** 10;
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  const bear = presentValue(0, 15, 1),
    base = presentValue(growth, 12, 2),
    bull = presentValue(Math.min(15, growth + 5), 10, 3);
  return bear != null &&
    base != null &&
    bull != null &&
    bear <= base &&
    base <= bull
    ? { bear, base, bull, growth, dilution: x.dilution }
    : null;
}
export type DecisionValuation = {
  basis: "cash-flow" | "earnings";
  label: string;
  bear: number;
  base: number;
  bull: number;
  years: number | null;
  annualReturn: number | null;
  downside: number;
  upside: number;
  entryPrice: number;
  assumptions: string;
  end: string | null;
};
export function aurynDecision(
  r: Research,
  options: { ownsPosition?: boolean; now?: number } = {},
) {
  const now = options.now ?? Date.now(),
    ownsPosition = options.ownsPosition ?? false;
  const reference = selectPriceReference(r, now);
  // Financial knowledge remains cut to its retrieval date. Price checks use wall-clock time.
  const { latest: p, prior: q } = latestFinancialEvidence(r),
    brief = researchBrief(r),
    funding = financingContext(r);
  const growth = p ? comparableGrowth(p, q) : null;
  const family = brief.coverage.family;
  const specialist = [
    "financial",
    "insurance",
    "specialized-financial",
    "real-estate",
  ].includes(family);
  const bank = ["financial", "insurance", "specialized-financial"].includes(
    family,
  );
  const conflictMetrics = (
    bank
      ? ["revenue", "netIncome", "equity"]
      : [
          "revenue",
          "operatingIncome",
          "operatingCashFlow",
          "capex",
          "cash",
          "debt",
          "equity",
          "weightedShares",
        ]
  ) as (
    | "revenue"
    | "netIncome"
    | "equity"
    | "operatingIncome"
    | "operatingCashFlow"
    | "capex"
    | "cash"
    | "debt"
    | "weightedShares"
  )[];
  const priorMetrics = bank
    ? (["revenue", "equity"] as const)
    : ([
        "revenue",
        "operatingIncome",
        "weightedShares",
        "operatingCashFlow",
        "capex",
      ] as const);
  const conflicts = [
    ...(p
      ? conflictMetrics.filter(
          (metric) => metricEvidence(r, [metric]).status === "Conflicting",
        )
      : []),
    ...(q
      ? priorMetrics
          .filter(
            (metric) =>
              metricEvidence(r, [metric], false, "prior").status ===
              "Conflicting",
          )
          .map((metric) => `prior ${metric}`)
      : []),
  ];
  const financialsUsable =
    !conflicts.length &&
    r.company.assetType === "stock" &&
    !!p &&
    Number.isFinite(now) &&
    now - Date.parse(p.end) <= 550 * 86400000 &&
    Date.parse(p.end) <= now;
  const hasPositive = (v: number | null | undefined) =>
    v != null && Number.isFinite(v) && v > 0;
  const roe =
    p &&
    q &&
    p.netIncome != null &&
    p.equity != null &&
    q.equity != null &&
    p.equity > 0 &&
    q.equity > 0
      ? (p.netIncome / ((p.equity + q.equity) / 2)) * 100
      : null;
  const strong = bank
    ? hasPositive(p?.netIncome) &&
      roe != null &&
      roe >= 8 &&
      growth != null &&
      growth >= 0
    : !specialist &&
      hasPositive(p?.fcf) &&
      hasPositive(p?.operatingIncome) &&
      growth != null &&
      growth >= 0;
  const weak =
    !!p &&
    !specialist &&
    p.fcf != null &&
    p.fcf < 0 &&
    p.operatingIncome != null &&
    p.operatingIncome < 0 &&
    growth != null &&
    growth < 0;
  const businessChecks = bank
    ? [
        {
          label: "positive net income",
          value: p?.netIncome,
          met: hasPositive(p?.netIncome),
        },
        {
          label: "return on average equity of at least 8%",
          value: roe,
          met: roe != null && roe >= 8,
        },
        {
          label: "comparable revenue growth of zero or more",
          value: growth,
          met: growth != null && growth >= 0,
        },
      ]
    : [
        {
          label: "positive cash generation after capex",
          value: p?.fcf,
          met: hasPositive(p?.fcf),
        },
        {
          label: "positive operating profit",
          value: p?.operatingIncome,
          met: hasPositive(p?.operatingIncome),
        },
        {
          label: "comparable revenue growth of zero or more",
          value: growth,
          met: growth != null && growth >= 0,
        },
      ];
  const businessGaps = businessChecks
    .filter((check) => !check.met)
    .map(
      (check) =>
        `${check.value == null || !Number.isFinite(check.value) ? "Missing evidence for" : "Not met:"} ${check.label}`,
    );
  const business: DecisionInput["business"] = !p
    ? "missing"
    : strong
      ? "strong"
      : weak
        ? "weak"
        : "developing";
  const growthAssessment = fundedGrowthCase({
    applicable: !specialist && funding.annualBasis && growth != null,
    financialsUsable,
    growth,
    margin: p?.margin,
    priorMargin: q?.margin,
    cash: p?.cash,
    netDebt: p?.netDebt,
    operatingCashFlow: p?.operatingCashFlow,
    freeCashFlow: p?.fcf,
    operatingRunway: funding.operatingRunway,
    investmentRunway: funding.investmentRunway,
    dilution: funding.dilution,
  });
  // Negative investment cash flow alone is not a solvency diagnosis.
  const fundingAssessment = fundingRisk({
    applicable: !specialist,
    operatingCashFlow: p?.operatingCashFlow,
    freeCashFlow: p?.fcf,
    interestCoverage: p?.interestCoverage,
    netDebt: p?.netDebt,
    operatingRunway: funding.operatingRunway,
    cash: p?.cash,
  });
  const { operatingBurn, shortRunway, interestPressure } = fundingAssessment;
  const insolvency =
    financialsUsable &&
    operatingBurn &&
    funding.operatingRunway != null &&
    funding.operatingRunway < 6 &&
    p?.equity != null &&
    p.equity < 0 &&
    p.debt != null &&
    p.debt > 0;
  const distress = financialsUsable && fundingAssessment.distress;
  const deterioration =
    financialsUsable && weak && growth! < -10 && q?.fcf != null && q.fcf < 0;
  const reasons: string[] = [],
    risks: string[] = [],
    changeConditions: string[] = [];
  if (p && r.company.assetType === "stock") {
    if (growth != null)
      reasons.push(
        `Revenue ${growth >= 0 ? "grew" : "fell"} ${percent(Math.abs(growth))} over the comparable year.`,
      );
    if (!specialist && p.fcf != null)
      reasons.push(
        `${amount(p.fcf, p.currency, true)} cash ${p.fcf >= 0 ? "generated" : "used"} after capital spending.`,
      );
    if (bank && roe != null)
      reasons.push(`${percent(roe)} return on average equity.`);
    else if (p.margin != null)
      reasons.push(
        `${percent(p.margin)} operating margin in the latest complete period.`,
      );
    if (shortRunway)
      risks.push(
        `Cash covers about ${funding.operatingRunway!.toFixed(1)} months of the reported operating cash burn, before new financing.`,
      );
    if (interestPressure)
      risks.push(
        p.interestCoverage! < 0
          ? "Operations reported a loss, so operating profit did not cover interest. Review debt maturities and disclosed financing alongside cash and expansion spending."
          : `Operating profit covers ${p.interestCoverage!.toFixed(1)}× interest expense. Review debt maturities and financing; this ratio alone does not establish a cash shortfall.`,
      );
    if (insolvency)
      risks.unshift(
        "Negative reported equity and less than six months of operating cash runway put the funding case under acute pressure.",
      );
    if (deterioration)
      risks.push(
        "Revenue fell more than 10%, operations lost money and cash after capex was negative in both comparable periods.",
      );
    if (funding.dilution != null && funding.dilution > 3)
      risks.push(
        `Weighted diluted shares rose ${percent(funding.dilution)}; per-share progress must keep up.`,
      );
    if (p.sbcRevenue != null && p.sbcRevenue > 10)
      risks.push(
        `Share-based compensation is ${percent(p.sbcRevenue)} of revenue.`,
      );
    if (!specialist && p.fcf != null && p.fcf < 0 && !operatingBurn)
      risks.push(
        "Capital spending exceeds operating cash generation; future funding and investment returns matter.",
      );
  }
  let valuation: DecisionValuation | null = null;
  const price = reference?.price;
  // Earnings sensitivities are a fallback. A market multiple must not displace
  // an eligible independent cash-flow model merely because analyst coverage exists.
  if (reference && financialsUsable) {
    const priced = {
      ...r,
      priceObservedAt: new Date(now).toISOString(),
      quote: {
        ...r.quote,
        price: reference.price,
        asOf: reference.asOf,
        stale: false,
        session:
          reference.basis === "settled-close"
            ? "Settled close"
            : r.quote.session,
      },
    };
    const pricedBrief = researchBrief(priced),
      s = pricedBrief.scenario;
    if (
      s &&
      pricedBrief.scenarioEligible &&
      s.currency === reference.currency &&
      s.years > 0 &&
      s.years <= 4 &&
      s.low > 0 &&
      s.low <= s.base &&
      s.base <= s.high
    ) {
      const annual = annualizedReturn(s.base, reference.price, s.years);
      valuation = {
        basis: "earnings",
        label: "Earnings sensitivity",
        bear: s.low,
        base: s.base,
        bull: s.high,
        years: s.years,
        annualReturn: annual,
        downside: (s.low / reference.price - 1) * 100,
        upside: (s.base / reference.price - 1) * 100,
        entryPrice: Math.min(s.base / 1.12 ** s.years, s.low / 0.65),
        end: s.end,
        assumptions:
          "Published annual EPS estimates × 80% / 100% / 120% of the reported forward P/E. This sensitivity keeps the current market multiple as an anchor; it is not intrinsic value.",
      };
    }
    // Prefer observed cash flow only when the existing mature-business safeguards pass.
    if (
      family === "operating-company" &&
      !r.company.foreignListing &&
      strong &&
      p &&
      q &&
      p.currency === reference.currency
    ) {
      const rows = annualRows(r)
        .filter(
          (x) =>
            x.currency === p.currency && x.basis === p.basis && x.end <= p.end,
        )
        .slice(-3);
      const share = reportedCashPerShare(priced, p, now);
      const diluted = funding.dilution;
      if (
        rows.length >= 3 &&
        rows.every((x) => hasPositive(x.fcf)) &&
        rows.slice(1).every((row, i) => {
          const days =
            (Date.parse(row.end) - Date.parse(rows[i].end)) / 86400000;
          return days >= 330 && days <= 400;
        }) &&
        hasPositive(q.fcf) &&
        share &&
        share.cash != null &&
        p.fcf != null &&
        p.fcf > 0
      ) {
        const cashes = rows.map((x) => x.fcf!).sort((a, b) => a - b),
          normal = Math.min(p.fcf, cashes[1]);
        const v = cashFlowValuation({
          cashPerShare: (share.cash * normal) / p.fcf,
          growth: growth ?? 0,
          dilution: Math.max(0, diluted ?? 0),
        });
        if (v)
          valuation = {
            basis: "cash-flow",
            label: "Cash-flow valuation",
            bear: v.bear,
            base: v.base,
            bull: v.bull,
            years: null,
            annualReturn: null,
            downside: (v.bear / reference.price - 1) * 100,
            upside: (v.base / reference.price - 1) * 100,
            entryPrice: Math.min(v.base * 0.8, v.bear / 0.65),
            end: null,
            assumptions: `Starting cash is the lower of latest cash after capex and the median of the latest three consecutive annual observations, all positive. Company cash-flow growth starts at ${v.growth.toFixed(1)}% and fades over ten years. Shares grow ${v.dilution.toFixed(1)}% annually throughout the forecast and terminal period. Bear/base/bull discount rates: 15%/12%/10%; terminal growth: 1%/2%/3%. These are explicit model assumptions, not company guidance.${diluted == null ? " Future dilution is assumed 0% because comparable share counts were not reported." : ""}`,
          };
      }
    }
  }
  // A dated quote, not the price's location in a chart, anchors valuation conditions.
  let value: DecisionInput["value"] = "unassessed";
  if (valuation && price) {
    // entryPrice includes both constraints. Comparing the price directly avoids
    // floating-point drift at the displayed return/downside boundary.
    const favorable = price <= valuation.entryPrice;
    value = favorable
      ? "attractive"
      : valuation.upside < 0
        ? "expensive"
        : "fair";
    reasons.push(
      valuation.basis === "earnings"
        ? `Modelled annual return: ${percent(valuation.annualReturn, true)} over ${valuation.years!.toFixed(1)} years.`
        : `Base cash-flow value is ${percent(Math.abs(valuation.upside))} ${valuation.upside >= 0 ? "above" : "below"} the dated price.`,
    );
    if (!favorable)
      risks.push(
        `Price is above the conservative ${valuation.basis === "cash-flow" ? "cash-flow" : "earnings"} model screen of ${amount(valuation.entryPrice, reference!.currency)}. Review growth, cash conversion and downside assumptions before committing more capital; this sensitivity is not a complete valuation verdict.`,
      );
  }
  const tech = perspective(r).tech;
  const extended = tech.rsi != null && tech.rsi >= 75;
  const decisionInputs = {
    ownsPosition,
    growthEligible: growthAssessment.eligible,
    confirmedPace: brief.accumulation.multiplier,
    priceUsable: !!reference,
    financialsUsable,
    business,
    value,
    extended,
    distress,
    deterioration,
    insolvency,
  };
  const actions = {
    entry: evaluateDecision({ ...decisionInputs, ownsPosition: false }),
    holding: evaluateDecision({ ...decisionInputs, ownsPosition: true }),
  };
  const action = ownsPosition ? actions.holding : actions.entry;
  const assessment = assessDecision(decisionInputs);
  const actionLabel = pacePresentation(
    action,
    brief.accumulation.multiplier,
  ).actionLabel;
  const actionLabels = {
    entry: pacePresentation(actions.entry, brief.accumulation.multiplier)
      .actionLabel,
    holding: pacePresentation(actions.holding, brief.accumulation.multiplier)
      .actionLabel,
  };
  if (assessment.code === "accumulation") {
    changeConditions.push(
      "Review the business after earnings and adjust the contribution pace when the next completed monthly reading changes. Stay within your planned cash budget and position limit.",
    );
    if (!valuation)
      risks.push(
        "A suitable valuation model is not established. Gradual accumulation is supported by the business screen and confirmed Pace, not a claim that this stock is cheap.",
      );
  }
  const paused = !reference || !financialsUsable;
  let headline = "The price needs a stronger margin of safety.";
  if (action === "Buy" || action === "Add")
    headline =
      assessment.code === "accumulation"
        ? `Business supported; ${brief.accumulation.multiplier === 2 ? "initial" : brief.accumulation.multiplier === 3 ? "deeper" : "deep"} accumulation conditions met.`
        : "The business and valuation screens support a gradual entry.";
  else if (action === "Hold" || action === "Watch")
    headline =
      assessment.code === "zone"
        ? "Business supported; accumulation conditions not established."
        : "The business case holds; confirmed Pace pauses new contributions.";
  else if (action === "Sell")
    headline =
      "Cash runway and balance-sheet weakness threaten the holding case.";
  else if (action === "Reduce" || action === "Avoid")
    headline = distress
      ? "Funding pressure takes priority."
      : "The operating case has materially weakened.";
  else if (!reference)
    headline = "Refresh the price before making an entry decision.";
  else if (r.company.assetType !== "stock")
    headline = "Follow price and Pace for this instrument.";
  else if (conflicts.length)
    headline =
      "Source reports disagree on a decision input. Review the affected figures.";
  else if (!financialsUsable)
    headline = p
      ? "Refresh the financial report before sizing an entry."
      : "Price and Pace are ready; company analysis is still developing.";
  else if (assessment.code === "history")
    headline = "The business screen passes. Confirmed Pace needs more history.";
  else if (assessment.code === "business")
    headline =
      "Review operating progress and funding before committing more capital.";
  if (
    (action === "Hold" || action === "Wait") &&
    brief.accumulation.multiplier === 0 &&
    financialsUsable &&
    reference &&
    (strong || growthAssessment.eligible)
  ) {
    headline =
      "The business case holds; confirmed Pace pauses new contributions.";
    changeConditions.unshift(
      "Reassess additions when a completed monthly Pace reading reaches P2 or higher and the business still qualifies.",
    );
  }
  if (assessment.code === "zone")
    changeConditions.unshift(
      "Consider a small entry only after a completed reading reaches P2 or higher and the business still qualifies. A healthy company can remain outside an accumulation zone.",
    );
  if (growthAssessment.eligible && !strong) {
    reasons.splice(
      1,
      0,
      "Growth and improving margins meet the funded-growth screen, with net cash and measured dilution.",
    );
    risks.push(
      "The growth path uses disclosed screening thresholds; future profitability and investment returns remain uncertain.",
    );
  }
  if (conflicts.length)
    changeConditions.unshift(
      `Reconcile conflicting ${conflicts.map((x) => x.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")} observations in the current or comparable reporting period. Other company facts remain available.`,
    );
  if (!reference)
    changeConditions.unshift(
      "Load a current quote or a recent completed daily close.",
    );
  if (distress || insolvency)
    changeConditions.unshift(
      "Reassess after disclosed financing or improving operating cash flow extends the funding runway.",
    );
  if (deterioration)
    changeConditions.unshift(
      "Look for renewed revenue growth and positive operating cash generation in the next comparable report.",
    );
  if (
    !specialist &&
    !strong &&
    growth != null &&
    growth >= 20 &&
    !growthAssessment.eligible &&
    financialsUsable &&
    !distress
  ) {
    const outstanding = growthAssessment.requirements.filter(
      (rule) => !rule.met,
    );
    changeConditions.unshift(
      `For the funded-growth path, establish: ${outstanding.map((rule) => rule.label.toLowerCase()).join("; ")}.`,
    );
  }
  if (business === "developing" && !distress)
    changeConditions.push(
      bank
        ? "Track return on equity and credit/capital disclosures in the next report."
        : "Track operating profitability and cash generation in the next report.",
    );
  if (extended)
    risks.push(
      "Short-term momentum is stretched (RSI at least 75). Use staged purchases and respect your position limit; this does not change the confirmed monthly Pace.",
    );
  if (
    !valuation &&
    financialsUsable &&
    reference &&
    !distress &&
    !insolvency &&
    !deterioration
  )
    changeConditions.push(
      specialist
        ? `Use ${brief.coverage.drivers.slice(0, 2).join(" and ")} to establish an applicable valuation.`
        : "Complete the dated earnings or funded cash-flow assumptions in Value.",
    );
  if (!changeConditions.length)
    changeConditions.push(
      "Reassess after the next earnings report or a material change in the price.",
    );
  const businessReview =
    specialist && !bank
      ? `This sector needs its own business assessment using ${brief.coverage.drivers.slice(0, 2).join(" and ")}; the ordinary-company cash-generation screen does not apply.`
      : `${businessGaps.join("; ")}. ${growth != null && growth >= 20 ? "The alternative funded-growth requirements must also be reviewed below." : "Price weakness alone does not establish a supported business case."}`;
  if (assessment.code === "business") changeConditions.unshift(businessReview);
  if (!reasons.length && reference)
    reasons.push(
      `${amount(reference.price, reference.currency)} · ${reference.basis === "settled-close" ? "completed session" : "dated quote"} · ${reference.asOf.slice(0, 10)}.`,
    );
  const explanationText: Record<
    ReturnType<typeof assessDecision>["code"],
    { label: string; detail: string }
  > = {
    financials: {
      label:
        r.company.assetType !== "stock"
          ? "Price research only"
          : "Report check pending",
      detail: conflicts.length
        ? `Reports disagree on ${conflicts.map((x) => x.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}. Other figures and Pace remain available.`
        : r.company.assetType !== "stock"
          ? "Company buy/sell rules do not apply to this instrument. Use its price history and accumulation reading."
          : "A current, comparable financial report is needed to assess the business. This is an incomplete assessment, not a negative business verdict.",
    },
    insolvency: {
      label: "Acute funding pressure",
      detail:
        "Reported cash covers less than six months of operating burn, with negative equity and outstanding debt.",
    },
    funding: {
      label: "Funding risk",
      detail:
        risks.find((x) => x.includes("months")) ??
        "Operating cash burn, uncovered interest and exhausted cash weaken the funding case.",
    },
    deterioration: {
      label: "Business deterioration",
      detail:
        "Revenue fell more than 10%, operations lost money and cash after capex was negative in both comparable periods.",
    },
    price: {
      label: "Price refresh needed",
      detail:
        "A current quote or recent completed close is needed to compare price with the business case.",
    },
    pace: {
      label: "P0 pauses additions",
      detail:
        "The confirmed monthly reading is P0. Pause new contributions, not the business assessment. Reassess after a completed month reaches P2 or higher if the business still qualifies. P0 is not a sell signal.",
    },
    zone: {
      label: "P1 · Outside the accumulation zone",
      detail:
        "The business screen passes, but a qualifying accumulation zone is not established. Watch for a new entry; hold an existing position if the business case remains intact. P1 does not prescribe a purchase amount.",
    },
    accumulation: {
      label: `${actionLabel} · P${brief.accumulation.multiplier}`,
      detail: pacePresentation(action, brief.accumulation.multiplier).detail,
    },
    history: {
      label: "Contribution history incomplete",
      detail:
        "The business screen passes, but a confirmed Pace level is not available and the separate valuation-entry screen does not qualify. Review the available business and price evidence; missing history is not a negative business verdict.",
    },
    entry: {
      label: "Entry conditions met",
      detail:
        "The business screen and independent valuation-entry conditions qualify. A confirmed contribution level is not available; size purchases to your risk budget without assuming a Pace level.",
    },
    business: {
      label: "Business checks to review",
      detail: businessReview,
    },
  };
  const explanation = {
    code: assessment.code,
    ...explanationText[assessment.code],
  };
  const tone =
    action === "Buy" || action === "Add"
      ? "positive"
      : action === "Sell" || action === "Reduce" || action === "Avoid"
        ? "risk"
        : action === "Hold"
          ? "neutral"
          : "caution";
  return {
    version: "auryn-decision-v6-zones",
    explanation,
    actions,
    contextLabel: ownsPosition ? "For your holding" : "For new purchases",
    growthAssessment,
    growthCandidate: !specialist && !strong && growth != null && growth >= 20,
    action,
    actionLabel,
    actionLabels,
    tone,
    headline,
    reasons: reasons.slice(0, 4),
    risks,
    changeConditions,
    status: paused
      ? "paused"
      : value === "unassessed"
        ? "developing"
        : "assessed",
    business,
    value,
    reference,
    valuation,
    fundingAssessment,
    brief,
    horizon: valuation?.years
      ? `${valuation.years.toFixed(1)} years · to ${valuation.end}`
      : valuation?.basis === "cash-flow"
        ? "Long term · 10-year cash-flow model"
        : r.company.assetType === "stock"
          ? "Long-term business assessment"
          : "Price & accumulation",
    period: p?.end ?? null,
    model: brief.coverage.family,
    ownsPosition,
    confidence: paused
      ? "Assessment paused"
      : strong || growthAssessment.eligible
        ? "Business case supported"
        : "Developing case",
    method:
      "Rules-based research assessment, not a probability of profit. Review the stated model assumptions and portfolio concentration.",
  };
}

```

## Reference: financial-formulas
Source: lib/financial-formulas.ts
SHA-256: 2bbe4339bd9bf5d634ff1d42b2d943c0147010a8fb60c77b374bbe69da4bec07

```typescript
import type { FinancialPeriod } from "./types";
export const flowFields = [
  "grossProfit",
  "costOfRevenue",
  "researchExpense",
  "stockCompensation",
  "buybacks",
  "dividends",
  "interestExpense",
  "depreciation",
] as const;
export const balanceFields = [
  "cash",
  "debt",
  "equity",
  "assets",
  "liabilities",
  "currentAssets",
  "currentLiabilities",
  "receivables",
  "inventory",
  "payables",
  "retainedEarnings",
] as const;
export function ratio(
  a: number | null | undefined,
  b: number | null | undefined,
  scale = 1,
) {
  return a != null &&
    b != null &&
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    b > 0
    ? (a / b) * scale
    : null;
}
export function withFinancialRatios(p: FinancialPeriod): FinancialPeriod {
  return {
    ...p,
    grossMargin: ratio(p.grossProfit, p.revenue, 100),
    netMargin: ratio(p.netIncome, p.revenue, 100),
    fcfMargin: ratio(p.fcf, p.revenue, 100),
    sbcRevenue: ratio(p.stockCompensation, p.revenue, 100),
    capexRevenue: ratio(
      p.capex == null ? null : Math.abs(p.capex),
      p.revenue,
      100,
    ),
    fcfPerShare: ratio(p.fcf, p.weightedShares),
    sbcAdjustedFcfPerShare: ratio(
      p.fcf != null && p.stockCompensation != null
        ? p.fcf - p.stockCompensation
        : null,
      p.weightedShares,
    ),
    currentRatio: ratio(p.currentAssets, p.currentLiabilities),
    debtEquity: ratio(p.debt, p.equity),
    netDebt: p.debt != null && p.cash != null ? p.debt - p.cash : null,
    interestCoverage: ratio(p.operatingIncome, p.interestExpense),
    cashConversion: ratio(p.operatingCashFlow, p.netIncome),
  };
}

```

## Reference: financial-catalog
Source: lib/financial-catalog.ts
SHA-256: 17bb66ec1f127c312cf40003cfe9e4c91123f564ba9991c76eee8231cb3ed06e

```typescript
import type { FinancialPeriod, Research } from "./types";
import { financialPeriods } from "./engine.ts";
import { quarterFacts, ttmPeriods, modelCoverage } from "./research-depth.ts";
export type FinancialScope = "annual" | "quarterly" | "ttm";
export type FinancialGroup =
  | "Essentials"
  | "Profitability"
  | "Cash flow"
  | "Balance sheet";
export type FinancialKey = Exclude<
  keyof FinancialPeriod,
  "end" | "start" | "currency" | "basis" | "filed" | "sourceUrl" | "sourceUrls"
>;
export type MetricDefinition = {
  key: FinancialKey;
  label: string;
  group: FinancialGroup;
  unit: "money" | "percent" | "ratio" | "shares" | "perShare";
  color: string;
  help: string;
};
const m = (
  key: FinancialKey,
  label: string,
  group: FinancialGroup,
  unit: MetricDefinition["unit"],
  color: string,
  help: string,
): MetricDefinition => ({ key, label, group, unit, color, help });
export const financialCatalog: MetricDefinition[] = [
  m("depreciation", "Depreciation & amortization", "Cash flow", "money", "violet", "Provider-reported non-cash depreciation field. Check the filing for amortization scope before using it as a full D&A figure."),
  m("receivables", "Net receivables", "Balance sheet", "money", "blue", "Amounts customers owe at the reporting date, net of allowances."),
  m("inventory", "Inventory", "Balance sheet", "money", "blue", "Inventory carrying value at the reporting date; industry comparability matters."),
  m("payables", "Accounts payable", "Balance sheet", "money", "blue", "Reported supplier obligations at the reporting date."),
  m("retainedEarnings", "Retained earnings", "Balance sheet", "money", "violet", "Cumulative retained accounting earnings, not cash available to shareholders."),
  m(
    "revenue",
    "Revenue",
    "Essentials",
    "money",
    "blue",
    "Sales recognized in this reporting period, before expenses.",
  ),
  m(
    "netIncome",
    "Net income",
    "Essentials",
    "money",
    "violet",
    "Reported profit after costs, interest and taxes. One-time gains can affect comparability.",
  ),
  m(
    "fcf",
    "FCF · OCF less capex",
    "Essentials",
    "money",
    "green",
    "AURYN calculation: operating cash flow minus the source’s capital expenditure field, using matching periods. Company-reported FCF may additionally deduct software investment, intangibles or lease payments. These definitions are not interchangeable.",
  ),
  m(
    "eps",
    "Diluted EPS",
    "Essentials",
    "perShare",
    "blue",
    "Reported diluted earnings per share. TTM EPS is withheld where a consistent split-adjusted per-share history is not available.",
  ),
  m(
    "margin",
    "Operating margin",
    "Essentials",
    "percent",
    "violet",
    "Operating profit divided by revenue. Profitability is not by itself proof of a durable moat.",
  ),
  m(
    "fcfMargin",
    "FCF margin",
    "Essentials",
    "percent",
    "green",
    "Free cash flow divided by revenue. Reinvestment and working capital affect this measure.",
  ),
  m(
    "grossProfit",
    "Gross profit",
    "Profitability",
    "money",
    "blue",
    "Revenue after cost of sales. If derived, revenue and cost use the same filing and period.",
  ),
  m(
    "grossMargin",
    "Gross margin",
    "Profitability",
    "percent",
    "violet",
    "Gross profit divided by revenue. Compare within relevant industries.",
  ),
  m(
    "operatingIncome",
    "Operating income",
    "Profitability",
    "money",
    "green",
    "Profit from operations before interest and taxes.",
  ),
  m(
    "netMargin",
    "Net margin",
    "Profitability",
    "percent",
    "violet",
    "Net income divided by revenue; exceptional gains can inflate this figure.",
  ),
  m(
    "researchExpense",
    "Research & development",
    "Profitability",
    "money",
    "blue",
    "Reported research and development expense; capitalized development is not included.",
  ),
  m(
    "operatingCashFlow",
    "Operating cash flow",
    "Cash flow",
    "money",
    "blue",
    "Cash generated by operations including working-capital movements.",
  ),
  m(
    "capex",
    "Capital expenditure",
    "Cash flow",
    "money",
    "amber",
    "Cash purchases of property, plant and equipment; not all acquisitions or intangible investment.",
  ),
  m(
    "fcfPerShare",
    "FCF per diluted share",
    "Cash flow",
    "perShare",
    "green",
    "FCF divided by weighted-average diluted shares for the same period. TTM uses a day-weighted average of quarter shares.",
  ),
  m(
    "sbcAdjustedFcfPerShare",
    "FCF less SBC / share",
    "Cash flow",
    "perShare",
    "violet",
    "AURYN sensitivity: (FCF minus stock compensation) divided by weighted diluted shares. This is a non-GAAP analytical adjustment, not reported FCF or a direct estimate of dilution.",
  ),
  m(
    "stockCompensation",
    "Stock compensation",
    "Cash flow",
    "money",
    "amber",
    "Reported share-based compensation expense; compare with revenue and net share-count changes.",
  ),
  m(
    "sbcRevenue",
    "SBC / revenue",
    "Cash flow",
    "percent",
    "amber",
    "Stock compensation divided by revenue; a cost indicator, not the rate of shareholder dilution.",
  ),
  m(
    "buybacks",
    "Share repurchases",
    "Cash flow",
    "money",
    "blue",
    "Cash spent repurchasing shares. Repurchases may offset issuance rather than reduce outstanding shares.",
  ),
  m(
    "dividends",
    "Dividends paid",
    "Cash flow",
    "money",
    "green",
    "Reported cash dividends. Absence in the connected facts does not mean zero dividends.",
  ),
  m(
    "cashConversion",
    "Cash conversion",
    "Cash flow",
    "ratio",
    "green",
    "Operating cash flow divided by positive net income. Working-capital timing can make this volatile.",
  ),
  m(
    "capexRevenue",
    "Capex / revenue",
    "Cash flow",
    "percent",
    "amber",
    "Cash capital expenditure as a percentage of sales.",
  ),
  m(
    "cash",
    "Cash & equivalents",
    "Balance sheet",
    "money",
    "green",
    "Reported period-end cash and cash equivalents; restricted cash and investments may be separate.",
  ),
  m(
    "debt",
    "Reported total debt",
    "Balance sheet",
    "money",
    "amber",
    "Mapped total-debt disclosure. Missing data is not treated as no debt; lease coverage depends on the reported tag.",
  ),
  m(
    "netDebt",
    "Debt less cash",
    "Balance sheet",
    "money",
    "amber",
    "Reported total debt minus cash from the same period and currency. Negative means net cash on this definition.",
  ),
  m(
    "assets",
    "Total assets",
    "Balance sheet",
    "money",
    "blue",
    "Reported assets at period end; balance-sheet figures are not summed for TTM.",
  ),
  m(
    "liabilities",
    "Total liabilities",
    "Balance sheet",
    "money",
    "amber",
    "Reported liabilities, including obligations beyond interest-bearing debt.",
  ),
  m(
    "equity",
    "Shareholders’ equity",
    "Balance sheet",
    "money",
    "violet",
    "Reported equity attributable to shareholders.",
  ),
  m(
    "currentRatio",
    "Current ratio",
    "Balance sheet",
    "ratio",
    "blue",
    "Current assets divided by positive current liabilities for the same reporting date.",
  ),
  m(
    "debtEquity",
    "Debt / equity",
    "Balance sheet",
    "ratio",
    "amber",
    "Debt divided by positive equity. Withheld when equity is zero or negative.",
  ),
  m(
    "interestCoverage",
    "Interest coverage",
    "Balance sheet",
    "ratio",
    "green",
    "Operating income divided by positive reported interest expense. Missing or zero expense does not imply unlimited coverage.",
  ),
  m(
    "weightedShares",
    "Diluted average shares",
    "Balance sheet",
    "shares",
    "violet",
    "Weighted-average diluted shares over the period, not the current share count. Quarterly averages are not derived by subtracting YTD averages.",
  ),
];
export function researchPeriods(r: Research, scope: FinancialScope) {
  const rows =
    scope === "ttm"
      ? ttmPeriods(r.facts, r.retrievedAt)
      : financialPeriods(
          scope === "quarterly"
            ? [
                ...quarterFacts(r.facts, r.retrievedAt),
                ...r.facts.filter((f) => f.scope === "instant"),
              ]
            : r.facts,
          scope,
          r.retrievedAt,
        );
  const latestEnd = rows.at(-1)?.end;
  const latest = rows.filter((p) => p.end === latestEnd);
  const preferred =
    latest.find((p) => p.currency === r.quote.currency) ?? latest.at(-1);
  const currency = preferred?.currency,
    basis = preferred?.basis;
  return rows.filter((p) => p.currency === currency && p.basis === basis);
}
export function applicableMetrics(r: Research) {
  const bank =
    modelCoverage(r.company.symbol, r.company.assetType, {
      sector: r.evidence?.profile?.sector || r.company.sector,
      industry: r.evidence?.profile?.industry,
    }).family === "financial";
  return financialCatalog.filter(
    (m) =>
      !bank ||
      ![
        "fcf",
        "fcfMargin",
        "fcfPerShare",
        "sbcAdjustedFcfPerShare",
        "margin",
        "cashConversion",
        "debtEquity",
        "interestCoverage",
      ].includes(m.key),
  );
}

```

## Reference: financial-period-selection
Source: lib/financial-period-selection.ts
SHA-256: e16fe3f8b70b3e0ee163db618ff0547cfa0e5483a9ed7eca8ea7ed8343ed6f27

```typescript
import type { Fact, FinancialPeriod } from "./types";

const coreFields = [
  "revenue",
  "operatingIncome",
  "netIncome",
  "operatingCashFlow",
  "capex",
  "fcf",
] as const;
const completeness = (row: FinancialPeriod) =>
  coreFields.filter((key) => row[key] != null).length;
const basisPriority = (basis: string) => (basis === "Provider" ? 0 : 1);

/** Ascending order, with the preferred complete observation last for tied ends.
 * Never depend on provider input order when period starts/bases differ. */
export function compareFinancialPeriods(
  a: FinancialPeriod,
  b: FinancialPeriod,
): number {
  return (
    a.end.localeCompare(b.end) ||
    completeness(a) - completeness(b) ||
    basisPriority(a.basis) - basisPriority(b.basis) ||
    a.filed.localeCompare(b.filed) ||
    a.currency.localeCompare(b.currency) ||
    a.basis.localeCompare(b.basis) ||
    b.start.localeCompare(a.start) ||
    a.sourceUrl.localeCompare(b.sourceUrl)
  );
}

export function selectFinancialPeriod(
  rows: FinancialPeriod[],
  currency?: string | null,
): FinancialPeriod | undefined {
  if (!rows.length) return undefined;
  const end = rows.reduce(
    (latest, row) => (row.end > latest ? row.end : latest),
    "",
  );
  const latest = rows.filter((row) => row.end === end);
  const preferred = currency
    ? latest.filter((row) => row.currency === currency)
    : [];
  return [...(preferred.length ? preferred : latest)]
    .sort(compareFinancialPeriods)
    .at(-1);
}

/** Newest filing first; stable tie breaks retain a reproducible source choice.
 * Same-filing disagreements remain in facts for the evidence conflict check. */
export function compareFinancialFacts(a: Fact, b: Fact): number {
  return (
    b.filed.localeCompare(a.filed) ||
    a.accession.localeCompare(b.accession) ||
    a.id.localeCompare(b.id) ||
    a.sourceUrl.localeCompare(b.sourceUrl) ||
    a.value - b.value
  );
}

```

## Reference: research-depth
Source: lib/research-depth.ts
SHA-256: ea31093f829442f1a7d23c46fbafa9eec473815af4ceae3a6be71d6c7f95ce42

```typescript
import type { Fact, Candle, FinancialPeriod } from "./types";
import { financialPeriods, cashFlowValue } from "./engine.ts";
import { flowFields, withFinancialRatios } from "./financial-formulas.ts";
import {
  compareFinancialFacts,
  compareFinancialPeriods,
} from "./financial-period-selection.ts";
const DAY = 86400000;
export function quarterFacts(facts: Fact[], asOf: string): Fact[] {
  const day = asOf.slice(0, 10),
    latest = new Map<string, Fact>();
  const rows = facts
    .filter(
      (f) =>
        f.start && f.end <= day && f.filed <= day && Number.isFinite(f.value),
    )
    .sort((a, b) => compareFinancialFacts(b, a));
  for (const f of rows)
    latest.set(
      [f.metric, f.start, f.end, f.unit, f.currency, f.basis].join("|"),
      f,
    );
  const known = [...latest.values()],
    result = known.filter((f) => f.scope === "quarterly");
  for (const f of known) {
    if (
      !["ytd", "annual"].includes(f.scope) ||
      !f.start ||
      ["eps", "shares", "weightedShares"].includes(f.metric)
    )
      continue;
    const previous = known
      .filter(
        (p) =>
          p.metric === f.metric &&
          p.start === f.start &&
          p.end < f.end &&
          p.unit === f.unit &&
          p.currency === f.currency &&
          p.basis === f.basis &&
          p.filed <= f.filed,
      )
      .sort((a, b) => a.end.localeCompare(b.end))
      .at(-1);
    if (!previous || !previous.start) continue;
    const start = new Date(Date.parse(previous.end) + DAY)
        .toISOString()
        .slice(0, 10),
      duration = (Date.parse(f.end) - Date.parse(start)) / DAY;
    if (
      duration < 60 ||
      duration > 110 ||
      result.some(
        (p) =>
          p.metric === f.metric &&
          p.start === start &&
          p.end === f.end &&
          p.unit === f.unit &&
          p.currency === f.currency &&
          p.basis === f.basis,
      )
    )
      continue;
    result.push({
      ...f,
      id: `derived:${f.id}:${previous.id}`,
      start,
      value: f.value - previous.value,
      scope: "quarterly",
      accession: `derived:${f.accession}:${previous.accession}`,
      derivedFrom: [f.id, previous.id],
      sourceUrls: [f.sourceUrl, previous.sourceUrl],
    });
  }
  return result.sort(
    (a, b) => a.end.localeCompare(b.end) || a.metric.localeCompare(b.metric),
  );
}
export function ttmPeriods(facts: Fact[], asOf: string): FinancialPeriod[] {
  const rows = financialPeriods(
      [
        ...quarterFacts(facts, asOf),
        ...facts.filter((f) => f.scope === "instant"),
      ],
      "quarterly",
      asOf,
    ),
    result: FinancialPeriod[] = [];
  const series = new Map<string, Map<string, FinancialPeriod>>();
  for (const row of rows) {
    const key = `${row.currency}|${row.basis}`;
    if (!series.has(key)) series.set(key, new Map());
    // financialPeriods puts the more complete tied-end observation last.
    series.get(key)!.set(row.end, row);
  }
  for (const periods of series.values()) {
    const comparable = [...periods.values()].sort(compareFinancialPeriods);
    for (let i = 3; i < comparable.length; i++) {
      const four = comparable.slice(i - 3, i + 1),
        last = four[3];
      if (
        four.some(
          (r, j) =>
            r.currency !== last.currency ||
            r.basis !== last.basis ||
            (j > 0 &&
              Date.parse(r.start) !== Date.parse(four[j - 1].end) + DAY),
        )
      )
        continue;
      const span = (Date.parse(last.end) - Date.parse(four[0].start)) / DAY;
      if (span < 330 || span > 400) continue;
      const sum = (
        key:
          | "revenue"
          | "netIncome"
          | "operatingIncome"
          | "operatingCashFlow"
          | "capex"
          | "fcf",
      ) =>
        four.every((r) => r[key] != null)
          ? four.reduce((s, r) => s + r[key]!, 0)
          : null;
      const revenue = sum("revenue"),
        op = sum("operatingIncome");
      const extended = Object.fromEntries(
        flowFields.map((k) => [
          k,
          four.every((r) => r[k] != null)
            ? four.reduce((s, r) => s + r[k]!, 0)
            : null,
        ]),
      );
      const days = four.map(
        (r) => (Date.parse(r.end) - Date.parse(r.start)) / DAY + 1,
      );
      const weights = four.every(
        (r) => r.weightedShares != null && r.weightedShares > 0,
      )
        ? four.reduce((s, r, j) => s + r.weightedShares! * days[j], 0) /
          days.reduce((s, n) => s + n, 0)
        : null;
      result.push(
        withFinancialRatios({
          ...last,
          start: four[0].start,
          revenue,
          netIncome: sum("netIncome"),
          operatingIncome: op,
          operatingCashFlow: sum("operatingCashFlow"),
          capex: sum("capex"),
          fcf: sum("fcf"),
          margin: revenue && op != null ? (op / revenue) * 100 : null,
          ...extended,
          weightedShares: weights,
          eps: null,
          sourceUrls: [
            ...new Set(four.flatMap((r) => r.sourceUrls ?? [r.sourceUrl])),
          ],
        }),
      );
    }
  }
  return result.sort(compareFinancialPeriods);
}
export function reverseGrowth(
  cash: number,
  shares: number,
  price: number,
  discount: number,
  terminal: number,
  dilution: number,
): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  let low = -70,
    high = 100;
  const l = cashFlowValue(cash, shares, low, discount, terminal, dilution),
    h = cashFlowValue(cash, shares, high, discount, terminal, dilution);
  if (l == null || h == null || price < l || price > h) return null;
  for (let i = 0; i < 70; i++) {
    const mid = (low + high) / 2,
      value = cashFlowValue(cash, shares, mid, discount, terminal, dilution);
    if (value == null) return null;
    if (value > price) high = mid;
    else low = mid;
  }
  return (low + high) / 2;
}
export function weeklyStudies(
  bars: Candle[],
  asOf: string,
): { ma50: number | null; ma200: number | null; last: string | null } {
  const day = new Date(asOf);
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const boundary = day.toISOString().slice(0, 10),
    weeks = new Map<string, Candle>();
  for (const b of [...bars].sort((a, b) => a.time.localeCompare(b.time))) {
    if (
      b.time.length !== 10 ||
      b.time >= boundary ||
      !Number.isFinite(b.close) ||
      b.close <= 0
    )
      continue;
    const d = new Date(b.time);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    weeks.set(d.toISOString().slice(0, 10), b);
  }
  const rows = [...weeks.values()],
    average = (n: number) =>
      rows.length >= n &&
      (Date.parse(rows.at(-1)!.time) - Date.parse(rows.at(-n)!.time)) / DAY <=
        (n - 1) * 7 + 5
        ? rows.slice(-n).reduce((s, b) => s + b.close, 0) / n
        : null;
  return {
    ma50: average(50),
    ma200: average(200),
    last: rows.at(-1)?.time ?? null,
  };
}
export function modelCoverage(
  symbol: string,
  assetType: string,
  profile?: { sector?: string | null; industry?: string | null },
): {
  family: string;
  drivers: string[];
  method: string;
  classificationSource:
    | "asset-type"
    | "provider-profile"
    | "known-symbol"
    | "fallback";
} {
  if (assetType === "crypto")
    return {
      family: "crypto",
      classificationSource: "asset-type",
      drivers: [
        "Network usage",
        "Supply and issuance",
        "Liquidity",
        "Custody and protocol risks",
      ],
      method: "Corporate cash-flow valuation does not apply.",
    };
  const knownInfrastructure = ["IREN", "CIFR", "CORZ", "CRWV", "NBIS"].includes(
    symbol,
  );
  const infrastructureIndustry =
    /\bdata[ -]?cent(?:er|re)s?\b|\b(?:bitcoin|cryptocurrency|digital asset) mining\b/i.test(
      profile?.industry ?? "",
    );
  if (knownInfrastructure || infrastructureIndustry)
    return {
      family: "infrastructure",
      classificationSource: knownInfrastructure
        ? "known-symbol"
        : "provider-profile",
      drivers: [
        "Contracted versus operating capacity",
        "Power and utilization",
        "Customer concentration",
        "Equipment economics and capex",
        "Funding, dilution and legacy segments",
      ],
      method:
        "Capacity and financing scenarios; a generic current-FCF extrapolation is insufficient.",
    };
  if (["ASTS", "RKLB", "JOBY", "ACHR"].includes(symbol))
    return {
      family: "frontier",
      classificationSource: "known-symbol",
      drivers: [
        "Deployment and usable capacity",
        "Commercial conversion",
        "Regulatory dependencies",
        "Cash runway and financing",
        "Delivered milestones versus targets",
      ],
      method:
        "Milestone and unit-economics scenarios; no automatic intrinsic value from current losses.",
    };
  const label = (value?: string | null) =>
      (value ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim(),
    sector = label(profile?.sector),
    industry = label(profile?.industry),
    hasProfile = !!(sector || industry);
  // Provider classifications guard model suitability; they do not supply a
  // validated valuation model or company-specific assumptions.
  if (
    /\breits?\b|\breal estate investment trusts?\b/.test(industry) ||
    sector === "real estate"
  )
    return {
      family: "real-estate",
      classificationSource: "provider-profile",
      drivers: [
        "Property income and occupancy",
        "FFO and AFFO reconciliation",
        "Leverage and refinancing",
        "Maintenance capital expenditure",
        "Portfolio value and lease terms",
      ],
      method:
        "Property/REIT-specific valuation is not available; FFO/AFFO, asset values and leverage need dedicated review before selecting a valuation method.",
    };
  if (
    (/\binsurance\b/.test(industry) && !/\bbrokers?\b/.test(industry)) ||
    /\bhealth ?care plans?\b/.test(industry) ||
    sector === "insurance"
  )
    return {
      family: "insurance",
      classificationSource: "provider-profile",
      drivers: [
        "Underwriting or medical claims economics",
        "Claims and reserve adequacy",
        "Regulatory capital and liquidity",
        "Investment portfolio",
        "Policy retention and pricing",
      ],
      method:
        "Insurance-specific valuation is not available; claims, reserves and regulatory capital require dedicated review rather than a generic cash-flow or bank scenario.",
    };
  if (
    (/\bbanks?\b|\bthrifts?\b|\bsavings (?:and )?loans?\b/.test(industry) &&
      !/\binvestment banks?\b/.test(industry)) ||
    industry === "banking" ||
    (!hasProfile &&
      ["JPM", "BAC", "WFC", "C", "GS", "MS", "SCHW", "NU", "SOFI"].includes(
        symbol,
      ))
  )
    return {
      family: "financial",
      classificationSource: hasProfile ? "provider-profile" : "known-symbol",
      drivers: [
        "Return on tangible equity",
        "Capital adequacy",
        "Credit quality",
        "Funding cost",
        "Tangible book value",
      ],
      method:
        "Residual income / tangible-book scenarios; operating cash flow is not a suitable bank valuation anchor.",
    };
  if (
    /\bfinancials?\b|\bfinance\b/.test(sector) ||
    /\bfinancial\b|\bfinance\b|\binsurance\b|\basset management\b|\bcapital markets\b|\bcredit services\b|\binvestment bank(?:s|ing)?\b/.test(
      industry,
    )
  )
    return {
      family: "specialized-financial",
      classificationSource: "provider-profile",
      drivers: [
        "Business mix and revenue sources",
        "Capital and liquidity requirements",
        "Credit and market exposure",
        "Customer assets and obligations",
        "Sustainable earnings and distributions",
      ],
      method:
        "A sector-specific valuation is not available; generic operating cash flow and bank tangible-book assumptions should not be applied automatically.",
    };
  return {
    family: "operating-company",
    classificationSource: hasProfile ? "provider-profile" : "fallback",
    drivers: [
      "Revenue durability",
      "Margins and cash conversion",
      "Reinvestment",
      "Balance-sheet claims",
      "Competitive advantage and dilution",
    ],
    method: hasProfile
      ? "Cash-flow sensitivity when positive cash flow and reconciled shares are available."
      : "Business classification is unavailable; generic cash-flow sensitivity is provisional and requires model suitability review.",
  };
}

```

## Reference: research-summary
Source: lib/research-summary.ts
SHA-256: a44f0479929724dbd2c794417097f125fe1049642c4159b39dbdb71ebc88d384

```typescript
import type { Research, FinancialPeriod } from "./types";
import { ratio } from "./financial-formulas.ts";
/** Resolve the actual denominator date, which can differ from the financial period. */
function reportedOutstandingShares(r: Research, p?: FinancialPeriod | null) {
  const day = r.retrievedAt.slice(0, 10);
  const candidates = r.facts
    .filter(
      (f) =>
        f.metric === "shares" &&
        f.scope === "instant" &&
        f.unit === "shares" &&
        Number.isFinite(f.value) &&
        Number.isFinite(Date.parse(f.end)) &&
        Number.isFinite(Date.parse(f.filed)) &&
        f.end <= day &&
        f.filed <= day &&
        (!p ||
          ((!f.basis || f.basis === p.basis) &&
            (f.currency == null || f.currency === p.currency))),
    )
    .sort(
      (a, b) =>
        b.end.localeCompare(a.end) ||
        b.filed.localeCompare(a.filed) ||
        b.value - a.value,
    );
  const selected = candidates[0];
  if (!selected || selected.value <= 0) return null;
  // A later filing supersedes an earlier one. Same-date disagreements cannot
  // be resolved by array order; rounding-equivalent observations use the larger count.
  const conflict = candidates.some(
    (f) =>
      f.end === selected.end &&
      f.filed === selected.filed &&
      Math.abs(f.value - selected.value) >
        Math.max(1, Math.min(Math.abs(f.value), selected.value) * 0.01),
  );
  return conflict ? null : selected;
}
export function marketMultiples(r: Research, p?: FinancialPeriod | null) {
  const empty = {
    marketCap: null,
    pe: null,
    ps: null,
    pfcf: null,
    fcfYield: null,
  };
  const today = r.retrievedAt.slice(0, 10);
  const share = reportedOutstandingShares(r, p);
  if (
    !p ||
    r.company.assetType !== "stock" ||
    r.company.foreignListing ||
    r.quote.stale ||
    r.quote.price == null ||
    !Number.isFinite(r.quote.price) ||
    r.quote.price <= 0 ||
    r.quote.currency !== p.currency ||
    !share ||
    /^(20-F|40-F)/.test(share.form) ||
    Date.parse(today) - Date.parse(share.end) > 180 * 86400000 ||
    Date.parse(today) - Date.parse(p.end) > 550 * 86400000
  )
    return empty;
  const marketCap = r.quote.price * share.value;
  return {
    marketCap,
    pe: ratio(marketCap, p.netIncome),
    ps: ratio(marketCap, p.revenue),
    pfcf: ratio(marketCap, p.fcf),
    fcfYield: ratio(p.fcf, marketCap, 100),
  };
}
export function earningsScenario(
  eps: number,
  growth: number,
  multiple: number,
  discount: number,
  dilution: number,
  years = 5,
) {
  if (
    ![eps, growth, multiple, discount, dilution, years].every(
      Number.isFinite,
    ) ||
    eps <= 0 ||
    growth <= -100 ||
    multiple <= 0 ||
    discount <= 0 ||
    dilution < 0 ||
    years < 1 ||
    years > 10
  )
    return null;
  const annual = Array.from(
    { length: years },
    (_, i) => eps * ((1 + growth / 100) / (1 + dilution / 100)) ** (i + 1),
  );
  const exitPrice = annual.at(-1)! * multiple;
  return {
    annual,
    exitPrice,
    presentValue: exitPrice / (1 + discount / 100) ** years,
  };
}
export type CaseFactor = {
  key: string;
  title: string;
  text: string;
  value: number;
  unit: "percent" | "money" | "ratio";
};
export function comparableGrowth(
  p: FinancialPeriod,
  prior?: FinancialPeriod | null,
) {
  const span = prior
    ? (Date.parse(p.end) - Date.parse(prior.end)) / 86400000
    : 0;
  return prior &&
    span >= 330 &&
    span <= 400 &&
    prior.currency === p.currency &&
    prior.basis === p.basis &&
    prior.revenue != null &&
    prior.revenue > 0 &&
    p.revenue != null
    ? (p.revenue / prior.revenue - 1) * 100
    : null;
}
export function financialCase(
  p?: FinancialPeriod | null,
  prior?: FinancialPeriod | null,
) {
  const positive: CaseFactor[] = [],
    risks: CaseFactor[] = [],
    context: CaseFactor[] = [],
    gaps: string[] = [];
  if (!p)
    return {
      positive,
      risks,
      context,
      gaps: ["Comparable company statements are not available."],
    };
  const growth = comparableGrowth(p, prior);
  if (growth != null)
    (growth >= 0 ? positive : risks).push({
      key: "growth",
      title: growth >= 0 ? "Revenue is growing" : "Revenue contracted",
      value: growth,
      unit: "percent",
      text:
        growth >= 0
          ? "Supports the growth case if demand remains durable."
          : "The business needs to demonstrate renewed demand.",
    });
  if (p.fcf != null)
    (p.fcf > 0 ? positive : risks).push({
      key: "fcf",
      title: p.fcf > 0 ? "Cash after reinvestment" : "Reinvestment uses cash",
      value: p.fcf,
      unit: "money",
      text:
        p.fcf > 0
          ? p.revenue != null && p.revenue > 0
            ? `${((p.fcf / p.revenue) * 100).toFixed(1)}% of revenue remained after operating cash flows and reported capital expenditure. Check software investment and lease treatment in the source.`
            : "Operating cash flow exceeded reported capital expenditure."
          : "Funding and the returns on capital spending need closer review.",
    });
  else
    gaps.push("Matching operating cash flow and capital spending are missing.");
  if (p.margin != null)
    (p.margin > 0 ? positive : risks).push({
      key: "margin",
      title: p.margin > 0 ? "Profitable operations" : "Operating losses",
      value: p.margin,
      unit: "percent",
      text:
        p.margin > 0
          ? "Operating profit provides a buffer; its durability still needs evidence."
          : "Growth must eventually translate into sustainable operating profit.",
    });
  if (p.sbcRevenue != null && p.sbcRevenue > 5)
    risks.push({
      key: "sbc",
      title: "Equity compensation matters",
      value: p.sbcRevenue,
      unit: "percent",
      text: "Stock compensation exceeds 5% of revenue. Check net dilution alongside buybacks.",
    });
  if (p.interestCoverage != null && p.interestCoverage < 3)
    risks.push({
      key: "interest",
      title: "Limited interest buffer",
      value: p.interestCoverage,
      unit: "ratio",
      text: "Operating earnings cover interest fewer than three times; financing costs matter.",
    });
  if (p.netDebt != null && p.netDebt > 0) {
    const hasCashGeneration = p.fcf != null && p.fcf > 0;
    const hasInterestPressure =
      p.interestCoverage != null && p.interestCoverage < 3;
    (hasCashGeneration && !hasInterestPressure ? context : risks).push({
      key: "debt",
      title: hasCashGeneration
        ? "Net debt in context"
        : "Debt and funding needs",
      value: p.netDebt,
      unit: "money",
      text: hasCashGeneration
        ? `Net debt is ${(p.netDebt / p.fcf!).toFixed(2)}× this period’s cash after capex. This is a historical comparison, not a debt repayment forecast; maturity and lease obligations still matter.`
        : "Debt exceeds cash while positive cash after capex is not established. Review financing commitments and maturities.",
    });
  }
  if (
    p.netIncome != null &&
    p.netIncome > 0 &&
    p.operatingIncome != null &&
    p.operatingIncome < 0
  )
    risks.unshift({
      key: "earnings-quality",
      title: "Net profit includes non-operating effects",
      value: p.operatingIncome,
      unit: "money",
      text: "Reported net income is positive, but operations are loss-making. Reconcile investment gains, financing, tax and other non-operating items before treating profit as recurring.",
    });
  if (p.currentRatio != null && p.currentRatio < 1)
    risks.push({
      key: "liquidity",
      title: "Near-term liquidity review",
      value: p.currentRatio,
      unit: "ratio",
      text: "Current liabilities exceed current assets; working-capital quality matters.",
    });
  if (growth == null)
    gaps.push("Comparable year-over-year revenue growth is missing.");
  if (p.debt == null)
    gaps.push("Total debt is not available from the mapped facts.");
  return { positive: positive.slice(0, 3), risks, context, gaps };
}

/** A price and scenario range share one numeric axis. Never clamp an
 * out-of-range quote inside the scenario band. */
export function valuationScale(values: number[], quote: number) {
  if (
    !values.length ||
    !values.every((v) => Number.isFinite(v) && v >= 0) ||
    !Number.isFinite(quote) ||
    quote <= 0
  )
    return null;
  const low = Math.min(...values),
    high = Math.max(...values);
  const floor = Math.min(low, quote),
    ceiling = Math.max(high, quote);
  const padding = Math.max((ceiling - floor) * 0.1, ceiling * 0.03, 0.01);
  const min = Math.max(0, floor - padding),
    max = ceiling + padding;
  const position = (v: number) => ((v - min) / (max - min)) * 100;
  return {
    low,
    high,
    min,
    max,
    lowPosition: position(low),
    highPosition: position(high),
    quotePosition: position(quote),
  };
}

/** Reported per-share inputs do not depend on a live market quote. */
export function reportedCashPerShare(
  r: Research,
  p?: FinancialPeriod | null,
  now = Date.parse(r.priceObservedAt ?? r.retrievedAt),
) {
  const empty = { cash: null as number | null, sbc: null as number | null };
  if (
    !p ||
    r.company.assetType !== "stock" ||
    r.company.foreignListing ||
    p.currency !== r.company.currency ||
    p.currency !== r.quote.currency ||
    now - Date.parse(p.end) > 550 * 86400000
  )
    return empty;
  const share = reportedOutstandingShares(r, p);
  if (
    !share ||
    /^(20-F|40-F)/.test(share.form) ||
    now - Date.parse(share.end) > 180 * 86400000
  )
    return empty;
  return {
    cash:
      p.fcf != null && Number.isFinite(p.fcf) && p.fcf > 0
        ? p.fcf / share.value
        : null,
    sbc:
      p.stockCompensation != null &&
      Number.isFinite(p.stockCompensation) &&
      p.stockCompensation >= 0
        ? p.stockCompensation / share.value
        : null,
  };
}

```

## Reference: decision-research
Source: lib/decision-research.ts
SHA-256: 97a1d39c200ec121c4c028c033225ccbb0dfcd730d17cf5d2010cbb1fe1707ba

```typescript
import { evidenceMemo } from "./evidence-memo.ts";
import type { Research } from "./types";
import { latestFinancialEvidence, indicators } from "./analysis.ts";
import {
  marketMultiples,
  reportedCashPerShare,
  financialCase,
  comparableGrowth,
} from "./research-summary.ts";
import { ratio } from "./financial-formulas.ts";
import { priceStudies } from "./price-studies.ts";
export const DECISION_VERSION = "evidence-lenses-v1";
export const styles = {
  Balanced: [1, 1, 1, 1, 1, 1, 1, 1],
  Value: [3, 1, 0.5, 1.5, 1.5, 1, 0.5, 0.5],
  Growth: [0.5, 1.5, 3, 1, 1, 0.3, 1.5, 0.7],
  Income: [1.5, 1, 0.5, 1.5, 1.5, 3, 1, 0.5],
  Quality: [0.7, 2.5, 1, 1.5, 2, 0.5, 2.5, 0.3],
} as const;
export type ResearchStyle = keyof typeof styles;
export type EvidenceMetric = {
  id: string;
  label: string;
  value: number | null;
  unit: "percent" | "ratio" | "money" | "days";
  reason: string;
  score: number | null;
};
export type EvidenceLens = {
  id: string;
  name: string;
  score: number | null;
  metrics: EvidenceMetric[];
  note: string;
};
export type ModelInput = {
  cashFlow: number;
  growth: number;
  discount: number;
  terminal: number;
};
export function fadeDcf(p: ModelInput): number | null {
  if (
    !Object.values(p).every(Number.isFinite) ||
    p.cashFlow <= 0 ||
    p.growth <= -100 ||
    p.discount <= 0 ||
    p.discount - p.terminal < 1 ||
    p.terminal < 0 ||
    p.growth > 100 ||
    p.discount > 100
  )
    return null;
  let f = p.cashFlow,
    pv = 0;
  for (let t = 1; t <= 10; t++) {
    const g = p.growth - ((p.growth - p.terminal) * (t - 1)) / 9;
    f *= 1 + g / 100;
    pv += f / (1 + p.discount / 100) ** t;
  }
  const v =
    pv +
    (f * (1 + p.terminal / 100)) /
      ((p.discount - p.terminal) / 100) /
      (1 + p.discount / 100) ** 10;
  return Number.isFinite(v) && v > 0 ? v : null;
}
function bisect(
  fn: (n: number) => number | null,
  target: number,
  low: number,
  high: number,
  increasing: boolean,
) {
  if (!Number.isFinite(target) || target <= 0) return null;
  const a = fn(low),
    b = fn(high);
  if (
    a == null ||
    b == null ||
    target < Math.min(a, b) ||
    target > Math.max(a, b)
  )
    return null;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2,
      v = fn(mid);
    if (v == null) return null;
    if (v < target === increasing) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
export const solveDcfGrowth = (p: ModelInput, price: number) =>
  bisect((g) => fadeDcf({ ...p, growth: g }), price, -10, 40, true);
export const solveDcfReturn = (p: ModelInput, price: number) =>
  bisect(
    (d) => fadeDcf({ ...p, discount: d }),
    price,
    Math.max(p.terminal + 1, 1),
    40,
    false,
  );
export function anchorScore(
  value: number | null | undefined,
  anchors: readonly (readonly [number, number])[],
): number | null {
  if (value == null || !Number.isFinite(value) || anchors.length < 2)
    return null;
  const a = [...anchors].sort((x, y) => x[0] - y[0]);
  if (value <= a[0][0]) return a[0][1];
  if (value >= a.at(-1)![0]) return a.at(-1)![1];
  for (let i = 1; i < a.length; i++)
    if (value <= a[i][0])
      return (
        a[i - 1][1] +
        ((value - a[i - 1][0]) / (a[i][0] - a[i - 1][0])) *
          (a[i][1] - a[i - 1][1])
      );
  return null;
}
const percent = (a: number | null | undefined, b: number | null | undefined) =>
  ratio(a, b, 100);
const change = (a: number | null | undefined, b: number | null | undefined) =>
  a != null && b != null && b > 0 ? (a / b - 1) * 100 : null;
const mean = (x: number[]) =>
  x.length ? x.reduce((a, b) => a + b, 0) / x.length : null;
function computeResearchDecision(
  r: Research,
  style: ResearchStyle = "Balanced",
) {
  const e = latestFinancialEvidence(r),
    p = e.latest,
    q = e.prior,
    m = marketMultiples(r, p),
    reported = reportedCashPerShare(r,p),
    special = /bank|insurance|reit|real estate investment trust/i.test(
      [r.company.sector, r.evidence?.profile?.industry].join(" "),
    );
  const period = p?.end ?? null;
  const avgAssets =
      p?.assets != null && q?.assets != null && p.assets > 0 && q.assets > 0
        ? (p.assets + q.assets) / 2
        : null,
    avgEquity =
      p?.equity != null && q?.equity != null && p.equity > 0 && q.equity > 0
        ? (p.equity + q.equity) / 2
        : null;
  const accruals =
    p?.netIncome != null && p.operatingCashFlow != null
      ? percent(p.netIncome - p.operatingCashFlow, avgAssets)
      : null;
  const ownerCash =
    p?.fcf != null && p.stockCompensation != null
      ? p.fcf - p.stockCompensation
      : null;
  const yoy = p && q ? comparableGrowth(p, q) : null,
    shareGrowth = change(p?.weightedShares, q?.weightedShares);
  const three = e.rows
    .filter(
      (x) =>
        p &&
        x.currency === p.currency &&
        x.basis === p.basis &&
        Date.parse(p.end) - Date.parse(x.end) >= 1000 * 86400000 &&
        Date.parse(p.end) - Date.parse(x.end) <= 1200 * 86400000,
    )
    .at(-1);
  const cagr =
    p?.revenue != null &&
    three?.revenue != null &&
    p.revenue > 0 &&
    three.revenue > 0
      ? ((p.revenue / three.revenue) **
          (1 /
            ((Date.parse(p.end) - Date.parse(three.end)) / 86400000 / 365.25)) -
          1) *
        100
      : null;
  const metric = (
    id: string,
    label: string,
    value: number | null | undefined,
    unit: EvidenceMetric["unit"],
    reason: string,
    anchors?: readonly (readonly [number, number])[],
  ): EvidenceMetric => ({
    id,
    label,
    value: value != null && Number.isFinite(value) ? value : null,
    unit,
    reason,
    score: special ? null : anchors ? anchorScore(value, anchors) : null,
  });
  const lenses: EvidenceLens[] = [
    {
      id: "value",
      name: "Valuation",
      score: null,
      note: "Absolute screening anchors; no peer or historical percentile is inferred.",
      metrics: [
        metric(
          "fcfy",
          "FCF yield",
          m.fcfYield,
          "percent",
          "Operating cash flow less capex divided by matched market capitalization. Negative values indicate cash use.",
          [
            [0, 0],
            [2, 4],
            [4, 7],
            [7, 10],
          ],
        ),
        metric(
          "pe",
          "P/E · TTM",
          m.pe,
          "ratio",
          "Withheld for non-positive earnings or unreconciled shares/currency.",
        ),
        metric(
          "pfcf",
          "Price / FCF",
          m.pfcf,
          "ratio",
          "Not meaningful when cash flow is non-positive.",
        ),
        metric(
          "ps",
          "Price / sales",
          m.ps,
          "ratio",
          "Sales are not profits; sector margins matter.",
        ),
      ],
    },
    {
      id: "profit",
      name: "Profitability",
      score: null,
      note: "Reported margins and returns; high margins alone do not prove a moat.",
      metrics: [
        metric(
          "margin",
          "Operating margin",
          p?.margin,
          "percent",
          "Operating income / revenue.",
          [
            [-10, 0],
            [0, 4],
            [15, 7],
            [30, 10],
          ],
        ),
        metric(
          "gross",
          "Gross margin",
          p?.grossMargin,
          "percent",
          "Gross profit / revenue.",
        ),
        metric(
          "fcfm",
          "FCF margin",
          p?.fcfMargin,
          "percent",
          "OCF less capex / revenue.",
          [
            [-10, 0],
            [0, 4],
            [10, 7],
            [25, 10],
          ],
        ),
        metric(
          "roe",
          "ROE",
          percent(p?.netIncome, avgEquity),
          "percent",
          "Net income / average year-end equity; negative equity is not scored.",
        ),
        metric(
          "roa",
          "ROA",
          percent(p?.netIncome, avgAssets),
          "percent",
          "Net income / average year-end assets.",
        ),
      ],
    },
    {
      id: "growth",
      name: "Growth",
      score: null,
      note: "Compares matching currency, accounting basis and approximately one-year reporting intervals.",
      metrics: [
        metric(
          "revg",
          "Revenue growth · YoY",
          yoy,
          "percent",
          "Latest period versus the comparable prior period.",
          [
            [-5, 0],
            [3, 4],
            [10, 7],
            [20, 10],
          ],
        ),
        metric(
          "cagr",
          "Revenue CAGR · 3Y",
          cagr,
          "percent",
          "Positive revenue endpoints across approximately three years.",
        ),
        metric(
          "fcfg",
          "FCF growth · YoY",
          change(p?.fcf, q?.fcf),
          "percent",
          "Only shown with a positive prior cash-flow base.",
        ),
        metric(
          "perShare",
          "Revenue / share growth",
          p && q
            ? change(
                ratio(p.revenue, p.weightedShares),
                ratio(q.revenue, q.weightedShares),
              )
            : null,
          "percent",
          "Uses weighted-average diluted shares from each matching period.",
        ),
      ],
    },
    {
      id: "health",
      name: "Financial health",
      score: null,
      note: "Liquidity and debt-servicing screens; these do not estimate default probabilities.",
      metrics: [
        metric(
          "current",
          "Current ratio",
          p?.currentRatio,
          "ratio",
          "Current assets / current liabilities.",
          [
            [0.5, 0],
            [1, 4],
            [1.5, 7],
            [2.5, 10],
          ],
        ),
        metric(
          "interest",
          "Interest coverage",
          p?.interestCoverage,
          "ratio",
          "Operating income / interest expense. No invented 99× for debt-free firms.",
          [
            [1.5, 0],
            [3, 4],
            [8, 7],
            [15, 10],
          ],
        ),
        metric(
          "netdebt",
          "Net debt",
          p?.netDebt,
          "money",
          "Reported debt less cash, not a leverage ratio.",
        ),
        metric(
          "de",
          "Debt / equity",
          p?.debtEquity,
          "ratio",
          "Withheld when book equity is non-positive.",
        ),
      ],
    },
    {
      id: "cash",
      name: "Cash quality",
      score: null,
      note: "SBC-adjusted FCF is a sensitivity proxy, not the cash owners literally receive.",
      metrics: [
        metric(
          "convert",
          "OCF / net income",
          p?.cashConversion,
          "ratio",
          "Cash generated by operations relative to positive accounting profit.",
          [
            [0, 0],
            [0.5, 4],
            [0.8, 7],
            [1.1, 10],
          ],
        ),
        metric(
          "sbc",
          "Stock pay / revenue",
          p?.sbcRevenue,
          "percent",
          "Check net dilution and buyback costs alongside this expense.",
          [
            [1, 10],
            [5, 7],
            [10, 4],
            [20, 0],
          ],
        ),
        metric(
          "accruals",
          "Accruals / average assets",
          accruals,
          "percent",
          "(Net income − OCF) / average assets.",
          [
            [-3, 10],
            [2, 7],
            [8, 4],
            [15, 0],
          ],
        ),
        metric(
          "owner",
          "FCF less stock pay",
          ownerCash,
          "money",
          "Illustrative deduction of reported SBC; not a GAAP cash-flow measure.",
        ),
        metric(
          "ownerYield",
          "SBC-adjusted FCF yield",
          percent(ownerCash, m.marketCap),
          "percent",
          "(FCF − stock compensation) / matched market capitalization.",
        ),
      ],
    },
    {
      id: "returns",
      name: "Owner returns",
      score: null,
      note: "Capital returned is useful only when funded sustainably. Dividend/share totals are not total return.",
      metrics: [
        metric(
          "dilution",
          "Share count change · YoY",
          shareGrowth,
          "percent",
          "Weighted-average diluted share count change; buybacks and issuance both matter.",
          [
            [-3, 10],
            [0, 7],
            [3, 4],
            [10, 0],
          ],
        ),
        metric(
          "dividend",
          "Dividend cash / FCF",
          p?.dividends != null ? percent(Math.abs(p.dividends), p.fcf) : null,
          "percent",
          "Reported dividend cash against positive cash flow.",
        ),
        metric(
          "buyback",
          "Buyback cash",
          p?.buybacks,
          "money",
          "Reported repurchases; not inferred from financing cash flow.",
        ),
      ],
    },
    {
      id: "moat",
      name: "Business moat",
      score: null,
      note: "Requires cited competitive evidence. Margin persistence, company descriptions and AI prose cannot establish switching costs, network effects or pricing power.",
      metrics: [],
    },
    {
      id: "sentiment",
      name: "Ownership & expectations",
      score: null,
      note: "Reported consensus and holdings are observations. They do not establish who is buying now or that a stock is attractive.",
      metrics: [
        metric(
          "institutions",
          "Reported institutional ownership",
          r.evidence?.ownership?.institutions,
          "percent",
          "Provider snapshot; reporting dates and coverage vary.",
        ),
        metric(
          "insiders",
          "Reported insider ownership",
          r.evidence?.ownership?.insiders,
          "percent",
          "Ownership percentage, not transaction activity.",
        ),
        metric(
          "target",
          "Analyst target",
          r.evidence?.consensus?.target,
          "money",
          "Published opinion; horizon and dispersion may be unavailable.",
        ),
      ],
    },
  ];
  for (const l of lenses)
    l.score = mean(
      l.metrics.flatMap((x) => (x.score == null ? [] : [x.score])),
    );
  const weights = styles[style],
    scored = lenses.flatMap((x, i) =>
      x.score == null ? [] : [{ s: x.score, w: weights[i] }],
    );
  const overall =
    scored.length >= 4
      ? scored.reduce((a, x) => a + x.s * x.w, 0) /
        scored.reduce((a, x) => a + x.w, 0)
      : null;
  const flags: { id: string; title: string; text: string; severe: boolean }[] =
    [];
  const check = (
    id: string,
    value: number | null | undefined,
    hit: (n: number) => boolean,
    title: string,
    text: string,
    severe = false,
  ) => {
    if (value != null && Number.isFinite(value) && hit(value))
      flags.push({ id, title, text, severe });
  };
  check(
    "cash",
    p?.fcf,
    (n) => n < 0,
    "Cash use after investment",
    "Review funding requirements and capital spending before scaling a position.",
  );
  check(
    "interest",
    p?.interestCoverage,
    (n) => n < 2,
    "Thin interest buffer",
    "Operating profit covers interest fewer than twice.",
    true,
  );
  check(
    "margin",
    p?.margin,
    (n) => n < 0,
    "Operating losses",
    "Revenue growth has not yet produced operating profitability.",
  );
  check(
    "sbc",
    p?.sbcRevenue,
    (n) => n > 10,
    "High equity compensation",
    "Stock pay exceeds 10% of reported revenue.",
  );
  check(
    "dilution",
    shareGrowth,
    (n) => n >= 3,
    "Dilution to monitor",
    "Weighted diluted shares increased at least 3% over the comparable period.",
  );
  check(
    "accruals",
    accruals,
    (n) => n > 10,
    "Profit and cash diverge",
    "Accruals exceed 10% of average assets.",
  );
  check(
    "liquidity",
    p?.currentRatio,
    (n) => n < 1,
    "Near-term liquidity review",
    "Current assets are below current liabilities; sector and cash-generation context matter.",
  );
  flags.sort((a, b) => Number(b.severe) - Number(a.severe));
  const { studies, technical, bars, volatility, maxDrawdown, range } =
    decisionHistory(r);
  const next = (r.evidence?.earnings ?? [])
    .filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const fcase = financialCase(p, q);
  const tripwires = lenses
    .flatMap((x) => x.metrics)
    .filter(
      (x) =>
        ["current", "interest", "sbc", "margin"].includes(x.id) &&
        x.value != null,
    )
    .map((x) => {
      const threshold =
        x.id === "current"
          ? 1
          : x.id === "interest"
            ? 2
            : x.id === "sbc"
              ? 10
              : 0;
      const high = x.id === "sbc";
      const distance = high ? threshold - x.value! : x.value! - threshold;
      return {
        id: x.id,
        label: x.label,
        value: x.value!,
        unit: x.unit,
        threshold,
        direction: high ? "above" : "below",
        breached: distance <= 0,
        headroom:
          x.value === 0
            ? null
            : Math.max(0, (distance / Math.abs(x.value!)) * 100),
      };
    });
  const gaps = [
    ...(!p ? ["Comparable financial statements"] : []),
    ...lenses.filter((x) => x.score == null).map((x) => x.name),
    ...(special ? ["Specialist sector scoring"] : []),
  ];
  return {
    version: DECISION_VERSION,
    style,
    period,
    currency: p?.currency ?? r.quote.currency,
    lenses,
    overall,
    scoredLenses: scored.length,
    metricsAvailable: lenses
      .flatMap((x) => x.metrics)
      .filter((x) => x.value != null).length,
    flags,
    gaps,
    tripwires,
    forCase: fcase.positive.slice(0, 3),
    against: fcase.risks.slice(0, 3),
    description: r.company.description || r.evidence?.profile?.description || "",
    sector: r.company.sector || r.evidence?.profile?.sector || "",
    nextReport: next?.date ?? null,
    stance: flags.some((x) => x.severe)
      ? "Resolve financing risk first"
      : !p
        ? "Build the evidence first"
        : p.margin != null && p.margin > 0 && p.fcf != null && p.fcf > 0
          ? "Profitable, cash-generating business"
          : "Growth case needs verification",
    timing: {
      ...studies,
      ...technical,
      volatility,
      maxDrawdown: bars.length >= 60 ? maxDrawdown : null,
      rangePosition: range,
      observations: bars.length,
    },
    modelCashFlowPerShare: reported.cash,
    modelSbcPerShare: reported.sbc,
    modelEligible:
      !special && r.company.assetType === "stock" && !r.company.foreignListing,
  };
}

function computeDecisionHistory(r: Research) {
  const studies = priceStudies(r.history, r.retrievedAt),
    technical = indicators(r.history, r.retrievedAt);
  const bars = [
    ...new Map(
      r.history
        .filter(
          (x) =>
            /^\d{4}-\d{2}-\d{2}$/.test(x.time) &&
            x.time < r.retrievedAt.slice(0, 10) &&
            x.close > 0 &&
            [x.close, x.high, x.low, x.volume].every(Number.isFinite),
        )
        .map((x) => [x.time, x]),
    ).values(),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const last252 = bars.slice(-252),
    last = bars.at(-1)?.close;
  const vol = bars
    .slice(-253)
    .slice(1)
    .map((x, i, a) => Math.log(x.close / bars.slice(-253)[i].close));
  const avg = mean(vol);
  const volatility =
    vol.length >= 60 && avg != null
      ? Math.sqrt(
          vol.reduce((a, x) => a + (x - avg) ** 2, 0) / (vol.length - 1),
        ) *
        Math.sqrt(r.company.assetType === "crypto" ? 365 : 252) *
        100
      : null;
  let peak = 0,
    maxDrawdown = 0;
  for (const b of bars) {
    peak = Math.max(peak, b.close);
    maxDrawdown = Math.min(maxDrawdown, (b.close / peak - 1) * 100);
  }
  const range =
    last252.length >= 200 && last != null
      ? ratio(
          last - Math.min(...last252.map((x) => x.low)),
          Math.max(...last252.map((x) => x.high)) -
            Math.min(...last252.map((x) => x.low)),
          100,
        )
      : null;

  return { studies, technical, bars, volatility, maxDrawdown, range };
}
const historyMemo = evidenceMemo<ReturnType<typeof computeDecisionHistory>>();
function decisionHistory(r: Research) {
  return historyMemo(
    r.history,
    `${r.history.length}:${r.retrievedAt}:${r.company.assetType}`,
    () => computeDecisionHistory(r),
  );
}

const decisionMemo = evidenceMemo<ReturnType<typeof computeResearchDecision>>();
/** Research snapshots are immutable; a new quote/evidence object invalidates this cache. */
export function researchDecision(r: Research, style: ResearchStyle = "Balanced") {
  return decisionMemo(r, style, () => computeResearchDecision(r, style));
}

```

## Reference: analysis
Source: lib/analysis.ts
SHA-256: e0ccfac7503fcd338b6e02455549e7c39ad18997340969c339866402c6f35b61

```typescript
import { researchAccumulation } from "./accumulation-policy-v5.ts";
import { evidenceMemo } from "./evidence-memo.ts";
import { modelCoverage, ttmPeriods } from "./research-depth.ts";
import type { Candle, Research, FinancialPeriod } from "./types";
import { financialPeriods, cashFlowValue } from "./engine.ts";
import { selectFinancialPeriod } from "./financial-period-selection.ts";
export const annualRows = (r: Research) =>
  financialPeriods(r.facts, "annual", r.retrievedAt);
function computeFinancialEvidence(r: Research) {
  const annual = annualRows(r),
    ttm = ttmPeriods(r.facts, r.retrievedAt);
  const currency = r.evidence?.reportingCurrency ?? r.quote.currency,
    a = selectFinancialPeriod(annual, currency),
    t = selectFinancialPeriod(ttm, currency);
  const useTtm = !!t && (!a || t.end > a.end) && t.revenue != null;
  const rows = useTtm ? ttm : annual,
    latest = useTtm ? t : a;
  const prior = latest
    ? selectFinancialPeriod(
        rows.filter((x) => {
          const days = (Date.parse(latest.end) - Date.parse(x.end)) / 86400000;
          return (
            days >= 330 &&
            days <= 400 &&
            x.currency === latest.currency &&
            x.basis === latest.basis
          );
        }),
        latest.currency,
      )
    : undefined;
  return { rows, latest, prior, periodBasis: useTtm ? "TTM" : "Annual" };
}
function computeIndicators(bars: Candle[], asOf: string) {
  const day = asOf.slice(0, 10),
    rows = bars
      .filter(
        (b) =>
          b.time.length === 10 &&
          b.time < day &&
          Number.isFinite(b.close) &&
          b.close > 0,
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  const close = rows.at(-1)?.close ?? null,
    mean = (n: number) =>
      rows.length >= n
        ? rows.slice(-n).reduce((s, b) => s + b.close, 0) / n
        : null;
  let rsi: number | null = null;
  if (rows.length >= 15) {
    let gain = 0,
      loss = 0;
    for (let i = 1; i <= 14; i++) {
      const d = rows[i].close - rows[i - 1].close;
      gain += Math.max(0, d) / 14;
      loss += Math.max(0, -d) / 14;
    }
    for (let i = 15; i < rows.length; i++) {
      const d = rows[i].close - rows[i - 1].close;
      gain = (gain * 13 + Math.max(0, d)) / 14;
      loss = (loss * 13 + Math.max(0, -d)) / 14;
    }
    rsi =
      gain === 0 && loss === 0
        ? 50
        : loss === 0
          ? 100
          : 100 - 100 / (1 + gain / loss);
  }
  const recent = rows.slice(-126),
    low = recent.length ? Math.min(...recent.map((b) => b.low)) : null,
    high = recent.length ? Math.max(...recent.map((b) => b.high)) : null;
  const fib =
    low != null && high != null && high > low
      ? [0.236, 0.382, 0.5, 0.618, 0.686, 0.786].map((ratio) => ({
          ratio,
          price: high - (high - low) * ratio,
        }))
      : [];
  const averageVolume =
    rows.length >= 21
      ? rows.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / 20
      : null;
  const trueRanges = rows
    .slice(1)
    .map((b, i) =>
      Math.max(
        b.high - b.low,
        Math.abs(b.high - rows[i].close),
        Math.abs(b.low - rows[i].close),
      ),
    );
  const atr =
    close && trueRanges.length >= 14
      ? (trueRanges.slice(-14).reduce((s, n) => s + n, 0) / 14 / close) * 100
      : null;
  const ma50 = mean(50),
    ma200 = mean(200),
    trend =
      close && ma50 && ma200
        ? close > ma50 && ma50 > ma200
          ? "Constructive"
          : close < ma50 && ma50 < ma200
            ? "Weak"
            : "Mixed"
        : "Not assessed";
  return {
    close,
    rsi,
    ma50,
    ma200,
    atr,
    volumeRatio:
      averageVolume && rows.at(-1) ? rows.at(-1)!.volume / averageVolume : null,
    trend,
    fib,
    low,
    high,
    first: recent[0]?.time,
    last: rows.at(-1)?.time,
  };
}
export function valuationInputs(r: Research) {
  const evidence = latestFinancialEvidence(r),
    latest = evidence.latest,
    today = r.retrievedAt.slice(0, 10);
  const share = r.facts
    .filter(
      (f) =>
        f.metric === "shares" &&
        f.scope === "instant" &&
        f.unit === "shares" &&
        f.value > 0 &&
        f.end <= today &&
        f.filed <= today,
    )
    .sort(
      (a, b) => a.end.localeCompare(b.end) || a.filed.localeCompare(b.filed),
    )
    .at(-1);
  const issues: string[] = [];
  if (!latest || latest.fcf == null)
    issues.push(
      "Matching operating cash flow and capital expenditure are needed.",
    );
  else if (latest.fcf <= 0)
    issues.push(
      "This cash-flow method is unsuitable for a business with negative free cash flow.",
    );
  if (latest && Date.parse(today) - Date.parse(latest.end) > 550 * 86400_000)
    issues.push(
      "The reported cash-flow period is too old for a current scenario.",
    );
  if (!share || Date.parse(today) - Date.parse(share.end) > 180 * 86400_000)
    issues.push("A recent outstanding share count is needed.");
  if (latest && latest.currency !== r.quote.currency)
    issues.push(
      "Reported and quote currencies differ; conversion is not available.",
    );
  if (r.company.assetType === "crypto")
    issues.push("Corporate cash-flow valuation does not apply to crypto.");
  // Foreign listings require explicit listed-share/ADR reconciliation, never assume 1:1.
  if (
    r.company.foreignListing ||
    (share && ["20-F", "40-F"].includes(share.form))
  )
    issues.push(
      "Reconcile listed shares or ADR units before using per-share valuation.",
    );
  const coverage = modelCoverage(r.company.symbol, r.company.assetType, {
    sector: r.evidence?.profile?.sector || r.company.sector,
    industry: r.evidence?.profile?.industry,
  });
  if (coverage.family !== "operating-company") issues.push(coverage.method);
  const eligible = issues.length === 0;
  const scenarios = eligible
    ? [-5, 0, 5].map((growth, i) => ({
        name: ["Bear", "Base", "Bull"][i],
        growth,
        discount: [12, 10, 9][i],
        terminal: [0, 2, 2][i],
        value: cashFlowValue(
          latest!.fcf!,
          share!.value,
          growth,
          [12, 10, 9][i],
          [0, 2, 2][i],
          1,
        ),
      }))
    : [];
  return {
    latest,
    share,
    issues,
    eligible,
    scenarios,
    periodBasis: evidence.periodBasis,
  };
}
export function perspective(r: Research) {
  const evidence = latestFinancialEvidence(r),
    rows = evidence.rows,
    last = evidence.latest,
    previous = evidence.prior,
    tech = indicators(r.history, r.retrievedAt),
    dca = researchAccumulation(
      r.history,
      r.retrievedAt,
      r.company.assetType === "crypto" ? "crypto" : "us-equity",
    ),
    v = valuationInputs(r);
  const current =
    last && Date.parse(r.retrievedAt) - Date.parse(last.end) < 550 * 86400_000;
  const strong =
    current &&
    last.revenue != null &&
    last.revenue > 0 &&
    last.netIncome != null &&
    last.netIncome > 0 &&
    !(last.operatingIncome != null && last.operatingIncome < 0) &&
    last.fcf != null &&
    last.fcf > 0;
  const business =
    r.company.assetType === "crypto"
      ? "Not applicable"
      : !current
        ? "Needs evidence"
        : strong
          ? "Profitable"
          : last.netIncome != null && last.netIncome < 0
            ? "Loss-making"
            : "Mixed economics";
  // A calculator's generic growth/discount settings are not an investment rating.
  const valuation = v.eligible ? "Assumption dependent" : "Not established";
  const heading =
    r.company.assetType === "crypto"
      ? "Price structure, with risk in view."
      : !current
        ? "Build the picture from current evidence."
        : strong
          ? tech.trend === "Weak"
            ? "Profitable business. Weak price trend."
            : "Profitable business. Put the price in context."
          : last.netIncome != null && last.netIncome < 0
            ? "Reported losses. Review cash generation."
            : "Review cash generation and the price together.";
  const gap =
    last && previous
      ? (Date.parse(last.end) - Date.parse(previous.end)) / 86400_000
      : 0;
  const growth =
    last?.revenue != null &&
    previous?.revenue != null &&
    previous.revenue > 0 &&
    last.currency === previous.currency &&
    gap >= 330 &&
    gap <= 400
      ? (last.revenue / previous.revenue - 1) * 100
      : null;
  return {
    business,
    valuation,
    heading,
    tech,
    dca,
    valuationInputs: v,
    rows,
    last,
    growth,
    strong,
    periodBasis: evidence.periodBasis,
  };
}
export function periodLabel(row: FinancialPeriod) {
  return new Date(row.end).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const financialMemo =
  evidenceMemo<ReturnType<typeof computeFinancialEvidence>>();
export function latestFinancialEvidence(r: Research) {
  return financialMemo(
    r.facts,
    `${r.facts.length}:${r.retrievedAt}:${r.evidence?.reportingCurrency ?? r.quote.currency}`,
    () => computeFinancialEvidence(r),
  );
}
const indicatorMemo = evidenceMemo<ReturnType<typeof computeIndicators>>();
export function indicators(bars: Candle[], asOf: string) {
  return indicatorMemo(bars, `${bars.length}:${asOf}`, () =>
    computeIndicators(bars, asOf),
  );
}

```

## Reference: technical-context
Source: lib/technical-context.ts
SHA-256: b0e428102c0369ebaf6a897ee4c8f1522c29437dfef4529cf403005f0ed17e4f

```typescript
import type { Candle } from "./types";
import { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
import { weekKey, weekEndSession } from "./accumulation-weekly.ts";
import { evidenceMemo } from "./evidence-memo.ts";
function compute(
  input: Candle[],
  asOf: string,
  market: "us-equity" | "crypto",
) {
  const rows = adaptiveSettledBars(input, asOf, market).filter(
      (b) => b.time < asOf.slice(0, 10),
    ),
    last = rows.at(-1),
    typical = (b: Candle) => (b.high + b.low + b.close) / 3;
  const range = (n: number) => {
    if (rows.length <= n) return null;
    const b = rows.slice(-n - 1, -1);
    return {
      high: Math.max(...b.map((x) => x.high)),
      low: Math.min(...b.map((x) => x.low)),
    };
  };
  let cci: number | null = null,
    williamsR: number | null = null,
    mfi: number | null = null,
    efficiency: number | null = null;
  if (rows.length >= 20) {
    const p = rows.slice(-20).map(typical),
      mean = p.reduce((s, x) => s + x, 0) / 20,
      dev = p.reduce((s, x) => s + Math.abs(x - mean), 0) / 20;
    cci = dev > 0 ? (p.at(-1)! - mean) / (0.015 * dev) : 0;
  }
  if (rows.length >= 14) {
    const b = rows.slice(-14),
      hi = Math.max(...b.map((x) => x.high)),
      lo = Math.min(...b.map((x) => x.low));
    williamsR = hi > lo ? (-100 * (hi - last!.close)) / (hi - lo) : null;
  }
  if (
    rows.length >= 15 &&
    rows.slice(-15).every((b) => Number.isFinite(b.volume) && b.volume > 0)
  ) {
    const b = rows.slice(-15);
    let positive = 0,
      negative = 0;
    for (let i = 1; i < b.length; i++) {
      const p = typical(b[i]),
        before = typical(b[i - 1]),
        flow = p * b[i].volume;
      if (p > before) positive += flow;
      else if (p < before) negative += flow;
    }
    mfi =
      positive + negative > 0 ? (100 * positive) / (positive + negative) : null;
  }
  if (rows.length >= 11) {
    const b = rows.slice(-11),
      travel = b
        .slice(1)
        .reduce((s, x, i) => s + Math.abs(x.close - b[i].close), 0);
    efficiency =
      travel > 0 ? Math.abs(b.at(-1)!.close - b[0].close) / travel : 0;
  }
  const weeks = new Map<string, Candle>();
  for (const b of rows) {
    const key = weekKey(b.time, market);
    // Select the expected completed close itself. A spurious Friday holiday
    // observation must not overwrite a valid Thursday close and erase a week.
    if (b.time === weekEndSession(key, market)) weeks.set(key, b);
  }
  const weekly = [...weeks.entries()];
  const wma = (n: number) => {
    if (weekly.length < n) return null;
    const selected = weekly.slice(-n);
    if (
      selected.some(
        ([key], i) =>
          i > 0 &&
          Date.parse(key) - Date.parse(selected[i - 1][0]) !== 7 * 86400000,
      )
    )
      return null;
    return (
      selected.reduce((s, [, b], i) => s + b.close * (i + 1), 0) /
      ((n * (n + 1)) / 2)
    );
  };
  return {
    asOf: last?.time ?? null,
    cci,
    williamsR,
    mfi,
    efficiency,
    donchian20: range(20),
    donchian55: range(55),
    wma50Week: wma(50),
    wma200Week: wma(200),
    weeklyAsOf: weekly.at(-1)?.[1].time ?? null,
  };
}
const memo = evidenceMemo<ReturnType<typeof compute>>();
export function technicalContext(
  input: Candle[],
  asOf: string,
  market: "us-equity" | "crypto" = "us-equity",
) {
  return memo(input, `${asOf}:${market}`, () => compute(input, asOf, market));
}

```

## Reference: technical-depth
Source: lib/technical-depth.ts
SHA-256: ed77300587b5e2fe68156c09ab78d2855d5ca54471a7a8822b918cc05f7dd3d0

```typescript
import type { Candle } from "./types";
export function fibOverlay(low: number, high: number, custom = false) {
  if (
    !Number.isFinite(low) ||
    !Number.isFinite(high) ||
    low <= 0 ||
    high <= low
  )
    return [];
  return [
    0,
    0.236,
    0.382,
    0.5,
    0.618,
    ...(custom ? [0.686] : []),
    0.786,
    1,
    1.272,
    1.618,
  ].map((ratio) => ({
    ratio,
    price:
      Math.round(
        (ratio <= 1
          ? high - (high - low) * ratio
          : low + (high - low) * ratio) * 1e6,
      ) / 1e6,
    kind:
      ratio === 0.686
        ? "custom"
        : ratio > 1
          ? "extension"
          : ratio === 0.5
            ? "common convention"
            : "retracement",
  }));
}
export function trendMarkers(bars: Candle[], asOf: string) {
  const rows = bars
    .filter(
      (b) => b.time.length === 10 && b.time < asOf.slice(0, 10) && b.close > 0,
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const result: {
    time: string;
    price: number;
    label: string;
    invalidation: number;
  }[] = [];
  let previous = false;
  for (let i = 199; i < rows.length; i++) {
    const ma50 =
        rows.slice(i - 49, i + 1).reduce((s, b) => s + b.close, 0) / 50,
      ma200 = rows.slice(i - 199, i + 1).reduce((s, b) => s + b.close, 0) / 200,
      active = rows[i].close > ma50 && ma50 > ma200;
    if (active && !previous)
      result.push({
        time: rows[i].time,
        price: rows[i].close,
        label: "Trend alignment",
        invalidation: ma50,
      });
    previous = active;
  }
  return result;
}
export function correlation(
  a: { time: string; close: number }[],
  b: { time: string; close: number }[],
): number | null {
  const map = new Map(b.map((x) => [x.time, x.close])),
    pairs = a
      .filter((x) => map.has(x.time) && x.close > 0 && map.get(x.time)! > 0)
      .sort((x, y) => x.time.localeCompare(y.time));
  if (pairs.length < 61) return null;
  const returns = pairs
    .slice(1)
    .map((x, i) => [
      x.close / pairs[i].close - 1,
      map.get(x.time)! / map.get(pairs[i].time)! - 1,
    ]);
  const mean = (j: number) =>
      returns.reduce((s, x) => s + x[j], 0) / returns.length,
    mx = mean(0),
    my = mean(1);
  let xy = 0,
    xx = 0,
    yy = 0;
  for (const [x, y] of returns) {
    xy += (x - mx) * (y - my);
    xx += (x - mx) ** 2;
    yy += (y - my) ** 2;
  }
  return xx > 0 && yy > 0 ? xy / Math.sqrt(xx * yy) : null;
}

```

## Reference: technical-expanded
Source: lib/technical-expanded.ts
SHA-256: e5da89c9e0c1be7694f948a661cf083b77e101b5d64862a8cfe5e12c41a820f7

```typescript
import type { Candle } from "./types";
import { priceStudies } from "./price-studies.ts";
export function expandedStudies(
  bars: Candle[],
  asOf: string,
  benchmark: Candle[] = [],
) {
  const rows = [
    ...new Map(
      bars
        .filter(
          (b) =>
            b.time.length === 10 &&
            b.time < asOf.slice(0, 10) &&
            [b.open, b.high, b.low, b.close].every(
              (x) => Number.isFinite(x) && x > 0,
            ),
        )
        .map((b) => [b.time, b]),
    ).values(),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const last = rows.at(-1),
    studies = priceStudies(rows, asOf),
    n = 14;
  let tr = 0,
    plus = 0,
    minus = 0,
    atr: number | null = null,
    adx: number | null = null,
    obv = 0;
  const dx: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1],
      b = rows[i],
      range = Math.max(
        b.high - b.low,
        Math.abs(b.high - a.close),
        Math.abs(b.low - a.close),
      ),
      up = b.high - a.high,
      down = a.low - b.low,
      p = up > down && up > 0 ? up : 0,
      m = down > up && down > 0 ? down : 0;
    obv += b.close > a.close ? b.volume : b.close < a.close ? -b.volume : 0;
    if (i <= n) {
      tr += range;
      plus += p;
      minus += m;
    } else {
      tr = tr - tr / n + range;
      plus = plus - plus / n + p;
      minus = minus - minus / n + m;
    }
    if (i >= n) {
      atr = tr / n;
      const total = plus + minus;
      dx.push(total > 0 ? (100 * Math.abs(plus - minus)) / total : 0);
      if (dx.length === n) adx = dx.reduce((s, v) => s + v, 0) / n;
      else if (dx.length > n) adx = (adx! * (n - 1) + dx.at(-1)!) / n;
    }
  }
  const avgVolume =
    rows.length >= 21
      ? rows.slice(-21, -1).reduce((s, b) => s + b.volume, 0) / 20
      : 0;
  const bb = studies.bands,
    width = bb ? bb.high - bb.low : 0,
    peak = rows.length ? Math.max(...rows.slice(-252).map((b) => b.close)) : 0;
  const benchmarkByDay = new Map(
    benchmark
      .filter((b) => b.time < asOf.slice(0, 10))
      .map((b) => [b.time, b.close]),
  );
  const shared = rows
    .filter((b) => (benchmarkByDay.get(b.time) ?? 0) > 0)
    .slice(-64);
  const stochastic = rows.slice(-3).map((b, i, tail) => {
    const end = rows.length - tail.length + i + 1;
    const sample = rows.slice(Math.max(0, end - 14), end);
    if (sample.length < 14) return null;
    const high = Math.max(...sample.map((v) => v.high)),
      low = Math.min(...sample.map((v) => v.low));
    return high > low ? (100 * (b.close - low)) / (high - low) : null;
  });
  const relativeReturn =
    shared.length === 64
      ? 100 *
        (shared.at(-1)!.close / shared[0].close -
          1 -
          (benchmarkByDay.get(shared.at(-1)!.time)! /
            benchmarkByDay.get(shared[0].time)! -
            1))
      : null;
  return {
    stochasticK: stochastic.at(-1) ?? null,
    stochasticD:
      stochastic.length === 3 && stochastic.every((v) => v != null)
        ? stochastic.reduce<number>((sum, v) => sum + v!, 0) / 3
        : null,
    roc20:
      rows.length >= 21 && last
        ? (last.close / rows[rows.length - 21].close - 1) * 100
        : null,
    plusDI: rows.length > n ? (tr > 0 ? (plus / tr) * 100 : 0) : null,
    minusDI: rows.length > n ? (tr > 0 ? (minus / tr) * 100 : 0) : null,
    adx,
    atr,
    atrPct: atr != null && last ? (atr / last.close) * 100 : null,
    obv: rows.some((b) => b.volume > 0) ? obv : null,
    relativeVolume: avgVolume > 0 && last ? last.volume / avgVolume : null,
    bandwidth: bb && bb.mid > 0 ? (width / bb.mid) * 100 : null,
    percentB:
      bb && width > 0 && last ? ((last.close - bb.low) / width) * 100 : null,
    drawdown: peak > 0 && last ? (last.close / peak - 1) * 100 : null,
    relativeReturn,
  };
}

```

## Reference: price-studies
Source: lib/price-studies.ts
SHA-256: aa1e5df75495803b0d3577da2ba17baeb8a36eb18aa7370d4d0ba7d3afaf825e

```typescript
import { evidenceMemo } from "./evidence-memo.ts";
import type { Candle } from "./types";
/** Daily studies use completed dated observations only; no additional provider calls. */
function computePriceStudies(bars: Candle[], asOf: string) {
  const closes = [
    ...new Map(
      bars
        .filter(
          (b) =>
            /^\d{4}-\d{2}-\d{2}$/.test(b.time) &&
            b.time < asOf.slice(0, 10) &&
            Number.isFinite(b.close) &&
            b.close > 0,
        )
        .map((b) => [b.time, b]),
    ).values(),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((b) => b.close);
  const ema = (values: number[], length: number): (number | null)[] => {
    let previous: number | null = null;
    return values.map((value, i) => {
      if (i < length - 1) return null;
      previous =
        previous == null
          ? values.slice(0, length).reduce((s, v) => s + v, 0) / length
          : previous + ((value - previous) * 2) / (length + 1);
      return previous;
    });
  };
  const fast = ema(closes, 12),
    slow = ema(closes, 26);
  const line = fast.flatMap((v, i) =>
    v != null && slow[i] != null ? [v - slow[i]!] : [],
  );
  const macd = line.at(-1) ?? null,
    signal = ema(line, 9).at(-1) ?? null;
  const window = closes.slice(-20);
  const mid =
    window.length === 20 ? window.reduce((s, v) => s + v, 0) / 20 : null;
  const sigma =
    mid == null
      ? null
      : Math.sqrt(window.reduce((s, v) => s + (v - mid) ** 2, 0) / 20);
  return {
    ema20: ema(closes, 20).at(-1) ?? null,
    macd,
    signal,
    histogram: macd != null && signal != null ? macd - signal : null,
    bands:
      mid != null && sigma != null
        ? { low: mid - 2 * sigma, mid, high: mid + 2 * sigma }
        : null,
  };
}

const studiesMemo = evidenceMemo<ReturnType<typeof computePriceStudies>>();
export function priceStudies(bars: Candle[], asOf: string) {
  return studiesMemo(bars, `${bars.length}:${asOf}`, () =>
    computePriceStudies(bars, asOf),
  );
}

```

## Reference: price-risk-scenarios
Source: lib/price-risk-scenarios.ts
SHA-256: cd52aef175078e26e04e60feeb2987643c982b62b55b05b9a1dea30ce847ac51

```typescript
import type { Research } from "./types";
import { adaptiveSettledBars } from "./accumulation-policy-v3.ts";
type PriceRiskCase = {
  name: "10th percentile" | "Historical median" | "90th percentile";
  target: number;
  change: number;
  percentile: number;
};
export type PriceRiskScenarios =
  | { available: false; reason: string }
  | {
      available: true;
      basis: "historical-price-risk";
      cases: PriceRiskCase[];
      currency: string;
      reference: number;
      referenceDate: string;
      referenceBasis: "quote" | "settled-close";
      horizon: number;
      samples: number;
      from: string;
      through: string;
      caveat: string;
    };
/** Empirical overlapping-window outcomes. Not probabilities, analyst targets or fair value. */
export function priceRiskScenarios(r: Research): PriceRiskScenarios {
  const unavailable = (reason: string): PriceRiskScenarios => ({
    available: false,
    reason,
  });
  const now = Date.parse(r.priceObservedAt ?? r.retrievedAt);
  if (!Number.isFinite(now))
    return unavailable("A dated observation is required.");
  if (r.company.currency !== r.quote.currency)
    return unavailable(
      "Price and listing currencies differ; scenarios are withheld.",
    );
  const crypto = r.company.assetType === "crypto";
  const bars = adaptiveSettledBars(
    r.history,
    new Date(now).toISOString(),
    crypto ? "crypto" : "us-equity",
  ).slice(-1260);
  if (bars.length < 80)
    return unavailable(
      "At least 80 valid settled daily observations are needed for historical price-risk cases.",
    );
  const last = bars.at(-1)!;
  if (now - Date.parse(last.time) > 10 * 86400000)
    return unavailable(
      "The latest settled history is too old for a current price-risk range.",
    );
  const at = Date.parse(r.quote.asOf ?? "");
  const useQuote =
    r.quote.price != null &&
    Number.isFinite(r.quote.price) &&
    r.quote.price > 0 &&
    Number.isFinite(at) &&
    at <= now + 60000 &&
    now - at <= 7 * 86400000;
  const reference = useQuote ? r.quote.price! : last.close,
    referenceDate = useQuote ? r.quote.asOf! : last.time;
  const horizon = bars.length >= 252 ? 63 : 20;
  const returns: number[] = [];
  const gaps = bars.map((b, i) =>
    i > 0 &&
    Date.parse(b.time) - Date.parse(bars[i - 1].time) >
      (crypto ? 3 : 10) * 86400000
      ? 1
      : 0,
  );
  for (let i = 1; i < gaps.length; i++) gaps[i] += gaps[i - 1];
  for (let i = horizon; i < bars.length; i++) {
    if (gaps[i] !== gaps[i - horizon]) continue;
    const move = Math.log(bars[i].close / bars[i - horizon].close);
    if (Number.isFinite(move)) returns.push(move);
  }
  if (returns.length < 40)
    return unavailable(
      "At least 40 intact historical return windows are needed; the supplied history is too short or discontinuous.",
    );
  returns.sort((a, b) => a - b);
  const quantile = (p: number) => {
    const rank = p * (returns.length - 1),
      lo = Math.floor(rank);
    return returns[lo] + (returns[Math.ceil(rank)] - returns[lo]) * (rank - lo);
  };
  const cases = (
    [
      ["10th percentile", 0.1],
      ["Historical median", 0.5],
      ["90th percentile", 0.9],
    ] as const
  ).map(([name, p]) => {
    const target = reference * Math.exp(quantile(p));
    return {
      name,
      target,
      change: (target / reference - 1) * 100,
      percentile: p * 100,
    };
  });
  if (cases.some((c) => !Number.isFinite(c.target) || c.target <= 0))
    return unavailable(
      "Historical outcomes do not produce finite positive prices.",
    );
  return {
    available: true,
    basis: "historical-price-risk",
    cases,
    currency: r.quote.currency,
    reference,
    referenceDate,
    referenceBasis: useQuote ? "quote" : "settled-close",
    horizon,
    samples: returns.length,
    from: bars[0].time,
    through: last.time,
    caveat:
      "Historical 10th / median / 90th percentile price outcomes, not company fair value or forecast probabilities. Overlapping samples are dependent. Future moves can exceed both bounds; dividends, costs and changing business conditions are excluded.",
  };
}

```

## Reference: expectation-engine
Source: lib/expectation-engine.ts
SHA-256: 2076030aac141b5972b62b700569ea894b9b7dca984f5006dd0e2e165481b40e

```typescript
/** Operating-company expectations model v1. Explicit assumptions; no market-data requests.
 * FCFF = after-tax operating profit minus reinvestment needed for assumed growth.
 * A constant operating margin and incremental return on capital are simplifications.
 */
export type EnterpriseInputs = {
  revenue:number; shares:number; cash:number; debt:number; growth:number;
  margin:number; tax:number; returnOnCapital:number; discount:number;
  terminalGrowth:number; years:number;
};
type OperatingYear={year:number;revenue:number;nopat:number;reinvestment:number;fcff:number;cashBuffer:number};
export type EnterpriseResult = {available:true;price:number;enterpriseValue:number;terminalShare:number;rows:OperatingYear[];terminalValue:number} | {available:false;reason:string};
export function enterpriseExpectations(p:EnterpriseInputs):EnterpriseResult {
  if(!Object.values(p).every(Number.isFinite)||p.revenue<=0||p.shares<=0||p.cash<0||p.debt<0||p.growth<=-100||p.growth>100||p.margin<=0||p.margin>80||p.tax<0||p.tax>60||p.returnOnCapital<=0||p.returnOnCapital>100||p.discount<=0||p.discount>50||p.terminalGrowth<0||p.terminalGrowth>=p.discount-1||p.terminalGrowth>=p.returnOnCapital||!Number.isInteger(p.years)||p.years<1||p.years>10)
    return {available:false,reason:'Use positive revenue, shares, operating margin and return on capital. Terminal growth must be below both the required return (by more than one percentage point) and return on capital.'};
  let revenue=p.revenue,pv=0,buffer=p.cash;const rows:OperatingYear[]=[];
  for(let year=1;year<=p.years;year++) {
    revenue*=1+p.growth/100;
    const nopat=revenue*p.margin/100*(1-p.tax/100);
    // No asset-disposal proceeds are credited during contraction.
    const reinvestment=nopat*Math.max(0,p.growth)/p.returnOnCapital;
    const fcff=nopat-reinvestment;buffer+=fcff;
    rows.push({year,revenue,nopat,reinvestment,fcff,cashBuffer:buffer});
    if(buffer < -1e-8)return {available:false,reason:`Funding gap in year ${year}: the assumed growth consumes more cash than the opening reserve and operations provide. Model explicit financing before estimating equity value.`};
    pv+=fcff/(1+p.discount/100)**year;
  }
  const last=rows.at(-1)!;
  const terminalCash=last.nopat*(1+p.terminalGrowth/100)*(1-p.terminalGrowth/p.returnOnCapital);
  const terminalValue=terminalCash/((p.discount-p.terminalGrowth)/100);
  const discountedTerminal=terminalValue/(1+p.discount/100)**p.years;
  const enterpriseValue=pv+discountedTerminal;
  const equity=enterpriseValue+p.cash-p.debt;
  if(!Number.isFinite(equity)||equity<=0)return {available:false,reason:'These assumptions leave no positive residual equity value after net debt.'};
  return {available:true,price:equity/p.shares,enterpriseValue,terminalValue,terminalShare:discountedTerminal/enterpriseValue*100,rows};
}
export function impliedOperatingMargin(p:EnterpriseInputs,price:number):number|null {
  if(!Number.isFinite(price)||price<=0)return null;
  let lo=.1,hi=80;const low=enterpriseExpectations({...p,margin:lo}),high=enterpriseExpectations({...p,margin:hi});
  if(p.growth>p.returnOnCapital||!high.available||(!low.available&&!low.reason.includes("residual equity"))||price<(low.available?low.price:0)||price>high.price)return null;
  for(let i=0;i<65;i++){const mid=(lo+hi)/2,r=enterpriseExpectations({...p,margin:mid});if(!r.available){if(r.reason.includes("residual equity")){lo=mid;continue;}return null;}if(r.price<price)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}

```

## Reference: options-analysis
Source: lib/options-analysis.ts
SHA-256: 4a6858e5fd4edd3a044a81116c64c048f765760d1d3db37f78c6386497cc37c3

```typescript
export type OptionContract = {
  id: string;
  type: "call" | "put";
  strike: number;
  expiry: string;
  observed: string;
  bid: number | null;
  ask: number | null;
  oi: number | null;
  volume: number | null;
  iv: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  multiplier: number;
  standard: boolean;
};
const n = (x: unknown): number | null =>
  x !== null && x !== undefined && x !== "" && Number.isFinite(Number(x))
    ? Number(x)
    : null;
export function normalizeOptions(
  raw: unknown,
  now = Date.now(),
): OptionContract[] {
  const rows = Array.isArray(raw) ? raw : [];
  const out = new Map<string, OptionContract>();
  for (const item of rows) {
    const a = item?.attributes ?? item;
    if (!a) continue;
    const type = String(a.type ?? "").toLowerCase(),
      strike = n(a.strike),
      expiry = String(a.exp_date ?? "").slice(0, 10),
      observed = String(a.tradetime ?? a.date ?? "").slice(0, 10),
      id = String(a.contract ?? item.id ?? "");
    if (
      !["call", "put"].includes(type) ||
      !strike ||
      strike <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(observed) ||
      Date.parse(expiry + "T21:00:00Z") <= now ||
      Date.parse(observed + "T00:00:00Z") > now ||
      !id
    )
      continue;
    const nonnegative = (x: unknown) => {
      const v = n(x);
      return v !== null && v >= 0 ? v : null;
    };
    const bid = nonnegative(a.bid),
      ask = nonnegative(a.ask),
      iv = nonnegative(a.volatility),
      gamma = nonnegative(a.gamma),
      oi = nonnegative(a.open_interest),
      volume = nonnegative(a.volume),
      multiplier = n(a.contract_size ?? a.multiplier) ?? 100;
    // Adjusted contracts require a deliverable-aware model; never silently treat them as 100 shares.
    const standard = /^[A-Z.]+\d{6}[CP]\d{8}$/.test(id) && multiplier === 100;
    const c: OptionContract = {
      id,
      type: type as "call" | "put",
      strike,
      expiry,
      observed,
      bid: bid !== null && ask !== null && bid > ask ? null : bid,
      ask: bid !== null && ask !== null && bid > ask ? null : ask,
      oi,
      volume,
      iv: iv !== null && iv > 0 && iv <= 10 ? iv : null,
      delta: n(a.delta),
      gamma,
      theta: n(a.theta),
      vega: n(a.vega),
      multiplier,
      standard,
    };
    const old = out.get(id);
    if (!old || old.observed < c.observed) out.set(id, c);
  }
  return [...out.values()].sort(
    (a, b) =>
      a.expiry.localeCompare(b.expiry) ||
      a.strike - b.strike ||
      a.type.localeCompare(b.type),
  );
}
export function optionMid(c: OptionContract) {
  return c.bid !== null && c.ask !== null && c.ask > 0
    ? (c.bid + c.ask) / 2
    : null;
}
export function liquidity(c: OptionContract) {
  const mid = optionMid(c);
  const spread =
    mid && c.bid !== null && c.ask !== null ? (c.ask - c.bid) / mid : null;
  return {
    spread,
    eligible:
      c.standard &&
      c.bid !== null &&
      c.bid > 0 &&
      spread !== null &&
      spread <= 0.2 &&
      (c.oi ?? 0) >= 100,
  };
}
export function optionsSummary(
  chain: OptionContract[],
  spot: number,
  expiry: string,
  now = Date.now(),
  complete = false,
) {
  const selected = chain.filter((c) => c.expiry === expiry && c.standard);
  const dates = [...new Set(selected.map((c) => c.observed))].sort();
  const asOf = dates.at(-1) ?? null;
  const rows = selected.filter((c) => c.observed === asOf);
  const strikes = [...new Set(rows.map((c) => c.strike))].sort((a, b) => a - b);
  const nearest = strikes.reduce(
    (best, k) => (Math.abs(k - spot) < Math.abs(best - spot) ? k : best),
    strikes[0] ?? spot,
  );
  const call = rows.find((c) => c.type === "call" && c.strike === nearest),
    put = rows.find((c) => c.type === "put" && c.strike === nearest);
  const cm = call ? optionMid(call) : null,
    pm = put ? optionMid(put) : null;
  const straddle = cm !== null && pm !== null ? cm + pm : null;
  const buckets = strikes.map((strike) => {
    const cs = rows.filter((c) => c.strike === strike);
    let callGex = 0,
      putGex = 0,
      callOi = 0,
      putOi = 0;
    for (const c of cs) {
      if (c.oi !== null) {
        if (c.type === "call") callOi += c.oi;
        else putOi += c.oi;
        if (c.gamma !== null) {
          const g = c.gamma * c.oi * c.multiplier * spot * spot * 0.01;
          if (c.type === "call") callGex += g;
          else putGex += g;
        }
      }
    }
    return { strike, callGex, putGex, net: callGex - putGex, callOi, putOi };
  });
  const validGex = rows.filter((c) => c.gamma !== null && c.oi !== null);
  const allInputs =
    rows.length > 0 &&
    validGex.length === rows.length &&
    selected.length === rows.length;
  const canFlip = complete && allInputs && rows.every((c) => c.iv !== null);
  const T = (Date.parse(expiry + "T21:00:00Z") - now) / (365.25 * 86400000);
  const profile = [] as { spot: number; gex: number }[];
  if (canFlip && T > 0 && spot > 0) {
    for (let i = 0; i <= 80; i++) {
      const s = spot * (0.5 + i / 80);
      let gex = 0;
      for (const c of rows) {
        const vol = c.iv!;
        const d1 =
          (Math.log(s / c.strike) + (0.04 + (vol * vol) / 2) * T) /
          (vol * Math.sqrt(T));
        const gamma =
          Math.exp((-d1 * d1) / 2) /
          (Math.sqrt(2 * Math.PI) * s * vol * Math.sqrt(T));
        gex +=
          (c.type === "call" ? 1 : -1) * gamma * c.oi! * 100 * s * s * 0.01;
      }
      profile.push({ spot: s, gex });
    }
  }
  const flips: number[] = [];
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1],
      b = profile[i];
    if (a.gex * b.gex < 0)
      flips.push(a.spot + ((b.spot - a.spot) * -a.gex) / (b.gex - a.gex));
  }
  const oi = (type: "call" | "put") =>
    rows.filter((c) => c.type === type).reduce((s, c) => s + (c.oi ?? 0), 0);
  const callOi = oi("call"),
    putOi = oi("put");
  return {
    rows,
    asOf,
    buckets,
    callOi,
    putOi,
    putCallOi: callOi ? putOi / callOi : null,
    straddle,
    nearest,
    netGex:
      validGex.length && spot > 0 && Number.isFinite(spot)
        ? buckets.reduce((s, b) => s + b.net, 0)
        : null,
    gammaCoverage: rows.length ? validGex.length / rows.length : 0,
    flips,
    profile,
    complete,
    allInputs,
  };
}
export type PayoffLeg = {
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
};
export function expirationPayoff(
  price: number,
  legs: PayoffLeg[],
  shares = 0,
  stockCost = 0,
) {
  return legs.reduce(
    (sum, l) =>
      sum +
      100 *
        l.quantity *
        ((l.type === "call"
          ? Math.max(0, price - l.strike)
          : Math.max(0, l.strike - price)) -
          l.premium),
    shares * (price - stockCost),
  );
}
export function payoffRisk(legs: PayoffLeg[], shares = 0, stockCost = 0) {
  const strikes = [...new Set([0, ...legs.map((l) => l.strike)])].sort(
    (a, b) => a - b,
  );
  const values = strikes.map((x) =>
    expirationPayoff(x, legs, shares, stockCost),
  );
  const slope =
    shares +
    100 *
      legs.filter((l) => l.type === "call").reduce((s, l) => s + l.quantity, 0);
  const minimum = slope < 0 ? -Infinity : Math.min(...values),
    maximum = slope > 0 ? Infinity : Math.max(...values);
  const breakEven: number[] = [];
  for (let i = 1; i < strikes.length; i++) {
    const a = values[i - 1],
      b = values[i];
    if (a * b < 0)
      breakEven.push(
        strikes[i - 1] + ((strikes[i] - strikes[i - 1]) * -a) / (b - a),
      );
    else if (b === 0) breakEven.push(strikes[i]);
  }
  const last = strikes.at(-1)!,
    v = values.at(-1)!;
  if (slope && last - v / slope > last) breakEven.push(last - v / slope);
  return {
    maxLoss: minimum === -Infinity ? Infinity : Math.max(0, -minimum),
    maxGain: maximum,
    breakEven,
  };
}

```

## Reference: exposure-board
Source: lib/exposure-board.ts
SHA-256: 90c14b608fb7e16e59abb84733afa228793aae90c78ec3514a632548dafe4f39

```typescript
import type { OptionContract } from "./options-analysis";
export type ExposureCell = {
  key: string;
  strike: number;
  expiry: string;
  observed: string | null;
  gex: number | null;
  oi: number | null;
  volume: number | null;
  coverage: number;
  count: number;
};
export type ExposureBoard = {
  spot: number;
  contracts: number;
  universe: string;
  cells: ExposureCell[];
};
export type BoardPreset = {
  name: string;
  metric: "gex" | "oi";
  range: number;
  expirations: number;
  months?: number;
  minimum: number;
  normalized: boolean;
};
export type BoardSnapshot = {
  id: string;
  symbol: string;
  savedAt: string;
  board: ExposureBoard;
};
const nonnegative = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x >= 0;
const day = (x: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString().slice(0, 10) === x;
export function exposureBoard(
  input: OptionContract[],
  spot: number,
): ExposureBoard {
  const rows = [
    ...new Map(
      input
        .filter(
          (c) =>
            c.standard &&
            c.multiplier === 100 &&
            Number.isFinite(c.strike) &&
            c.strike > 0 &&
            day(c.expiry) &&
            day(c.observed.slice(0, 10)) &&
            ["call", "put"].includes(c.type),
        )
        .map((c) => [c.id, c]),
    ).values(),
  ];
  const grouped = new Map<string, OptionContract[]>();
  for (const c of rows) {
    const k = `${c.strike}|${c.expiry}`;
    grouped.set(k, [...(grouped.get(k) ?? []), c]);
  }
  const cells = [...grouped]
    .map(([key, cs]) => {
      const dates = new Set(cs.map((c) => c.observed));
      const usable = cs.filter(
        (c) => nonnegative(c.gamma) && nonnegative(c.oi),
      );
      const coherent = dates.size === 1;
      const gex =
        coherent &&
        usable.length === cs.length &&
        Number.isFinite(spot) &&
        spot > 0
          ? cs.reduce(
              (s, c) =>
                s +
                (c.type === "call" ? 1 : -1) *
                  c.gamma! *
                  c.oi! *
                  100 *
                  spot *
                  spot *
                  0.01,
              0,
            )
          : null;
      return {
        key,
        strike: cs[0].strike,
        expiry: cs[0].expiry,
        observed: coherent ? cs[0].observed : null,
        gex: gex !== null && Number.isFinite(gex) ? gex : null,
        oi:
          coherent && cs.every((c) => nonnegative(c.oi))
            ? cs.reduce((s, c) => s + c.oi!, 0)
            : null,
        volume:
          coherent && cs.every((c) => nonnegative(c.volume))
            ? cs.reduce((s, c) => s + c.volume!, 0)
            : null,
        coverage: coherent ? usable.length / cs.length : 0,
        count: cs.length,
      };
    })
    .sort((a, b) => a.strike - b.strike || a.expiry.localeCompare(b.expiry));
  return {
    spot: Number.isFinite(spot) ? spot : 0,
    contracts: rows.length,
    universe: rows
      .map((c) => `${c.id}:${c.type}:${c.strike}:${c.expiry}`)
      .sort()
      .join("|"),
    cells,
  };
}
/** Constant spot and identical contract universe isolate exposure changes from repricing and pagination. */
export function compareExposure(before: ExposureBoard, after: ExposureBoard) {
  if (before.spot !== after.spot || before.universe !== after.universe)
    return [];
  const old = new Map(before.cells.map((c) => [c.key, c]));
  return after.cells
    .flatMap((c) => {
      const p = old.get(c.key);
      return p &&
        p.gex !== null &&
        c.gex !== null &&
        p.observed &&
        c.observed &&
        p.observed < c.observed
        ? [
            {
              key: c.key,
              strike: c.strike,
              expiry: c.expiry,
              before: p.gex,
              after: c.gex,
              change: c.gex - p.gex,
            },
          ]
        : [];
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}
export function parseBoardState(raw: string | null): {
  presets: BoardPreset[];
  snapshots: BoardSnapshot[];
} {
  try {
    const v = JSON.parse(raw ?? "{}");
    const presets = Array.isArray(v?.presets)
      ? v.presets
          .filter(
            (p: BoardPreset) =>
              p &&
              typeof p.name === "string" &&
              p.name.length <= 60 &&
              ["gex", "oi"].includes(p.metric) &&
              [12, 24, 40, 80].includes(p.range) &&
              [1, 3, 6, 12].includes(p.expirations) &&
              (p.months === undefined || [-1,0,1,2,6].includes(p.months)) &&
              nonnegative(p.minimum) &&
              typeof p.normalized === "boolean",
          )
          .slice(-10)
      : [];
    const snapshots = Array.isArray(v?.snapshots)
      ? v.snapshots
          .filter(
            (s: BoardSnapshot) =>
              s &&
              typeof s.id === "string" &&
              typeof s.symbol === "string" &&
              s.symbol.length <= 25 &&
              typeof s.savedAt === "string" &&
              Number.isFinite(Date.parse(s.savedAt)) &&
              s.board &&
              Number.isFinite(s.board.spot) &&
              s.board.spot > 0 &&
              typeof s.board.universe === "string" &&
              s.board.universe.length <= 2000000 &&
              Number.isInteger(s.board.contracts) &&
              s.board.contracts >= 0 &&
              Array.isArray(s.board.cells) &&
              s.board.cells.length <= 20000 &&
              s.board.cells.every(
                (c: ExposureCell) =>
                  c &&
                  typeof c.key === "string" &&
                  Number.isFinite(c.strike) &&
                  c.strike > 0 &&
                  typeof c.expiry === "string" &&
                  day(c.expiry) &&
                  (c.observed === null ||
                    (typeof c.observed === "string" &&
                      Number.isFinite(Date.parse(c.observed)))) &&
                  (c.gex === null ||
                    (typeof c.gex === "number" && Number.isFinite(c.gex))) &&
                  (c.oi === null || nonnegative(c.oi)) &&
                  (c.volume === null || nonnegative(c.volume)) &&
                  Number.isFinite(c.coverage) &&
                  c.coverage >= 0 &&
                  c.coverage <= 1 &&
                  Number.isInteger(c.count) &&
                  c.count > 0,
              ),
          )
          .slice(-12)
      : [];
    return { presets, snapshots };
  } catch {
    return { presets: [], snapshots: [] };
  }
}

/** Pick the latest genuinely comparable source observation, never an arbitrary first save. */
export function latestExposureChanges(
  snapshots: BoardSnapshot[],
  symbol: string,
  board: ExposureBoard,
) {
  for (const snapshot of [...snapshots].reverse()) {
    if (snapshot.symbol !== symbol) continue;
    const changes = compareExposure(snapshot.board, board);
    if (changes.length) return { baseline: snapshot, changes };
  }
  return { baseline: null, changes: [] };
}
export function latestSymbolSnapshots(snapshots: BoardSnapshot[]) {
  const latest = new Map<string, BoardSnapshot>();
  for (const snapshot of snapshots) {
    const old = latest.get(snapshot.symbol);
    if (!old || old.savedAt < snapshot.savedAt)
      latest.set(snapshot.symbol, snapshot);
  }
  return [...latest.values()]
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .slice(0, 6);
}

```

## Reference: exposure-window
Source: lib/exposure-window.ts
SHA-256: b59f4cde5bce0bf0ce292437099b4a59fca4c57d0b11448b1379fd92c6805f94

```typescript
/** -1 = selected expiry, 0 = all loaded dates; positive values are calendar months from today. */
export function exposureDates(dates:string[],months:number,expiry?:string,now=Date.now()) {
 const start=new Date(now);const today=start.toISOString().slice(0,10);
 if(months===-1)return expiry?[expiry]:[...new Set(dates)].sort().slice(0,1);
 const end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+months+1,0));
 end.setUTCDate(Math.min(start.getUTCDate(),end.getUTCDate()));
 const until=end.toISOString().slice(0,10);
 return [...new Set(dates)].sort().filter(date=>date>=today&&(months===0||date<=until));
}

```

## Reference: options-vanna
Source: lib/options-vanna.ts
SHA-256: 5136f008e11b71e76e1a8d637de42f05d4e7ab74d5fbdf1a8f58a8ffbaf6a43e

```typescript
import type { OptionContract } from "./options-analysis";

export type VannaAssumptions = { riskFree?: number; dividendYield?: number };
type VannaInput = VannaAssumptions & {
  spot: number;
  strike: number;
  iv: number;
  years: number;
};
const positive = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;
const yearMs = 365.25 * 86400000;

/** Spot-delta sensitivity per absolute unit of decimal IV, shared by calls and puts.
 * European Black–Scholes with continuous dividend yield: -exp(-qT) φ(d1)d2/σ.
 * Formula reference: OpenGamma Strata BlackScholesFormulaRepository.vanna;
 * https://strata.opengamma.io/apidocs/com/opengamma/strata/pricer/impl/option/BlackScholesFormulaRepository.html
 */
export function blackScholesVanna({
  spot,
  strike,
  iv,
  years,
  riskFree = 0.04,
  dividendYield = 0,
}: VannaInput): number | null {
  if (
    ![spot, strike, iv, years].every(positive) ||
    !Number.isFinite(riskFree) ||
    !Number.isFinite(dividendYield)
  )
    return null;
  const rootT = Math.sqrt(years);
  const d1 =
    (Math.log(spot / strike) +
      (riskFree - dividendYield + (iv * iv) / 2) * years) /
    (iv * rootT);
  const d2 = d1 - iv * rootT;
  const value =
    (((-Math.exp(-dividendYield * years) * Math.exp((-d1 * d1) / 2)) /
      Math.sqrt(2 * Math.PI)) *
      d2) /
    iv;
  return Number.isFinite(value) ? value : null;
}
function dateOnly(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
    ? time
    : null;
}
function asOfTime(value: string): number | null {
  if (dateOnly(value.slice(0, 10)) === null) return null;
  // Date-only values explicitly mean 00:00 UTC; timestamps must include a timezone.
  if (
    value.length !== 10 &&
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  )
    return null;
  const time = Date.parse(value.length === 10 ? value + "T00:00:00Z" : value);
  return Number.isFinite(time) ? time : null;
}
export type VannaCell = {
  strike: number;
  expiry: string;
  call: number | null;
  put: number | null;
  net: number | null;
  observedDates: string[];
  modeled: number;
  total: number;
  reason: string | null;
};
/** Signed convention only: calls +, puts −; this is not observed dealer positioning.
 * Expiration uses 21:00 UTC as a modeling approximation, not official settlement.
 * An incomplete/mixed-date cell has no net; unobserved contracts are never implied.
 */
export function modelVannaMap(
  contracts: OptionContract[],
  spot: number,
  asOf: string,
  options: VannaAssumptions = {},
) {
  const assumptions = {
    riskFree: options.riskFree ?? 0.04,
    dividendYield: options.dividendYield ?? 0,
  };
  const eligible = contracts.filter((c) => c.standard && c.multiplier === 100);
  const time = asOfTime(asOf);
  const groups = new Map<string, OptionContract[]>();
  for (const c of eligible) {
    const key = `${c.expiry}|${c.strike}`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const cells: VannaCell[] = [...groups.values()]
    .map((rows) => {
      const { strike, expiry } = rows[0];
      const observedDates = [...new Set(rows.map((c) => c.observed))].sort();
      const mixed = observedDates.length !== 1;
      const expiryDate = dateOnly(expiry);
      const years =
        time !== null && expiryDate !== null
          ? (expiryDate + 21 * 3600000 - time) / yearMs
          : 0;
      const values = rows.map((c) => {
        const observation = dateOnly(c.observed);
        if (
          mixed ||
          time === null ||
          observation === null ||
          observation > time ||
          c.oi === null ||
          !Number.isFinite(c.oi) ||
          c.oi < 0 ||
          c.iv === null
        )
          return null;
        const vanna = blackScholesVanna({
          spot,
          strike: c.strike,
          iv: c.iv,
          years,
          ...assumptions,
        });
        if (vanna === null) return null;
        const value =
          (c.type === "call" ? 1 : -1) * vanna * c.oi * 100 * spot * 0.01;
        return Number.isFinite(value) ? (value === 0 ? 0 : value) : null;
      });
      const side = (type: "call" | "put") => {
        const indices = rows.flatMap((c, i) => (c.type === type ? [i] : []));
        return !indices.length || indices.some((i) => values[i] === null)
          ? null
          : indices.reduce((sum, i) => sum + values[i]!, 0);
      };
      const modeled = values.filter((v) => v !== null).length;
      const net =
        modeled === rows.length
          ? values.reduce<number>((sum, v) => sum + v!, 0)
          : null;
      return {
        strike,
        expiry,
        call: side("call"),
        put: side("put"),
        net,
        observedDates,
        modeled,
        total: rows.length,
        reason: mixed
          ? "Mixed source dates"
          : modeled !== rows.length
            ? "Missing or invalid IV, OI, spot, date or time to expiry"
            : null,
      };
    })
    .sort((a, b) => a.strike - b.strike || a.expiry.localeCompare(b.expiry));
  const modeled = cells.reduce((sum, c) => sum + c.modeled, 0);
  return {
    cells,
    assumptions,
    asOf,
    eligible: eligible.length,
    excluded: contracts.length - eligible.length,
    modeled,
    coverage: eligible.length ? modeled / eligible.length : 0,
    observedDates: [...new Set(eligible.map((c) => c.observed))].sort(),
    expiries: [...new Set(cells.map((c) => c.expiry))].sort(),
    strikes: [...new Set(cells.map((c) => c.strike))].sort((a, b) => a - b),
  };
}

```

## Reference: options-flow
Source: lib/options-flow.ts
SHA-256: 65f2d86f177ea9baa578b400316e0e7c83c9abe03dd99fc6cad167d44eededda

```typescript
import type { OptionContract } from "./options-analysis";
export type FlowTrade = {
  id: string;
  contract: string;
  type: "call" | "put";
  strike: number;
  expiry: string;
  time: string;
  price: number;
  size: number;
  premium: number;
  exchange: string;
  condition: string;
};
export type FlowReply = {
  status: "available" | "unavailable";
  message?: string;
  trades: FlowTrade[];
  contracts: string[];
  fetchedAt?: string;
  start?: string;
  partial: boolean;
  chainComplete?: boolean;
  source: string;
};
function contractParts(id: string) {
  const m = /^([A-Z.]{1,10})(\d{6})([CP])(\d{8})$/.exec(id);
  if (!m) return null;
  const expiry = `20${m[2].slice(0, 2)}-${m[2].slice(2, 4)}-${m[2].slice(4, 6)}`;
  if (
    !Number.isFinite(Date.parse(expiry)) ||
    new Date(expiry).toISOString().slice(0, 10) !== expiry
  )
    return null;
  const strike = Number(m[4]) / 1000;
  if (strike <= 0) return null;
  return {
    underlying: m[1],
    expiry,
    strike,
    type: m[3] === "C" ? "call" : "put",
  };
}
export function selectFlowContracts(
  rows: OptionContract[],
  symbol: string,
  expiry: string | null = null,
): OptionContract[] {
  const unique = new Map<string, OptionContract>();
  for (const c of rows) {
    const p = contractParts(c.id);
    if (
      !p ||
      p.underlying !== symbol ||
      !c.standard ||
      c.multiplier !== 100 ||
      p.strike !== c.strike ||
      p.expiry !== c.expiry ||
      p.type !== c.type ||
      (expiry && p.expiry !== expiry)
    )
      continue;
    unique.set(c.id, c);
  }
  return [...unique.values()]
    .sort(
      (a, b) =>
        (b.oi ?? -1) - (a.oi ?? -1) ||
        a.expiry.localeCompare(b.expiry) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 30);
}
export function normalizeFlowTrades(
  raw: unknown,
  contracts: OptionContract[],
  now = Date.now(),
): FlowTrade[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("The options trade source returned an unsupported response.");
  const scope = new Map(contracts.map((c) => [c.id, c]));
  const result = new Map<string, FlowTrade>();
  let inspected = 0;
  for (const [symbol, entries] of Object.entries(raw)) {
    if (!Array.isArray(entries))
      throw Error("The options trade source returned an unsupported response.");
    const c = scope.get(symbol);
    if (!c) continue;
    for (const item of entries) {
      if (++inspected > 500) break;
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>,
        price = r.p,
        size = r.s,
        time = r.t;
      if (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price <= 0 ||
        typeof size !== "number" ||
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        typeof time !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          time,
        ) ||
        !Number.isFinite(Date.parse(time)) ||
        Date.parse(time) > now ||
        new Date(time.slice(0, 10)).toISOString().slice(0, 10) !==
          time.slice(0, 10)
      )
        continue;
      const premium = price * size * 100;
      if (!Number.isFinite(premium)) continue;
      const exchange =
        typeof r.x === "string" ? r.x.slice(0, 20) : "Unavailable";
      const condition =
        typeof r.c === "string"
          ? r.c.slice(0, 100)
          : Array.isArray(r.c)
            ? r.c
                .filter((v): v is string => typeof v === "string")
                .slice(0, 20)
                .map((v) => v.slice(0, 30))
                .join(", ")
            : "Unavailable";
      const providerId =
        typeof r.i === "string" || typeof r.i === "number"
          ? String(r.i).slice(0, 100)
          : "";
      const id = `${symbol}:${providerId || [time, price, size, exchange, condition].join(":")}`;
      result.set(id, {
        id,
        contract: symbol,
        type: c.type,
        strike: c.strike,
        expiry: c.expiry,
        time,
        price,
        size,
        premium,
        exchange,
        condition: condition || "None reported",
      });
    }
  }
  return [...result.values()].sort(
    (a, b) =>
      Date.parse(b.time) - Date.parse(a.time) || a.id.localeCompare(b.id),
  );
}
export function rankFlowPremium(trades: FlowTrade[]) {
  const result = new Map<
    string,
    { contract: string; premium: number; prints: number; size: number }
  >();
  for (const t of trades) {
    const r = result.get(t.contract) ?? {
      contract: t.contract,
      premium: 0,
      prints: 0,
      size: 0,
    };
    r.premium += t.premium;
    r.prints++;
    r.size += t.size;
    result.set(t.contract, r);
  }
  return [...result.values()].sort(
    (a, b) => b.premium - a.premium || a.contract.localeCompare(b.contract),
  );
}

```

## Reference: options-liquidity
Source: lib/options-liquidity.ts
SHA-256: 7e0a525b31356aee235aa61dc129c404a28eaba7807713525dd17390e0aea1c3

```typescript
import type { OptionContract } from './options-analysis';
/** Descriptive quote coverage; never infers executable liquidity or trade direction. */
export function optionsLiquidity(contracts:OptionContract[],expiry:string) {
 const unique=new Map<string,OptionContract>();
 for(const c of contracts) if(c.expiry===expiry && Number.isFinite(Date.parse(c.observed))){const previous=unique.get(c.id);if(!previous || Date.parse(c.observed)>Date.parse(previous.observed))unique.set(c.id,c);}
 const rows=[...unique.values()];
 const spreads=rows.flatMap(c=>c.bid!==null&&c.ask!==null&&Number.isFinite(c.bid)&&Number.isFinite(c.ask)&&c.bid>0&&c.ask>=c.bid?[(c.ask-c.bid)/((c.ask+c.bid)/2)*100]:[]).sort((a,b)=>a-b);
 const middle=Math.floor(spreads.length/2);
 return {contracts:rows.length,twoSided:spreads.length,medianSpread:spreads.length?(spreads.length%2?spreads[middle]:(spreads[middle-1]+spreads[middle])/2):null,oldest:rows.length?rows.map(c=>c.observed).sort((a,b)=>Date.parse(a)-Date.parse(b))[0]:null,newest:rows.length?rows.map(c=>c.observed).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]:null};
}

```

## Reference: options-simulation
Source: lib/options-simulation.ts
SHA-256: c3631a924d43fa68f515f2620bdc15391cc50aa72cf4f952bc6764181d5aa540

```typescript
import type { OptionContract } from "./options-analysis";
export type SimulationExit = {
  quantity: number;
  premium: number;
  observed: string;
  at: string;
};
export type SimulationPosition = {
  id: string;
  symbol: string;
  contract: OptionContract;
  quantity: number;
  remaining: number;
  entryPremium: number;
  openedAt: string;
  notes: string;
  exits: SimulationExit[];
};
export type SimulationLedger = {
  version: 1;
  initialCash: 100000;
  cash: number;
  positions: SimulationPosition[];
};
const DAY = 86400000;
const MAX_BYTES = 19000;
const serializedSize = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value)).length;
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const money = (v: number) => Math.round(v * 1e8) / 1e8;
function dateTime(v: unknown): number | null {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(v)
  )
    return null;
  const t = Date.parse(v.length === 10 ? v + "T00:00:00Z" : v);
  return Number.isFinite(t) &&
    new Date(t).toISOString().slice(0, 10) === v.slice(0, 10)
    ? t
    : null;
}
function validContract(c: OptionContract): boolean {
  const occ =
    c && typeof c.id === "string"
      ? c.id.match(/^([A-Z.]+)(\d{6})([CP])(\d{8})$/)
      : null;
  if (
    !occ ||
    occ[2] !== c.expiry?.replaceAll("-", "").slice(2) ||
    occ[3] !== (c.type === "call" ? "C" : "P") ||
    Number(occ[4]) / 1000 !== c.strike
  )
    return false;
  return (
    !!c &&
    typeof c.id === "string" &&
    /^[A-Z.]+\d{6}[CP]\d{8}$/.test(c.id) &&
    ["call", "put"].includes(c.type) &&
    finite(c.strike) &&
    c.strike > 0 &&
    c.standard === true &&
    c.multiplier === 100 &&
    dateTime(c.expiry) !== null &&
    c.expiry.length === 10 &&
    dateTime(c.observed) !== null &&
    [
      c.bid,
      c.ask,
      c.oi,
      c.volume,
      c.iv,
      c.delta,
      c.gamma,
      c.theta,
      c.vega,
    ].every((v) => v === null || finite(v))
  );
}
export function simulationQuoteIssue(
  c: OptionContract,
  now = Date.now(),
): string | null {
  if (!validContract(c))
    return "Only standard 100-share calls and puts with valid source dates are supported.";
  const t = dateTime(c.observed)!;
  if (t > now) return "The quote is dated in the future.";
  if (Math.floor(now / DAY) - Math.floor(t / DAY) > 3)
    return "The quote is older than three calendar days.";
  if (Date.parse(c.expiry + "T21:00:00Z") <= now)
    return "Expired positions need a verified closing price dated at expiry. Settlement is pending.";
  if (
    c.bid === null ||
    c.ask === null ||
    c.bid < 0 ||
    c.ask <= 0 ||
    c.bid > c.ask
  )
    return "A valid bid and ask are required.";
  return null;
}
export function newSimulationLedger(): SimulationLedger {
  return { version: 1, initialCash: 100000, cash: 100000, positions: [] };
}
function quantity(q: number) {
  if (!Number.isInteger(q) || q < 1 || q > 100)
    throw Error("Choose a whole number of contracts from 1 to 100.");
}
function bounded(x: SimulationLedger): SimulationLedger {
  if (
    x.positions.length > 15 ||
    x.positions.reduce((n, p) => n + p.exits.length, 0) > 45 ||
    serializedSize(x) >= MAX_BYTES
  )
    throw Error(
      "This simulation reached its 15-position, 45-exit, or 19 KB save limit. The last action was not applied.",
    );
  return x;
}
function sameContract(a: OptionContract, b: OptionContract) {
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.strike === b.strike &&
    a.expiry === b.expiry &&
    a.multiplier === b.multiplier &&
    a.standard === b.standard
  );
}
function snapshot(c: OptionContract): OptionContract {
  return {
    id: c.id,
    type: c.type,
    strike: c.strike,
    expiry: c.expiry,
    observed: c.observed,
    bid: c.bid,
    ask: c.ask,
    oi: c.oi,
    volume: c.volume,
    iv: c.iv,
    delta: c.delta,
    gamma: c.gamma,
    theta: c.theta,
    vega: c.vega,
    multiplier: c.multiplier,
    standard: c.standard,
  };
}
export function openSimulation(
  ledger: SimulationLedger,
  input: {
    contract: OptionContract;
    symbol: string;
    quantity: number;
    notes: string;
  },
  now = Date.now(),
): SimulationLedger {
  quantity(input.quantity);
  const issue = simulationQuoteIssue(input.contract, now);
  if (issue) throw Error(issue);
  if (
    !/^[A-Z][A-Z0-9.-]{0,14}$/.test(input.symbol) ||
    typeof input.notes !== "string" ||
    input.notes.length > 500
  )
    throw Error("Use a valid symbol and notes of at most 500 characters.");
  const cost = money(input.contract.ask! * 100 * input.quantity);
  if (cost > ledger.cash)
    throw Error(
      "Insufficient simulated cash. These positions must be fully paid.",
    );
  const at = new Date(now).toISOString();
  const id = at + "-" + ledger.positions.length;
  return bounded({
    ...ledger,
    cash: money(ledger.cash - cost),
    positions: [
      ...ledger.positions,
      {
        id,
        symbol: input.symbol,
        contract: snapshot(input.contract),
        quantity: input.quantity,
        remaining: input.quantity,
        entryPremium: input.contract.ask!,
        openedAt: at,
        notes: input.notes,
        exits: [],
      },
    ],
  });
}
export function closeSimulation(
  ledger: SimulationLedger,
  id: string,
  q: number,
  quote: OptionContract,
  now = Date.now(),
): SimulationLedger {
  quantity(q);
  const p = ledger.positions.find((p) => p.id === id);
  if (!p || q > p.remaining)
    throw Error("Close quantity exceeds the open position.");
  if (!sameContract(p.contract, quote))
    throw Error("A current quote for this exact contract is required.");
  const issue = simulationQuoteIssue(quote, now);
  if (issue) throw Error(issue);
  if (dateTime(quote.observed)! < dateTime(p.contract.observed)!)
    throw Error("The close quote predates entry.");
  return bounded({
    ...ledger,
    cash: money(ledger.cash + q * 100 * quote.bid!),
    positions: ledger.positions.map((row) =>
      row.id === id
        ? {
            ...row,
            remaining: row.remaining - q,
            exits: [
              ...row.exits,
              {
                quantity: q,
                premium: quote.bid!,
                observed: quote.observed,
                at: new Date(now).toISOString(),
              },
            ],
          }
        : row,
    ),
  });
}
export function simulationSummary(
  ledger: SimulationLedger,
  quotes: OptionContract[],
  now = Date.now(),
) {
  let realized = 0,
    marked = 0,
    marketValue = 0,
    unpriced = 0,
    wins = 0,
    closedPositions = 0;
  for (const p of ledger.positions) {
    const pnl = p.exits.reduce(
      (n, e) => n + (e.premium - p.entryPremium) * 100 * e.quantity,
      0,
    );
    realized += pnl;
    if (p.remaining === 0) {
      closedPositions++;
      if (pnl > 0) wins++;
      continue;
    }
    const q = quotes
      .filter(
        (q) =>
          sameContract(q, p.contract) &&
          !simulationQuoteIssue(q, now) &&
          dateTime(q.observed)! >= dateTime(p.contract.observed)!,
      )
      .sort((a, b) => dateTime(b.observed)! - dateTime(a.observed)!)[0];
    if (!q) {
      unpriced++;
      continue;
    }
    marketValue += q.bid! * 100 * p.remaining;
    marked += (q.bid! - p.entryPremium) * 100 * p.remaining;
  }
  return {
    realized: money(realized),
    marked: unpriced ? null : money(marked),
    marketValue: unpriced ? null : money(marketValue),
    equity: unpriced ? null : money(ledger.cash + marketValue),
    unpriced,
    closedPositions,
    winRate: closedPositions ? wins / closedPositions : null,
  };
}
/** Untrusted stored data is replayed; no client-supplied balance is trusted. */
export function cleanSimulationLedger(raw: unknown): SimulationLedger | null {
  try {
    if (!raw || typeof raw !== "object" || serializedSize(raw) >= MAX_BYTES)
      return null;
    const x = raw as SimulationLedger;
    if (
      x.version !== 1 ||
      x.initialCash !== 100000 ||
      !finite(x.cash) ||
      !Array.isArray(x.positions) ||
      x.positions.length > 15
    )
      return null;
    const ids = new Set<string>();
    let cash = 100000;
    const positions: SimulationPosition[] = [];
    for (const p of x.positions) {
      if (
        !p ||
        typeof p.id !== "string" ||
        p.id.length > 80 ||
        ids.has(p.id) ||
        !validContract(p.contract) ||
        simulationQuoteIssue(p.contract, dateTime(p.openedAt) ?? NaN) ||
        typeof p.symbol !== "string" ||
        !/^[A-Z][A-Z0-9.-]{0,14}$/.test(p.symbol) ||
        typeof p.notes !== "string" ||
        p.notes.length > 500 ||
        dateTime(p.openedAt) === null ||
        dateTime(p.openedAt)! > Date.now() ||
        !Array.isArray(p.exits) ||
        p.entryPremium !== p.contract.ask
      )
        return null;
      ids.add(p.id);
      quantity(p.quantity);
      let remaining = p.quantity;
      cash -= p.quantity * 100 * p.entryPremium;
      let last = dateTime(p.openedAt)!;
      for (const e of p.exits) {
        quantity(e.quantity);
        if (
          !finite(e.premium) ||
          e.premium < 0 ||
          dateTime(e.observed) === null ||
          dateTime(e.at) === null ||
          dateTime(e.at)! > Date.now() ||
          dateTime(e.at)! < last ||
          dateTime(e.observed)! > dateTime(e.at)! ||
          dateTime(e.observed)! < dateTime(p.contract.observed)! ||
          Math.floor(dateTime(e.at)! / DAY) -
            Math.floor(dateTime(e.observed)! / DAY) >
            3 ||
          dateTime(e.at)! >= Date.parse(p.contract.expiry + "T21:00:00Z")
        )
          return null;
        remaining -= e.quantity;
        cash += e.quantity * 100 * e.premium;
        last = dateTime(e.at)!;
        if (remaining < 0) return null;
      }
      if (remaining !== p.remaining) return null;
      positions.push({
        id: p.id,
        symbol: p.symbol,
        contract: snapshot(p.contract),
        quantity: p.quantity,
        remaining,
        entryPremium: p.entryPremium,
        openedAt: p.openedAt,
        notes: p.notes,
        exits: p.exits.map((e) => ({
          quantity: e.quantity,
          premium: e.premium,
          observed: e.observed,
          at: e.at,
        })),
      });
    }
    if (money(cash) !== x.cash || cash < 0) return null;
    return bounded({
      version: 1,
      initialCash: 100000,
      cash: x.cash,
      positions,
    });
  } catch {
    return null;
  }
}

```

## Reference: options-expiry-comparison
Source: lib/options-expiry-comparison.ts
SHA-256: b99ef41b8f71ad6d274e4b3acd3188fbea4dfe01a4435bc842bedbe71a2eb04a

```typescript
import type { OptionContract } from './options-analysis';
const validDay=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
const count=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
/** Returned contracts only. Missing volume is not zero; mixed observations remain visible. */
export function expiryComparison(input:OptionContract[]) {
 const latest=new Map<string,OptionContract>();
 for(const c of input){if(!c.standard||c.multiplier!==100||!validDay(c.expiry)||!Number.isFinite(Date.parse(c.observed)))continue;const old=latest.get(c.id);if(!old||Date.parse(c.observed)>=Date.parse(old.observed))latest.set(c.id,c);}
 const groups=new Map<string,OptionContract[]>();
 for(const c of latest.values())groups.set(c.expiry,[...(groups.get(c.expiry)??[]),c]);
 return [...groups].sort(([a],[b])=>a.localeCompare(b)).map(([expiry,rows])=>{
  const sum=(list:OptionContract[],key:'oi'|'volume')=>list.length&&list.every(c=>count(c[key]))?list.reduce((s,c)=>s+c[key]!,0):null;
  const observed=rows.map(c=>c.observed).sort();
  return {expiry,contracts:rows.length,callVolume:sum(rows.filter(c=>c.type==='call'),'volume'),putVolume:sum(rows.filter(c=>c.type==='put'),'volume'),oi:sum(rows,'oi'),volumeCoverage:rows.filter(c=>count(c.volume)).length,oldest:observed[0],newest:observed.at(-1)!};
 });
}

```

## Reference: transaction-ledger
Source: lib/transaction-ledger.ts
SHA-256: 6bc0191da93e7958facdfaf431c833ef0f1ee40b463bfcd33102daada55fb3c3

```typescript
export type TransactionType='deposit'|'withdrawal'|'buy'|'sell'|'dividend'|'fee'|'split';
export type Transaction={id:string;account:string;date:string;type:TransactionType;symbol:string;quantity:number;price:number;amount:number;fee:number;currency:'USD'};
const types:TransactionType[]=['deposit','withdrawal','buy','sell','dividend','fee','split'];
const day=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export function cleanTransactions(value:unknown):Transaction[]{
 if(!Array.isArray(value)||value.length>5000)throw Error('A ledger can contain up to 5,000 transactions.');
 const ids=new Set<string>();
 return value.map((raw)=>{
  if(!raw||typeof raw!=='object')throw Error('Invalid transaction.');
  const r=raw as Record<string,unknown>,str=(k:string)=>typeof r[k]==='string'?(r[k] as string).trim():'';
  const id=str('id'),account=str('account'),date=str('date'),type=str('type') as TransactionType,symbol=str('symbol').toUpperCase();
  if(!/^[A-Za-z0-9_.:-]{1,100}$/.test(id)||ids.has(id))throw Error('Transaction IDs must be unique and contain letters, numbers, dots, colons, underscores or hyphens.');ids.add(id);
  if(!account||account.length>80||!day(date)||date>new Date().toISOString().slice(0,10))throw Error('Check the account and transaction date.');
  if(!types.includes(type)||str('currency')!=='USD')throw Error('Use a supported transaction type and USD currency.');
  const number=(k:string)=>{const v=r[k];if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e12)throw Error(`Invalid ${k}.`);return v;};
  const quantity=number('quantity'),price=number('price'),amount=number('amount'),fee=number('fee');
  if(['buy','sell','split','dividend'].includes(type)&&!/^[A-Z0-9][A-Z0-9./-]{0,19}$/.test(symbol))throw Error('Enter the transaction symbol.');
  if(['buy','sell'].includes(type)&&(!(quantity>0)||!(price>0)))throw Error('Trades need positive quantity and price.');
  if(['buy','sell'].includes(type)&&amount!==0)throw Error('Trades use quantity and price; leave amount empty.');
  if(['deposit','withdrawal','fee','dividend'].includes(type)&&(quantity!==0||price!==0))throw Error('Cash entries use amount; leave quantity and price empty.');
  if(type==='split'&&(!(quantity>0)||fee!==0||amount!==0||price!==0))throw Error('Splits use a positive new/old share ratio and no price, cash or fee.');
  if(['deposit','withdrawal','fee','dividend'].includes(type)&&amount<=0)throw Error('Cash entries need a positive amount.');
  if(['deposit','withdrawal','fee'].includes(type)&&symbol)throw Error('Cash-only entries do not use a symbol.');
  return {id,account,date,type,symbol,quantity,price,amount,fee,currency:'USD'};
 });
}
/** Average-cost research ledger; not a tax-lot calculation. Input order breaks same-day ties. */
export function reconcileTransactions(rows:Transaction[]){
 const accounts=new Map<string,number>(),positions=new Map<string,{account:string;symbol:string;quantity:number;basis:number}>(),errors:string[]=[];
 let realized=0,income=0,fees=0,external=0;
 for(const r of [...rows].sort((a,b)=>a.date.localeCompare(b.date))){
  let cash=accounts.get(r.account)??0;const key=r.account+'|'+r.symbol,p=positions.get(key)??{account:r.account,symbol:r.symbol,quantity:0,basis:0};
  if(r.type==='deposit'){cash+=r.amount;external+=r.amount;}
  if(r.type==='withdrawal'){cash-=r.amount;external-=r.amount;}
  if(r.type==='buy'){cash-=r.quantity*r.price+r.fee;p.quantity+=r.quantity;p.basis+=r.quantity*r.price+r.fee;positions.set(key,p);}
  if(r.type==='sell'){
   if(r.quantity>p.quantity+1e-9){errors.push(`${r.id}: ${r.account} sells more ${r.symbol} than recorded. Add opening purchases or correct the transaction.`);continue;}
   const basis=p.quantity>0?p.basis*r.quantity/p.quantity:0;realized+=r.quantity*r.price-r.fee-basis;cash+=r.quantity*r.price-r.fee;p.quantity-=r.quantity;p.basis-=basis;if(p.quantity<1e-9){p.quantity=0;p.basis=0;}positions.set(key,p);
  }
  if(r.type==='split'){if(p.quantity<=0){errors.push(`${r.id}: split has no recorded ${r.symbol} shares.`);continue;}p.quantity*=r.quantity;positions.set(key,p);}
  if(r.type==='dividend'){cash+=r.amount-r.fee;income+=r.amount;}
  if(r.type==='fee'){cash-=r.amount;fees+=r.amount;}
  if(['deposit','withdrawal','fee'].includes(r.type))cash-=r.fee;
  fees+=r.fee;accounts.set(r.account,cash);
  if(cash<-.005)errors.push(`${r.id}: ${r.account} has negative recorded cash. Check missing deposits or margin borrowing.`);
 }
 return {accounts:[...accounts].map(([account,cash])=>({account,cash})),positions:[...positions.values()].filter(p=>p.quantity>0),realized,income,fees,external,errors};
}
function csv(text:string){const rows:string[][]=[];let row:string[]=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field='';}else field+=c;}if(quoted)throw Error('Unclosed CSV quote.');row.push(field);if(row.some(x=>x.trim()))rows.push(row);return rows;}
export function parseTransactionCsv(text:string){
 if(text.length>2000000)throw Error('CSV must be under 2 MB.');const table=csv(text.replace(/^\uFEFF/,'')),header=table.shift()?.map(s=>s.trim().toLowerCase())??[];
 const required=['id','account','date','type','symbol','quantity','price','amount','fee','currency'];
 if(required.some(k=>!header.includes(k))||new Set(header).size!==header.length)throw Error('Use the transaction template headers.');
 if(table.length>5000)throw Error('Import up to 5,000 transactions at a time.');
 const rows:Transaction[]=[],errors:string[]=[],ids=new Set<string>();
 table.forEach((cells,i)=>{try{if(cells.length!==header.length)throw Error('Column count does not match the header.');const raw:Record<string,unknown>=Object.fromEntries(header.map((k,j)=>[k,cells[j].trim()]));for(const k of ['quantity','price','amount','fee'])raw[k]=raw[k]===''?0:Number(raw[k]);const r=cleanTransactions([raw])[0];if(ids.has(r.id))throw Error('Duplicate transaction ID.');ids.add(r.id);rows.push(r);}catch(e){errors.push(`Row ${i+2}: ${(e as Error).message}`);}});
 return {rows,errors};
}
/** Each flow occurs at period end and is included in the supplied ending value. */
export function timeWeightedReturn(periods:{start:number;end:number;flow:number}[]){if(!periods.length)return null;let growth=1;for(const p of periods){if(![p.start,p.end,p.flow].every(Number.isFinite)||p.start<=0||p.end-p.flow<0)return null;growth*=(p.end-p.flow)/p.start;}return Math.round((growth-1)*1e10)/1e8;}
/** Annualized XIRR. Return null when cash flows lack one sign change or no unique bracket. */
export function moneyWeightedReturn(flows:{date:string;amount:number}[]){
 if(flows.length<2||flows.some(f=>!day(f.date)||!Number.isFinite(f.amount)))return null;
 const grouped=new Map<string,number>();for(const f of flows)grouped.set(f.date,(grouped.get(f.date)??0)+f.amount);
 const rows=[...grouped].sort(([a],[b])=>a.localeCompare(b)).filter(([,v])=>v!==0);if(rows.length<2)return null;
 let changes=0;for(let i=1;i<rows.length;i++)if(Math.sign(rows[i][1])!==Math.sign(rows[i-1][1]))changes++;if(changes!==1)return null;
 const start=Date.parse(rows[0][0]);const npv=(r:number)=>rows.reduce((s,[d,v])=>s+v/Math.pow(1+r,(Date.parse(d)-start)/31536000000),0);
 let lo=-.9999,hi=1000,a=npv(lo),b=npv(hi);if(!Number.isFinite(a)||!Number.isFinite(b)||a*b>0)return null;
 for(let i=0;i<160;i++){const mid=(lo+hi)/2,n=npv(mid);if(Math.abs(n)<1e-8)return mid*100;if(a*n>0){lo=mid;a=n;}else hi=mid;}return (lo+hi)/2*100;
}

export function mergeTransactionImport(current:Transaction[],incoming:Transaction[],mode:'append'|'replace'){
 const valid=cleanTransactions(incoming);if(mode==='replace')return {rows:valid,skipped:0};
 const ids=new Map(cleanTransactions(current).map(r=>[r.id,r]));let skipped=0;
 for(const r of valid){const old=ids.get(r.id);if(old){if(JSON.stringify(old)!==JSON.stringify(r))throw Error(`Transaction ${r.id} differs from the saved entry. Export and correct the ledger, then choose Replace entire ledger.`);skipped++;}else ids.set(r.id,r);}
 return {rows:cleanTransactions([...ids.values()]),skipped};
}
export function holdingDifferences(ledger:{symbol:string;quantity:number}[],holdings:{symbol:string;quantity:number;assetType:string}[]){
 const totals=(rows:{symbol:string;quantity:number}[])=>{const out=new Map<string,number>();for(const r of rows)out.set(r.symbol,(out.get(r.symbol)??0)+r.quantity);return out;};
 const a=totals(ledger),b=totals(holdings.filter(p=>p.assetType!=='cash'));
 return [...new Set([...a.keys(),...b.keys()])].filter(symbol=>Math.abs((a.get(symbol)??0)-(b.get(symbol)??0))>1e-6).map(symbol=>`${symbol}: ledger ${(a.get(symbol)??0).toLocaleString()} units; holdings ${(b.get(symbol)??0).toLocaleString()}`);
}

```

## Reference: planning
Source: lib/planning.ts
SHA-256: f97ed77761eba66cdd9c1a4a55d910133fb63430d9e5612ea0874c326c6b96f9

```typescript
import type { Candle } from "./types";
import { monthEndSession } from "./calendar.ts";
import {
  researchAccumulation,
  adaptiveSettledBars,
} from "./accumulation-policy-v5.ts";
import { symbolInput } from "./format.ts";
export function compareDca(
  bars: Candle[],
  asOf: string,
  costBps = 10,
  market: "us-equity" | "crypto" = "us-equity",
) {
  if (!Number.isFinite(costBps) || costBps < 0 || costBps > 200)
    throw Error("Costs must be between zero and two hundred basis points.");
  const signals = researchAccumulation(bars, asOf, market),
    lookup = new Map(signals.history.map((s) => [s.month, s])),
    months = new Map<string, Candle[]>();
  for (const b of adaptiveSettledBars(bars, asOf, market)) {
    const m = b.time.slice(0, 7);
    months.set(m, [...(months.get(m) || []), b]);
  }
  const policy = () => ({
      cash: 0,
      units: 0,
      contributed: 0,
      value: 0,
      costs: 0,
      drawdown: 0,
      turnover: 0,
      nav: 1,
      peak: 1,
    }),
    fixed = policy(),
    adaptive = policy(),
    history: {
      month: string;
      fixed: number;
      adaptive: number;
      multiplier: number;
      cash: number;
    }[] = [];
  for (const [month, rows] of months) {
    if (rows.at(-1)?.time !== monthEndSession(month, market)) continue;
    const prev = new Date(
        Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 0),
      )
        .toISOString()
        .slice(0, 7),
      signal = lookup.get(prev);
    if (!signal) continue;
    const entry = rows[0].open,
      close = rows.at(-1)!.close;
    if (!Number.isFinite(entry) || entry <= 0) continue;
    for (const [state, multiplier] of [
      [fixed, 1],
      [adaptive, signal.multiplier],
    ] as const) {
      const before = state.value;
      const openingValue = state.cash + state.units * entry;
      if (before > 0) state.nav *= openingValue / before;
      state.cash += 100;
      state.contributed += 100;
      const spend = Math.min(state.cash, 100 * multiplier),
        fee = (spend * costBps) / 10000;
      state.units += (spend - fee) / entry;
      state.cash -= spend;
      state.costs += fee;
      state.turnover += spend;
      state.value = state.cash + state.units * close;
      state.nav *= state.value / (openingValue + 100);
      state.peak = Math.max(state.peak, state.nav);
      state.drawdown = Math.min(
        state.drawdown,
        (state.nav / state.peak - 1) * 100,
      );
    }
    history.push({
      month,
      fixed: fixed.value,
      adaptive: adaptive.value,
      multiplier: signal.multiplier,
      cash: adaptive.cash,
    });
  }
  return {
    policy: signals.version,
    months: history.length,
    costBps,
    fixed,
    adaptive,
    history,
    limitations: [
      "Historical simulation; not live results.",
      "Equal contributions of 100 units at each eligible month start; unspent cash earns no interest.",
      "Orders modeled at the next month’s first available open. Fees and slippage combined in the stated basis points.",
      "Split-adjusted history can be revised; delisted securities and contemporaneous fundamentals are not included.",
      "No parameter tuning or calibrated success probability is claimed.",
    ],
  };
}
export function parseHoldingsCsv(
  text: string,
): { symbol: string; quantity: number; cost: number; currency: string }[] {
  if (text.length > 100000)
    throw Error("The file is too large. Import at most 200 positions.");
  const lines: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i] ?? "\n";
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(cell.trim());
      cell = "";
      if (c === "\n") {
        if (row.some(Boolean)) lines.push(row);
        row = [];
      }
    } else if (c !== "\r") cell += c;
  }
  if (quoted) throw Error("The CSV contains an unclosed quotation mark.");
  const headers = lines.shift()?.map((h) => h.toLowerCase()) || [],
    indexes = ["symbol", "quantity", "cost", "currency"].map((k) =>
      headers.indexOf(k),
    );
  if (indexes.some((i) => i < 0))
    throw Error("CSV needs symbol,quantity,cost,currency columns.");
  if (!lines.length || lines.length > 200)
    throw Error("Import one to two hundred positions.");
  return lines.map((r, i) => {
    const symbol = symbolInput(r[indexes[0]]),
      quantity = Number(r[indexes[1]]),
      cost = Number(r[indexes[2]]),
      currency = r[indexes[3]];
    if (
      !r[indexes[1]] ||
      !r[indexes[2]] ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      currency !== "USD"
    )
      throw Error(
        `Row ${i + 2}: positive quantity, non-negative cost and explicit USD currency are required.`,
      );
    return { symbol, quantity, cost, currency };
  });
}
export function tradePreview(
  total: number,
  cash: number,
  existing: number,
  purchase: number,
  maxPct: number,
) {
  const reasons: string[] = [];
  if (
    ![total, cash, existing, purchase, maxPct].every(Number.isFinite) ||
    total <= 0 ||
    cash < 0 ||
    existing < 0 ||
    purchase <= 0 ||
    maxPct <= 0 ||
    maxPct > 100
  )
    return {
      allowed: false,
      cashAfter: cash,
      weightAfter: null,
      reasons: ["Valid portfolio values and limits are required."],
    };
  const weightAfter = ((existing + purchase) / total) * 100;
  if (purchase > cash) reasons.push("The purchase exceeds recorded cash.");
  if (weightAfter > maxPct)
    reasons.push("The resulting position exceeds your concentration limit.");
  return {
    allowed: !reasons.length,
    cashAfter: cash - purchase,
    weightAfter,
    reasons,
  };
}
export function stressPortfolio(
  rows: { symbol: string; value: number }[],
  shock: number,
) {
  if (!Number.isFinite(shock) || shock < -100 || shock > 100)
    throw Error("Shock must be between -100 and 100 percent.");
  const before = rows
      .filter((r) => Number.isFinite(r.value) && r.value >= 0)
      .reduce((s, r) => s + r.value, 0),
    change = (before * shock) / 100;
  return { before, after: before + change, change };
}

```

## Reference: research-inbox
Source: lib/research-inbox.ts
SHA-256: a7ca27431f505822455addc2fbb54935371b29dbcd0a6b2c333b8b3c4368e90a

```typescript
import type { Position } from "./types";
import type { MarketEvent } from "./home-feed";
export type InboxItem = {
  id: string;
  symbol: string;
  title: string;
  detail: string;
  date: string;
  href: string;
};
export type InboxDisposition = Record<
  string,
  { until?: string; reviewed?: boolean }
>;
export function researchInbox({
  today,
  events,
  positions, news = [], changes = [], alerts = [], followed,
}: {
  today: string;
  events: MarketEvent[];
  positions: Position[];
  followed?: string[];
  news?: {symbol:string;date:string;title:string;url:string}[];
  changes?: {symbol:string;at:string;changes:string[]}[];
  alerts?: {id:string;symbol:string;created_at:string;read_at?:string|null;message?:string;title?:string}[];
}): InboxItem[] {
  const output = new Map<string, InboxItem>();
  for (const e of events) {
    const days = (Date.parse(e.date) - Date.parse(today)) / 86400000;
    if (
      !Number.isFinite(days) ||
      days < -3 ||
      days > 7 ||
      !/earn/i.test(e.kind + " " + e.detail)
    )
      continue;
    const reported =
      e.date <= today &&
      typeof e.actual === "number" &&
      Number.isFinite(e.actual);
    const id = `${e.symbol}:earnings:${e.date}`;
    output.set(id, {
      id,
      symbol: e.symbol,
      date: e.date,
      title: `${e.symbol} · ${reported ? "Review reported earnings" : days < 0 ? "Check earnings release" : days === 0 ? "Earnings scheduled today" : "Upcoming earnings"}`,
      detail: reported
        ? "Compare reported results with expectations and revisit your research questions."
        : days < 0
          ? "The scheduled date has passed; results are not confirmed in the available feed."
          : "Review expectations and the questions you want this report to answer.",
      href: `/research/${encodeURIComponent(e.symbol)}?tab=News`,
    });
  }
  for (const p of positions) {
    if (p.assetType === "cash" || (Number.isFinite(p.cost) && p.cost >= 0))
      continue;
    const id = `${p.symbol}:cost-basis`;
    output.set(id, {
      id,
      symbol: p.symbol,
      date: today,
      title: `${p.symbol} · Review cost basis`,
      detail:
        "A valid cost basis is missing. Check the position before interpreting its return.",
      href: "/portfolio",
    });
  }
  const allowed = new Set(followed ?? positions.map(p=>p.symbol));
  const recent = (value:string) => {const days=(Date.parse(today)-Date.parse(value.slice(0,10)))/86400000;return Number.isFinite(days)&&days>=0&&days<=7;};
  for (const n of news) if(allowed.has(n.symbol)&&recent(n.date)&&/^https:\/\//.test(n.url)) {
    const id=`${n.symbol}:news:${n.url}`;
    output.set(id,{id,symbol:n.symbol,date:n.date.slice(0,10),title:`${n.symbol} · Company update to review`,detail:n.title,href:`/research/${encodeURIComponent(n.symbol)}?tab=News`});
  }
  for (const c of changes) if(allowed.has(c.symbol)&&recent(c.at)&&c.changes.length) {
    const id=`${c.symbol}:changes:${c.at}`;
    output.set(id,{id,symbol:c.symbol,date:c.at.slice(0,10),title:`${c.symbol} · Evidence changed`,detail:c.changes.join(' '),href:`/research/${encodeURIComponent(c.symbol)}`});
  }
  for (const a of alerts) if(allowed.has(a.symbol)&&!a.read_at&&recent(a.created_at)) {
    const id=`alert:${a.id}`;
    output.set(id,{id,symbol:a.symbol,date:a.created_at.slice(0,10),title:`${a.symbol} · Saved alert reached`,detail:a.message||a.title||'Review the dated evidence for your saved alert.',href:'/alerts'});
  }
  return [...output.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
}
export function visibleInbox<T extends { id: string }>(
  items: T[],
  state: InboxDisposition,
  today: string,
) {
  return items.filter((item) => {
    const s = state[item.id];
    return !s?.reviewed && !(s?.until && s.until > today);
  });
}

/** Home is a short set of timely highlights, never a queue of every news item. */
export function homeHighlights(items:InboxItem[],today:string){
 const rank=(x:InboxItem)=>x.id.includes(':earnings:')?(x.date===today?0:2):x.id.startsWith('alert:')?1:3;
 const seen=new Set<string>();
 return items.filter(x=>!x.id.includes(':news:')&&!x.id.includes(':changes:')&&Number.isFinite(Date.parse(x.date)))
 .sort((a,b)=>rank(a)-rank(b)||(rank(a)===2?a.date.localeCompare(b.date):b.date.localeCompare(a.date)))
 .filter(x=>{if(seen.has(x.symbol))return false;seen.add(x.symbol);return true;}).slice(0,3);
}

```

## Completion update: planning and evidence workflows

The public Pace explanation now describes accumulation context. Comparative results belong in methodology; do not claim outperformance until the representative study can support it.

### Holdings-aware monthly planning
The planner uses priced USD investment holdings plus the new deployable contribution as its denominator. Existing cash balances are excluded to avoid counting the same deployable money twice. Duplicate lots are combined. It allocates cents toward equal final values among selected companies, subject to the selected maximum position weight. Existing positions above the cap receive no new money. Unallocated budget stays cash; no selling, borrowing or order placement occurs. Missing, stale or incompatible holding quotes block allocation instead of silently treating those holdings as zero. Read `lib/monthly-allocation.ts` for the executable allocation and validation rules.

### Explicit thesis conditions
A note may include one enabled condition: operating margin below a threshold, interest coverage below a threshold, current ratio below a threshold, or stock compensation/revenue above a threshold. Equality does not breach the condition. Free text is retained but is not interpreted as a rule. Evidence requires a dated, finite metric with currency and a reporting period no more than 550 days old; future or missing evidence yields unknown. A breach creates a review event, never an automatic sell or a declaration that the thesis is broken. Events deduplicate by symbol, normalized condition, financial period and value, so editing prose does not manufacture another alert.

Saving/checking a condition checks that account's saved note. Scheduled checking uses the separate protected `/api/jobs/theses` endpoint and `AURYN_THESIS_JOB_ENABLED=true`. Each pass leases at most four opted-in conditions across accounts, rechecks financial-data access, and publishes in-app alerts only while the saved body and lease still match. See `docs/THESIS-SCHEDULING.md`. Production scheduling must be configured; no email/push delivery is implied. The follow-up source-body guard migration must be applied before enabling this release.

### Publishing a dated Pace observation
Owner controls → handbook/evidence tools → enter a USD stock symbol → publish. `/api/pace-record` recomputes the current completed monthly policy on the server. It requires the latest completed month, a non-stale quote no more than four days old, and recorded evidence/policy hashes. The database supplies publication time. A company-period-policy record cannot be overwritten through the application role. Publication today is not evidence that the signal was published when the month ended. Database administrators retain database privileges; this is not independent notarization.

The public feed lists the latest 100 observations. It does not yet calculate realized returns, drawdowns or a DCA comparison. The database migration and market-data publication setting must be enabled before it can operate. Never seed fabricated observations or backdate publication.

### Representative study
Run `node --experimental-strip-types scripts/run-pace-study.mjs --policy-hash`, then follow `docs/PACE-STUDY-INPUT.md`. The runner replays dated raw prices through current monthly-v5 and verifies signal date, close and P0/P1=0, P2=1x, P3=2x, P4=4x spending within cash. It validates total-return prices, cash returns, costs, coverage and delistings. Its results remain non-publishable pending an independently audited representative dataset. `scripts/run-pace-prospective.mjs` additionally reads actual same-stock publication receipts before execution; see `docs/PROSPECTIVE-COMPARISON.md`. Existing older-model pending outcomes cannot establish current monthly-v5 performance.

### Observed-user sessions
The owner-only validation form records consenting participants under anonymous codes, task, completion, duration, observation date and notes. It reports recorded sessions rather than claiming independent verification or retention. Do not enter names/emails or create invented participants. Real recruitment and observed sessions must take place before reporting a 20-user validation result.
