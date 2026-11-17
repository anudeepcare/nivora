/** Documented display fields only. Never turn absent values into zero or infer signals. */
export type IntelligenceRow = {
  label: string;
  date: string | null;
  href: string | null;
  cells: { label: string; value: string }[];
  text?: string;
};
export type IntelligenceView = {
  title: string;
  note: string;
  groups: { title: string; rows: IntelligenceRow[] }[];
};
type RecordValue = Record<string, unknown>;
const record = (v: unknown): RecordValue =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as RecordValue) : {};
const rows = (v: unknown): RecordValue[] =>
  (Array.isArray(v) ? v : []).filter(
    (x) => x && typeof x === "object" && !Array.isArray(x),
  );
const list = (v: unknown) =>
  Array.isArray(v) ? rows(v) : rows(record(v).results);
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const number = (v: unknown) =>
  finite(v) ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : null;
const usd = (v: unknown) =>
  finite(v)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(v)
    : null;
const pct = (v: unknown) => (finite(v) ? `${number(v)}%` : null);
const fraction = (v: unknown) => (finite(v) ? pct(v * 100) : null);
const date = (v: unknown) =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}/.test(v) &&
  Number.isFinite(Date.parse(v))
    ? v.slice(0, 10)
    : null;
const href = (v: unknown) => {
  try {
    const u = new URL(String(v));
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
};
const cell = (label: string, value: string | null) =>
  value === null ? [] : [{ label, value }];
const row = (
  label: string,
  d: unknown,
  cells: IntelligenceRow["cells"],
  link?: unknown,
  body?: unknown,
): IntelligenceRow => ({
  label,
  date: date(d),
  cells,
  href: href(link),
  ...(text(body) ? { text: text(body)! } : {}),
});
const sorted = (rs: IntelligenceRow[]) =>
  rs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
export function intelligenceView(
  dataset: string,
  payload: unknown,
): IntelligenceView {
  const d = record(payload);
  const groups: IntelligenceView["groups"] = [];
  let title = "Research evidence",
    note =
      "Only fields returned by the provider are shown. Missing values are not estimated.";
  const add = (title: string, rs: IntelligenceRow[]) =>
    groups.push({ title, rows: rs.slice(0, 50) });
  if (dataset === "estimates") {
    title = "Forward estimates";
    note =
      "EPS in USD per share; revenue in USD, not millions. Fiscal period and scheduled report label are separate.";
    add(
      "Consensus by period",
      rows(d.estimates).map((x) =>
        row(
          text(x.periodType)?.replaceAll("_", " ") ?? "Estimate period",
          x.fiscalPeriodEnd,
          [
            ...cell("Report / period label", text(x.periodLabel)),
            ...cell("EPS low", usd(x.estimateLow)),
            ...cell("EPS mean", usd(x.estimateMean)),
            ...cell("EPS high", usd(x.estimateHigh)),
            ...cell("EPS analysts", number(x.numberOfAnalysts)),
            ...cell("Revenue mean", usd(x.revenueMean)),
            ...cell("Revenue analysts", number(x.numberOfAnalystsRevenue)),
          ],
        ),
      ),
    );
    add(
      "Earnings surprises",
      rows(d.surprises).map((x) =>
        row(text(x.periodLabel) ?? "Reported earnings", x.reportDate, [
          ...cell("Actual EPS", usd(x.actualEps)),
          ...cell("Estimated EPS", usd(x.estimateEps)),
          ...cell("Surprise", x.surpriseFlag ? null : pct(x.surprisePct)),
        ]),
      ),
    );
  } else if (dataset === "holders") {
    title = "Institutional ownership";
    note =
      "Returned holder subset, not a complete ownership census. Quarter changes appear only when the provider confirms comparable inputs.";
    add(
      "Reported holders",
      rows(d.holders).map((x) =>
        row(text(x.filerName) ?? "Institution", d.reportDate, [
          ...cell(
            "Category",
            text(x.filerCategory)?.replaceAll("_", " ") ?? null,
          ),
          ...cell("Shares", number(x.shares)),
          ...cell("Position value", usd(x.valueUsd)),
          ...cell("Share-class ownership", pct(x.pctOfClassOutstanding)),
          ...(x.comparisonStatus === "AVAILABLE"
            ? [
                ...cell("Quarter change", number(x.sharesChange)),
                ...cell("Quarter change %", pct(x.sharesChangePct)),
                ...cell("Change type", text(x.changeType)),
              ]
            : cell(
                "Comparison",
                text(x.comparisonStatus)?.replaceAll("_", " ") ??
                  "Not supplied",
              )),
        ]),
      ),
    );
  } else if (dataset === "politicians") {
    title = "Public-official disclosures";
    note =
      "Sorted by disclosure date. Reported amount ranges are not exact transaction values; disclosures may lag trades.";
    add(
      "Disclosures",
      sorted(
        list(payload).map((x) =>
          row(text(x.politicianName) ?? "Public official", x.disclosureDate, [
            ...cell("Transaction date", date(x.transactionDate)),
            ...cell("Owner", text(x.owner)),
            ...cell("Transaction", text(x.transactionType)),
            ...cell("Reported range", text(x.amountRange)),
            ...cell("Asset", text(x.assetDescription)),
            ...cell("Chamber", text(x.chamber)),
          ]),
        ),
      ),
    );
  } else if (dataset === "insiders") {
    title = "Insider filings";
    note =
      "SEC transaction codes preserve awards, exercises and withholding. A code F disposition is tax withholding, not a market sale.";
    add(
      "Filed transactions",
      sorted(
        list(payload).map((x) =>
          row(text(x.insiderName) ?? "Insider", x.filedDate, [
            ...cell("Transaction date", date(x.transactionDate)),
            ...cell("Role", text(x.insiderTitle)),
            ...cell("Filed code", text(x.transactionCode)),
            ...cell("Description", text(x.securityTitle)),
            ...cell("Security basis", text(x.securityBasis)),
            ...cell("Shares transacted", number(x.sharesTransacted)),
            ...cell(
              "Price per share",
              x.securityBasis ? null : usd(x.pricePerShare),
            ),
            ...cell("Filed value", usd(x.totalValue)),
          ]),
        ),
      ),
    );
  } else if (dataset === "documents") {
    title = "Source-linked coverage";
    note =
      "Publisher links and publication dates. The provider does not supply article headlines or full text in this dataset.";
    add(
      "Publications",
      sorted(
        rows(d.documents).map((x) =>
          row(
            text(x.sourceName) ?? "Source article",
            finite(x.published) && Math.abs(x.published * 1000) < 8.64e15
              ? new Date(x.published * 1000).toISOString()
              : null,
            [],
            x.url,
          ),
        ),
      ),
    );
  } else if (dataset === "earnings") {
    title = "Quarterly earnings readout";
    note =
      "Provider-authored summaries, not AURYN forecasts. Each quarter keeps its original reporting date.";
    add(
      "Reported quarters",
      sorted(
        list(payload).map((x) =>
          row(
            text(x.headline) ?? text(x.fiscalPeriod) ?? "Earnings report",
            x.reportDate,
            [
              ...cell("Fiscal period", text(x.fiscalPeriod)),
              ...rows(x.kpiHighlights).flatMap((k) =>
                cell(
                  text(k.label) ?? "KPI",
                  text(k.value)
                    ? `${text(k.value)}${text(k.yoy) ? ` · YoY ${text(k.yoy)}` : ""}`
                    : null,
                ),
              ),
              ...cell("Guidance", text(x.guidance)),
            ],
            undefined,
            x.summaryMd,
          ),
        ),
      ),
    );
  } else if (dataset === "filingChanges") {
    title = "What changed in filings";
    note =
      "Risk-factor comparisons supplied by SentiSense. Missing diffs are not treated as no change.";
    add(
      "Filing comparisons",
      sorted(
        list(payload).map((x) => {
          const diff = record(x.diff);
          return row(
            `${text(x.formType) ?? "Filing"} · ${text(x.section) ?? "Risk factors"}`,
            x.filedAt,
            [
              ...cell("Report period", date(x.reportDate)),
              ...cell("Added paragraphs", number(diff.paragraphsAdded)),
              ...cell("Removed paragraphs", number(diff.paragraphsRemoved)),
              ...cell("Modified paragraphs", number(diff.paragraphsModified)),
              ...cell(
                "Provider change flag",
                typeof x.noMaterialChanges === "boolean"
                  ? x.noMaterialChanges
                    ? "No material changes reported"
                    : "Changes reported"
                  : null,
              ),
            ],
            x.edgarUrl,
          );
        }),
      ),
    );
    for (const x of list(payload).slice(0, 4))
      add(
        `Passage changes · ${date(x.filedAt) ?? "date not supplied"}`,
        rows(record(x.diff).blocks).map((b) =>
          row(text(b.op) ?? "Change", null, [
            ...cell("Previous", text(b.oldExcerpt)),
            ...cell("Current", text(b.newExcerpt)),
          ]),
        ),
      );
  } else if (dataset === "options") {
    title = "Options positioning";
    note =
      "End-of-day observations, not live execution prices or trade recommendations. Premium is estimated activity; buyer/seller direction is not identified.";
    const latest = Object.keys(record(d.latest)).length ? record(d.latest) : d,
      context = record(d.context),
      walls = record(d.oiWalls);
    add("Session readings", [
      row("Latest completed snapshot", d.asOf, [
        ...cell("ATM implied volatility", fraction(latest.atmIv)),
        ...cell("Put / call volume", number(latest.pcVol)),
        ...cell("Put / call open interest", number(latest.pcOi)),
        ...cell("Call volume", number(latest.callVol)),
        ...cell("Put volume", number(latest.putVol)),
        ...cell(
          "1-day expected move (90% range)",
          fraction(latest.expectedMove1d),
        ),
        ...cell("IV rank (1y)", number(context.ivRank1y ?? d.ivRank1y)),
        ...cell("Max pain", usd(walls.maxPain ?? d.maxPain)),
      ]),
    ]);
    add(
      "Unusual contracts",
      rows(d.unusual).map((x) =>
        row(text(x.contract) ?? "Option contract", x.expiry, [
          ...cell("Type", text(x.type)),
          ...cell("Strike", usd(x.strike)),
          ...cell("Volume", number(x.volume)),
          ...cell("Open interest", number(x.oi)),
          ...cell(
            "Volume / OI",
            finite(x.volOiRatio) ? `${number(x.volOiRatio)}×` : null,
          ),
          ...cell("Estimated premium", usd(x.premium)),
          ...cell("OI follow-up", text(x.oiConfirmation)),
        ]),
      ),
    );
  }
  if (dataset === "consensusHistory") {
    title = "Analyst target history";
    note =
      "Snapshot targets, not live prices or AURYN scenarios. Carried rating counts are identified separately.";
    add(
      "Dated target observations",
      sorted(
        rows(d.history).map((x) =>
          row("Consensus snapshot", x.snapshotDate, [
            ...cell("Low target", usd(x.targetLow)),
            ...cell("Mean target", usd(x.targetMean)),
            ...cell("High target", usd(x.targetHigh)),
            ...cell("Target publishers", number(x.numberOfAnalysts)),
            ...cell(
              "Rating counts",
              typeof x.countsObserved === "boolean"
                ? x.countsObserved
                  ? "Observed in sweep"
                  : "Carried from prior observation"
                : null,
            ),
          ]),
        ),
      ),
    );
  } else if (dataset === "analystActions") {
    title = "Analyst actions";
    note =
      "Published firm actions, not a reconstruction of the consensus rating panel. Missing targets remain absent.";
    add(
      "Published actions",
      sorted(
        list(payload).map((x) =>
          row(text(x.firm) ?? "Research firm", x.actionDate, [
            ...cell("Action", text(x.actionType)),
            ...cell("Previous rating", text(x.fromGrade)),
            ...cell("New rating", text(x.toGrade)),
            ...cell("Prior stated target", usd(x.priorPriceTarget)),
            ...cell("Stated target", usd(x.priceTarget)),
          ]),
        ),
      ),
    );
  } else if (dataset === "analystCoverage") {
    title = "Who covers this company";
    note =
      "Firm coverage includes price-target notes and rating-only activity. An unnamed analyst does not mean no coverage.";
    add(
      "Covering firms",
      rows(d.coverage).map((x) => {
        const latest = record(x.latestNote),
          rating = record(x.firmRating);
        return row(
          text(x.firm) ?? "Research firm",
          latest.publishedDate ?? rating.date,
          [
            ...cell("Notes in window", number(x.noteCount)),
            ...cell(
              "Named analysts",
              rows(x.analysts)
                .map((a) => text(a.name))
                .filter(Boolean)
                .join(", ") || null,
            ),
            ...cell("Latest stated target", usd(latest.priceTarget)),
            ...cell("Current firm rating", text(rating.rating)),
            ...cell("Rating date", date(rating.date)),
          ],
          latest.newsUrl,
        );
      }),
    );
  } else if (dataset === "earningsReactions") {
    title = "How the market reacted";
    note =
      "Realized close-to-close returns around reported earnings. After-close announcements use the following trading session. No forecast is implied.";
    add(
      "Reported earnings reactions",
      sorted(
        rows(d.reactions).map((x) =>
          row("Earnings announcement", x.reportDate, [
            ...cell(
              "Announcement timing",
              x.timing === "AMC"
                ? "After market close"
                : x.timing === "BMO"
                  ? "Before market open"
                  : null,
            ),
            ...cell("Prior close", usd(x.priorClose)),
            ...cell("Reaction-session close", usd(x.nextClose)),
            ...cell("Realized move", pct(x.movePct)),
          ]),
        ),
      ),
    );
  } else if (dataset === "ownershipHistory") {
    title = "Institutional ownership through time";
    note =
      "Quarterly filed holdings. Filing quarters are incomplete; no percentage is inferred when the provider omits a denominator.";
    add(
      "Quarterly observations",
      sorted(
        rows(d.quarters).map((x) =>
          row(
            text(x.label) ?? text(x.value) ?? "Reporting quarter",
            x.reportDate,
            [
              ...cell("Filing state", text(x.status)),
              ...cell("Holders", number(x.holderCount)),
              ...cell(
                "Institutional shares",
                number(x.totalInstitutionalShares),
              ),
              ...cell("Reported value", usd(x.totalInstitutionalValue)),
              ...cell("Class ownership", pct(x.institutionalOwnershipPct)),
            ],
          ),
        ),
      ),
    );
  } else if (dataset === "optionsHistory" || dataset === "optionsIntraday") {
    const intraday = dataset === "optionsIntraday";
    title = intraday ? "Intraday options snapshots" : "Options session history";
    note = intraday
      ? `Delayed board snapshots, not a live trade tape. Reported delay: ${number(d.delayMinutes) ?? "not supplied"} minutes. Missing cycles are not interpolated.`
      : "Completed-session aggregates. Open interest is the prior settled observation; ratios and IV are not execution prices.";
    add(
      intraday ? "Stored cycles" : "Daily observations",
      rows(d.series)
        .slice()
        .reverse()
        .map((x) =>
          row(
            intraday
              ? `Cycle ${number(x.cycle) ?? "—"}${text(x.asOfEt) ? ` · ${text(x.asOfEt)}` : ""}`
              : "Session snapshot",
            intraday ? d.session : x.date,
            [
              ...cell("Calls traded", number(x.callVol)),
              ...cell("Puts traded", number(x.putVol)),
              ...cell("Put / call volume", number(x.pcVol)),
              ...cell("ATM implied volatility", fraction(x.atmIv)),
              ...cell("Unusual contracts", number(x.unusualCount)),
            ],
          ),
        ),
    );
  } else if (dataset === "kpis") {
    title = "Company operating metrics";
    note =
      "Company-specific reported series, retaining provider units and estimated/discontinued labels. These are not sentiment scores.";
    for (const series of rows(d.kpis))
      add(
        text(series.name) ?? text(series.id) ?? "Operating metric",
        rows(series.values).map((x) =>
          row(
            text(x.period) ?? "Reported period",
            x.date,
            [
              ...cell("Value", number(x.value)),
              ...cell("Unit", text(series.unit)),
              ...cell("Source citation", text(series.sourceRef)),
              ...cell(
                "Basis",
                x.isEstimate === true
                  ? "Estimate / preliminary"
                  : "Provider-reported",
              ),
              ...cell(
                "Series status",
                series.discontinued === true ? "Discontinued" : null,
              ),
              ...cell("Discontinuation note", text(series.discontinuedNote)),
            ],
            series.sourceRef,
          ),
        ),
      );
  }
  if (dataset === "profile") {
    title = "Company profile";
    note =
      "Provider profile, not a live quote. Listing country is the trading market, not company headquarters.";
    add("Business profile", [
      row(
        text(d.name) ?? text(d.ticker) ?? "Company",
        null,
        [
          ...cell("Instrument", text(d.kind)),
          ...cell("Chief executive", text(d.ceo)),
          ...cell("Sector", text(d.sector)),
          ...cell("Industry", text(d.industry)),
          ...cell("Listing market country", text(d.country)),
          ...cell("Trading currency", text(d.currency)?.toUpperCase() ?? null),
          ...cell("Primary exchange", text(d.primaryExchange)),
          ...cell("Employees", number(d.employees)),
          ...cell("First listing date", date(d.ipoDate)),
          ...cell("Profile market cap (USD)", usd(d.marketCap)),
        ],
        d.homepageUrl,
        d.description,
      ),
    ]);
  } else if (dataset === "fundamentalsCurrent") {
    title = "Trailing financial profile";
    note =
      "Separate provider evidence, not inputs silently substituted into AURYN's model. Trailing figures retain their reported currency and period count.";
    const money = (v: unknown) =>
      finite(v)
        ? `${number(v)} ${text(d.reportedCurrency) ?? "(currency not supplied)"}`
        : null;
    add("Current trailing profile", [
      row(text(d.ticker) ?? "Company", d.fetchedAt, [
        ...cell(
          "Coverage",
          d.available === false
            ? (text(d.reason) ?? "Unavailable")
            : "Provider returned profile",
        ),
        ...cell("Included filed periods", number(d.quartersIncluded)),
        ...cell("EPS TTM", money(d.epsTTM)),
        ...cell("Revenue TTM", money(d.revenueTTM)),
        ...cell("Provider P/E TTM", number(d.peTTM)),
        ...cell("Provider P/S TTM", number(d.psTTM)),
      ]),
    ]);
  } else if (
    dataset === "fundamentalsQuarterly" ||
    dataset === "fundamentalsAnnual"
  ) {
    title =
      dataset === "fundamentalsQuarterly"
        ? "Reported quarterly statements"
        : "Reported annual statements";
    note =
      "Reported amounts are not converted between currencies. Period length and filing date remain visible; no missing lines are synthesized.";
    add(
      "Filed periods",
      sorted(
        rows(d.periods).map((x) => {
          const money = (v: unknown) =>
            finite(v)
              ? `${number(v)} ${text(x.reportedCurrency) ?? "(currency not supplied)"}`
              : null;
          return row(
            `${text(x.fiscalPeriod) ?? "Period"} ${text(x.fiscalYear) ?? ""}`.trim(),
            x.periodEndDate,
            [
              ...cell("Filed", date(x.filingDate)),
              ...cell("Period months", number(x.periodMonths)),
              ...cell("Revenue", money(x.revenue)),
              ...cell("Operating income", money(x.operatingIncome)),
              ...cell("Net income", money(x.netIncome)),
              ...cell("Basic EPS", money(x.epsBasic)),
              ...cell("Diluted EPS", money(x.epsDiluted)),
              ...cell("Operating cash flow", money(x.operatingCashFlow)),
              ...cell("Capital expenditure", money(x.capitalExpenditure)),
              ...cell("Free cash flow", money(x.freeCashFlow)),
              ...cell("Total assets", money(x.totalAssets)),
              ...cell("Total liabilities", money(x.totalLiabilities)),
              ...cell("Total equity", money(x.totalEquity)),
            ],
          );
        }),
      ),
    );
  } else if (dataset === "shortInterest") {
    title = "Settled short interest";
    note =
      "Shares sold short and still outstanding at settlement, not daily short-sale volume.";
    add(
      "Settlement observations",
      sorted(
        rows(d.dataPoints).map((x) =>
          row("Short-interest observation", x.settlementDate, [
            ...cell("Shares short", number(x.shortInterest)),
            ...cell("Days to cover", number(x.daysToCover)),
            ...cell("Average daily volume", number(x.avgDailyVolume)),
          ]),
        ),
      ),
    );
  } else if (dataset === "shortVolume") {
    title = "Reported short-sale volume";
    note =
      "Activity on the reporting venues, not consolidated market volume and not outstanding short interest. Percentages are already percentage points.";
    add(
      "Daily venue observations",
      sorted(
        rows(d.dataPoints).map((x) =>
          row("Reported trading day", x.date, [
            ...cell("Short-sale shares", number(x.shortVolume)),
            ...cell("Reporting-venue volume", number(x.totalVolume)),
            ...cell("Short-volume share", pct(x.shortVolumeRatio)),
          ]),
        ),
      ),
    );
  } else if (dataset === "float") {
    title = "Free-float snapshot";
    note =
      "Provider-reported tradable share count. Missing values are not inferred from market capitalization.";
    add("Float", [
      row(text(d.ticker) ?? "Company", d.effectiveDate, [
        ...cell("Free-float shares", number(d.freeFloat)),
        ...cell("Free float", pct(d.freeFloatPercent)),
      ]),
    ]);
  } else if (dataset === "stockEtfs") {
    title = "Funds holding this company";
    note =
      "Tracked fund subset; absent funds may still hold the company. Weights can combine company share classes and are not ownership of the company.";
    add(
      "Fund exposure",
      list(payload).map((x) =>
        row(text(x.etfName) ?? text(x.etfTicker) ?? "Fund", x.asOfDate, [
          ...cell("Fund ticker", text(x.etfTicker)),
          ...cell("Company weight in fund", pct(x.weightPct)),
        ]),
      ),
    );
  } else if (dataset === "kpiTypes") {
    title = "Available operating metric types";
    note =
      "Metric metadata, not measurements. Open Company KPIs for the returned reported series.";
    add(
      "Reported metric catalog",
      list(payload).map((x) =>
        row(text(x.name) ?? text(x.id) ?? "Metric", null, [
          ...cell("Identifier", text(x.id)),
          ...cell("Category", text(x.category)),
          ...cell("Suggested display", text(x.chartType)),
        ]),
      ),
    );
  }
  return { title, note, groups };
}
