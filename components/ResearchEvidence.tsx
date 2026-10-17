"use client";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Sparkles,
  Users,
  Building2,
  FileText,
} from "lucide-react";
import type { Research, Filing } from "@/lib/types";
import type { EodNews } from "@/lib/eodhd";
import { amount, percent, dateLabel } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import { Help, Source } from "./Ui";
import { InvestmentCase } from "./ResearchSummary";
import Analyst from "./Analyst";
import { useGrow } from "./GrowCompany";
export function ProviderMetrics({
  research: r,
  compact = false,
}: {
  research: Research;
  compact?: boolean;
}) {
  const e = r.evidence;
  if (!e) return null;
  const multiple = (v: number | null | undefined) =>
    v == null ? "—" : `${v.toFixed(1)}×`;
  const rows = [
    [
      "Market cap",
      amount(e.highlights.MarketCapitalization, r.quote.currency, true),
      "Provider-reported market capitalization, as of the provider update.",
    ],
    [
      "P/E · TTM",
      multiple(e.multiples.TrailingPE),
      "Provider-reported trailing price/earnings ratio. A negative earnings base may make this unavailable.",
    ],
    [
      "Forward P/E",
      multiple(e.multiples.ForwardPE),
      "Provider-reported ratio based on estimated future earnings, not reported results.",
    ],
    [
      "EV / revenue",
      multiple(e.multiples.EnterpriseValueRevenue),
      "Enterprise value divided by revenue, supplied by EODHD.",
    ],
    [
      "EV / EBITDA",
      multiple(e.multiples.EnterpriseValueEbitda),
      "Enterprise value relative to EBITDA; debt, capital intensity and adjustments still matter.",
    ],
    [
      "Price / book",
      multiple(e.multiples.PriceBookMRQ),
      "Market price relative to book equity. Use cautiously for intangible-heavy businesses.",
    ],
    [
      "ROE · TTM",
      percent(
        e.highlights.ReturnOnEquityTTM == null
          ? null
          : e.highlights.ReturnOnEquityTTM * 100,
      ),
      "Provider-reported return on equity. Leverage and low equity can inflate this measure.",
    ],
    [
      "Dividend yield",
      percent(
        e.highlights.DividendYield == null
          ? null
          : e.highlights.DividendYield * 100,
      ),
      "Provider-reported dividend yield. Future dividends are not guaranteed.",
    ],
  ];
  return (
    <section>
      <header className="au-section-head">
        <h2>{compact ? "Market context" : "Valuation in context"}</h2>
        <span className="au-caption">
          EODHD · Updated {dateLabel(e.updatedAt)}
        </span>
      </header>
      <div className="market-metrics">
        {rows.slice(0, compact ? 4 : 8).map(([label, value, help]) => (
          <div key={label}>
            <span>
              {label}
              <Help label={label}>{help}</Help>
            </span>
            <b>{value}</b>
          </div>
        ))}
      </div>
      {!compact && <Consensus research={r} />}
    </section>
  );
}
export function Consensus({ research: r }: { research: Research }) {
  const e = r.evidence;
  if (!e) return null;
  const c = e.consensus;
  const votes = [
    { label: "Strong buy", n: c.strongBuy, color: "var(--teal)" },
    { label: "Buy", n: c.buy, color: "#5cb9a2" },
    { label: "Hold", n: c.hold, color: "var(--blue)" },
    { label: "Sell", n: c.sell, color: "var(--amber)" },
    { label: "Strong sell", n: c.strongSell, color: "var(--red)" },
  ];
  const total = votes.reduce((s, v) => s + Math.max(0, v.n ?? 0), 0);
  return (
    <section className="au-panel consensus">
      <div className="au-panel-head">
        <div>
          <h3>Analyst expectations</h3>
          <small>
            Consensus is an opinion, separate from AURYN’s scenarios.
          </small>
        </div>
        <Help label="Analyst consensus">
          EODHD consensus and targets may update at different times from prices.
          A target is not fair value or a guaranteed return. The provider update
          date is not necessarily the date of each analyst report.
        </Help>
      </div>
      <div className="au-between">
        <div>
          <small>Consensus target · quote currency</small>
          <div className="au-metric-value">
            {r.company.foreignListing
              ? "Currency review required"
              : amount(c.target, r.quote.currency)}
          </div>
        </div>
        <div>
          <small>Analysts reporting</small>
          <div className="au-metric-value">{total || "—"}</div>
        </div>
      </div>
      {total > 0 ? (
        <>
          <div className="vote-bar">
            {votes
              .filter((x) => (x.n ?? 0) > 0)
              .map((v) => (
                <span
                  key={v.label}
                  style={{
                    width: `${(v.n! / total) * 100}%`,
                    background: v.color,
                  }}
                  title={`${v.label}: ${v.n}`}
                />
              ))}
          </div>
          <div className="vote-legend">
            {votes.map((v) => (
              <span key={v.label}>
                <i style={{ background: v.color }} />
                {v.label} {v.n ?? "—"}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="au-caption">
          No rating distribution returned for this company.
        </p>
      )}
    </section>
  );
}
export function Forecasts({ research: r }: { research: Research }) {
  const [annual, setAnnual] = useState(true),
    e = r.evidence;
  const rows =
    e?.estimates
      .filter((x) =>
        annual
          ? x.frequency.toLowerCase().includes("annual")
          : x.frequency.toLowerCase().includes("quarter"),
      )
      .slice(-6) ?? [];
  if (!e) return null;
  return (
    <section className="au-panel">
      <header className="au-panel-head">
        <div>
          <h2>What analysts expect next</h2>
          <p className="au-caption">
            Forecasts · range of estimates · {dateLabel(e.updatedAt)}
          </p>
        </div>
        <div className="au-segment">
          <button aria-pressed={annual} onClick={() => setAnnual(true)}>
            Annual
          </button>
          <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
            Quarterly
          </button>
        </div>
      </header>
      {rows.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Period ending</th>
                <th>Revenue estimate</th>
                <th>EPS estimate</th>
                <th>EPS range</th>
                <th>Analysts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.date + x.period}>
                  <td>
                    {dateLabel(x.date)}
                    <small className="block">
                      {x.currency ?? "Currency unspecified"}
                    </small>
                  </td>
                  <td>
                    {x.currency ? amount(x.revenue, x.currency, true) : "—"}
                  </td>
                  <td>{x.currency ? amount(x.eps, x.currency) : "—"}</td>
                  <td>
                    {x.currency && x.epsLow != null && x.epsHigh != null
                      ? `${amount(x.epsLow, x.currency)} – ${amount(x.epsHigh, x.currency)}`
                      : "—"}
                  </td>
                  <td>{x.analysts ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="au-caption">
          No {annual ? "annual" : "quarterly"} consensus estimates returned for
          this listing.
        </p>
      )}
    </section>
  );
}
function Earnings({ research: r }: { research: Research }) {
  const e = r.evidence;
  if (!e) return null;
  const rows = e.earnings.slice(0, 6);
  return (
    <section className="au-panel">
      <header className="au-panel-head">
        <h2>Earnings & catalysts</h2>
        <Help label="Earnings and catalysts">
          Report dates may change. EPS actual and estimate are provider values
          and may use an adjusted basis. A future report has no actual result.
          Surprises are relative to the estimate, not predictions of price
          reaction.
        </Help>
      </header>
      {rows.length ? (
        <div className="earnings-rows">
          {rows.map((x) => (
            <div className="earnings-row" key={x.date + x.period}>
              <div>
                <b>{dateLabel(x.date)}</b>
                <small>
                  {x.time || "Time not reported"} · Period {x.period}
                </small>
              </div>
              <div>
                <small>Actual / estimate EPS · provider basis</small>
                <b>
                  {x.actual == null ? "Not reported" : x.actual.toFixed(2)} /{" "}
                  {x.estimate == null ? "—" : x.estimate.toFixed(2)}
                </b>
              </div>
              <span
                className={
                  x.surprise != null && x.surprise < 0
                    ? "au-negative"
                    : "au-positive"
                }
              >
                {percent(x.surprise, true)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="au-caption">No earnings schedule returned.</p>
      )}
    </section>
  );
}
function Ownership({ research: r }: { research: Research }) {
  const e = r.evidence;
  if (!e) return null;
  return (
    <section className="au-panel">
      <header className="au-panel-head">
        <h2>Who owns the company?</h2>
        <Help label="Institutional ownership">
          Positions are reported with a delay and may already have changed.
          Institutional ownership is not proof of future performance or current
          buying pressure. Percentages come from the provider.
        </Help>
      </header>
      <div className="ownership-totals">
        <div>
          <Users size={19} />
          <span>
            <small>Institutions</small>
            <b>{percent(e.ownership.institutions)}</b>
          </span>
        </div>
        <div>
          <Building2 size={19} />
          <span>
            <small>Insiders</small>
            <b>{percent(e.ownership.insiders)}</b>
          </span>
        </div>
      </div>
      {e.holders.length ? (
        <div className="ownership-list">
          {e.holders.slice(0, 6).map((x) => (
            <div key={x.name}>
              <span>
                {x.name}
                <small>Reported {dateLabel(x.date)}</small>
              </span>
              <div className="ownership-track">
                <i
                  style={{
                    width: `${Math.min(100, Math.max(0, x.percent ?? 0) * 5)}%`,
                  }}
                />
              </div>
              <b>{percent(x.percent)}</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="au-caption">Holder-level positions were not returned.</p>
      )}
      {e.insiders.length > 0 && (
        <div className="table-scroll support">
          <h3>Reported insider transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Person / reported date</th>
                <th>Code</th>
                <th>Shares</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {e.insiders.slice(0, 6).map((x, i) => (
                <tr key={x.date + x.name + i}>
                  <td>
                    {x.name}
                    <small className="block">{dateLabel(x.date)}</small>
                  </td>
                  <td>{x.code}</td>
                  <td>{x.change?.toLocaleString() ?? "—"}</td>
                  <td>{amount(x.price, r.quote.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="au-caption">
            P: purchase · S: sale · A: award · M: exercise · F: withholding.
            Other codes require reviewing the filing.
          </p>
        </div>
      )}
    </section>
  );
}
function NewsAndFilings({ research: r }: { research: Research }) {
  const { demo } = useProduct();
  const preview = useMemo(
    () =>
      demo
        ? {
            items: [],
            source: "Illustrative preview",
            retrievedAt: r.retrievedAt,
          }
        : undefined,
    [demo, r.retrievedAt],
  );
  const news = useResource<EodNews>(
    `news?symbol=${encodeURIComponent(r.company.symbol)}`,
    preview,
    3600000,
  );
  const demoFilings = useMemo(
    () => (demo ? { filings: r.filings, issues: [] } : undefined),
    [demo, r.filings],
  );
  const filings = useResource<{ filings: Filing[]; issues: string[] }>(
    r.company.assetType === "stock"
      ? `filings?symbol=${encodeURIComponent(r.company.symbol)}`
      : null,
    demoFilings,
    3600000,
  );
  return (
    <div className="au-two">
      <section className="au-panel">
        <header className="au-panel-head">
          <h2>Recent coverage</h2>
          <small>Publisher sources</small>
        </header>
        {news.data?.items.length ? (
          news.data.items.slice(0, 6).map((n, i) => (
            <a
              className="source-row"
              key={n.url + i}
              href={n.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <small>{dateLabel(n.date)}</small>
                {n.title}
              </span>
              <ArrowUpRight size={17} />
            </a>
          ))
        ) : (
          <p className="au-caption">
            {news.loading
              ? "Loading recent coverage…"
              : news.error || "No recent articles returned."}
          </p>
        )}
      </section>
      {r.company.assetType === "stock" && (
        <section className="au-panel">
          <header className="au-panel-head">
            <h2>Source filings</h2>
            <FileText size={18} />
          </header>
          {filings.data?.filings.length ? (
            filings.data.filings.slice(0, 6).map((f) => (
              <a
                className="source-row"
                key={f.url}
                href={f.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>
                  <small>
                    {f.form} · {dateLabel(f.date)}
                  </small>
                  {f.title}
                </span>
                <ArrowUpRight size={17} />
              </a>
            ))
          ) : (
            <p className="au-caption">
              {filings.loading
                ? "Loading disclosures…"
                : filings.error ||
                  filings.data?.issues.join(" ") ||
                  "No source filings returned."}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
function CorporateActions({ symbol }: { symbol: string }) {
  const dividends = useGrow(symbol, "dividends"),
    splits = useGrow(symbol, "splits");
  return (
    <div className="au-two">
      <section className="au-panel">
        <header className="au-panel-head">
          <h2>Dividends</h2>
          <small>Ex-dividend date · cash per share</small>
        </header>
        {dividends.data?.dividends.length ? (
          dividends.data.dividends.slice(0, 5).map((x, i) => (
            <div className="source-row" key={x.date + i}>
              <span>{dateLabel(x.date)}</span>
              <b>
                {dividends.data?.currency
                  ? amount(x.amount, dividends.data.currency)
                  : (x.amount?.toFixed(4) ?? "—")}
              </b>
            </div>
          ))
        ) : (
          <p className="au-caption">
            {dividends.loading
              ? "Loading…"
              : dividends.error || "No dividend records returned."}
          </p>
        )}
        <p className="au-caption">
          {dividends.data?.source}
          {!dividends.data?.currency
            ? " · Currency not supplied by this endpoint."
            : ""}
        </p>
      </section>
      <section className="au-panel">
        <header className="au-panel-head">
          <h2>Stock splits</h2>
          <small>Last five years</small>
        </header>
        {splits.data?.splits.length ? (
          splits.data.splits.slice(0, 5).map((x, i) => (
            <div className="source-row" key={x.date + i}>
              <span>{dateLabel(x.date)}</span>
              <b>{x.description}</b>
            </div>
          ))
        ) : (
          <p className="au-caption">
            {splits.loading
              ? "Loading…"
              : splits.error || "No splits returned in this period."}
          </p>
        )}
        <p className="au-caption">
          Saved share quantities and cost basis are not changed automatically.
        </p>
      </section>
    </div>
  );
}
export function ResearchThesis({ research: r }: { research: Research }) {
  const [ai, setAi] = useState(false),
    e = r.evidence,
    crypto = r.company.assetType === "crypto";
  return (
    <div className="au-stack">
      {!crypto && (
        <>
          <section className="au-panel">
            <header className="au-panel-head">
              <div>
                <h2>The business behind the ticker</h2>
                <p className="au-caption">
                  {e?.profile.sector || r.company.sector}{" "}
                  {e?.profile.industry ? `· ${e.profile.industry}` : ""}
                </p>
              </div>
              {e?.profile.website && (
                <Source href={e.profile.website}>Company website</Source>
              )}
            </header>
            <p className="business-intro">
              {(
                e?.profile.description ||
                r.company.description ||
                "A company description was not returned."
              ).slice(0, 600)}
              {(e?.profile.description?.length ?? 0) > 600 ? "…" : ""}
            </p>
            <p className="au-caption">
              {e?.profile.country}
              {e?.profile.employees != null
                ? ` · ${e.profile.employees.toLocaleString()} employees`
                : ""}{" "}
              · EODHD company profile
            </p>
          </section>
          <InvestmentCase research={r} />
          <div className="au-two">
            <Ownership research={r} />
            <Consensus research={r} />
          </div>
          <Earnings research={r} />
          <CorporateActions symbol={r.company.symbol} />
        </>
      )}
      <NewsAndFilings research={r} />
      <section className="au-panel">
        <div className="au-between">
          <div>
            <h2>
              <Sparkles size={19} /> Evidence analyst
            </h2>
            <p className="au-caption">
              Ask for a sourced interpretation of this research. Generation
              requires a separately configured AI budget.
            </p>
          </div>
          <button
            className="button"
            aria-expanded={ai}
            onClick={() => setAi((x) => !x)}
          >
            {ai ? "Close analyst" : "Open analyst"}
          </button>
        </div>
        {ai && <Analyst research={r} />}
      </section>
    </div>
  );
}
