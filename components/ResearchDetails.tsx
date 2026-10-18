"use client";
import { useMemo, useRef } from "react";
import { X } from "lucide-react";
import type { Research } from "@/lib/types";
import { perspective, latestFinancialEvidence } from "@/lib/analysis";
import { financialCase } from "@/lib/research-summary";
import { priceStudies } from "@/lib/price-studies";
import { expandedStudies } from "@/lib/technical-expanded";
import { amount, dateLabel, percent } from "@/lib/format";
import TechnicalLevels from "./TechnicalLevels";
import Analyst from "./Analyst";
import { NewsAndFilings } from "./ResearchEvidence";
import { Help, DataStamp } from "./Ui";

export function TechnicalPicture({
  research: r,
  dca,
}: {
  research: Research;
  dca: React.ReactNode;
}) {
  const p = useMemo(() => perspective(r), [r]);
  const s = useMemo(() => priceStudies(r.history, r.retrievedAt), [r]);
  const x = useMemo(() => expandedStudies(r.history, r.retrievedAt), [r]);
  const anchors = useRef<HTMLDialogElement>(null);
  const readings = [
    {
      label: "Momentum · RSI",
      tone: "blue",
      value: p.tech.rsi?.toFixed(1) ?? "—",
      detail:
        p.tech.rsi == null
          ? "History needed"
          : p.tech.rsi > 70
            ? "Elevated momentum"
            : p.tech.rsi < 30
              ? "Weak momentum"
              : "Neutral range",
    },
    {
      label: "Trend · MACD",
      tone:
        s.histogram == null
          ? "neutral"
          : s.histogram > 0
            ? "positive"
            : "negative",
      value:
        s.histogram == null
          ? "—"
          : s.histogram > 0
            ? "Positive"
            : s.histogram < 0
              ? "Negative"
              : "Flat",
      detail:
        s.histogram == null
          ? "History needed"
          : `Histogram ${s.histogram.toFixed(2)}`,
    },
    {
      label: "Relative volume",
      tone: "blue",
      value:
        p.tech.volumeRatio == null ? "—" : `${p.tech.volumeRatio.toFixed(1)}×`,
      detail: "Versus 20-session average",
    },
    {
      label: "Volatility · ATR",
      tone: "neutral",
      value: percent(p.tech.atr),
      detail: "Of price · daily reference",
    },
  ];
  return (
    <>
      <div className="tech-grid">
        {readings.map((v) => (
          <div className="tech-read" data-tone={v.tone} key={v.label}>
            <p className="muted">{v.label}</p>
            <strong className="num">{v.value}</strong>
            <p className="muted">{v.detail}</p>
          </div>
        ))}
      </div>
      <div className="grid2 technical-bottom">
        <section className="technical-reference">
          <header className="section-head">
            <div>
              <h2>Fibonacci reference levels</h2>
              <p>Anchor selection determines the levels.</p>
            </div>
            <button
              className="text-button small"
              onClick={() => anchors.current?.showModal()}
            >
              Anchors
            </button>
          </header>
          <div className="fib-levels">
            {[0.382, 0.5, 0.618, 0.786].map((ratio) => (
              <span key={ratio}>
                {ratio.toFixed(3)}
                <b>
                  {amount(
                    p.tech.fib.find((f) => f.ratio === ratio)?.price,
                    r.quote.currency,
                  )}
                </b>
              </span>
            ))}
          </div>
          <p className="context-note">
            A touch alone does not confirm a reversal.
          </p>
          <div className="grid2 technical-numbers">
            {[
              ["50-day average", amount(p.tech.ma50, r.quote.currency)],
              ["200-day average", amount(p.tech.ma200, r.quote.currency)],
              ["20-day EMA", amount(s.ema20, r.quote.currency)],
              ["20-session momentum", percent(x.roc20)],
              ["ADX · 14", x.adx?.toFixed(1) ?? "—"],
              [
                "Directional movement · +DI / −DI",
                x.plusDI == null || x.minusDI == null
                  ? "—"
                  : `${x.plusDI.toFixed(1)} / ${x.minusDI.toFixed(1)}`,
              ],
              [
                "Fast stochastic · 14,1,3 · %K / %D",
                x.stochasticK == null || x.stochasticD == null
                  ? "—"
                  : `${x.stochasticK.toFixed(1)} / ${x.stochasticD.toFixed(1)}`,
              ],
              ["Bollinger position · %B", percent(x.percentB)],
              ["OBV", x.obv?.toLocaleString() ?? "—"],
              ["Bollinger bandwidth", percent(x.bandwidth)],
              ["From 252-session closing high", percent(x.drawdown)],
            ].map(([label, value]) => (
              <div className="stat-pair" key={label}>
                <span>{label}</span>
                <strong className="num">{value}</strong>
              </div>
            ))}
          </div>
          <Help label="Study definitions" trigger="How to read these studies">
            <p>
              EMA weights recent prices more heavily. Twenty-session momentum is
              the close-to-close percentage change across twenty observations.
              Fast stochastic uses a fourteen-session high/low range with no %K
              smoothing and a three-session %D average. +DI and −DI describe
              directional movement, while ADX measures its strength. A high or
              low oscillator is not a standalone buy or sell signal.
            </p>
            <p>
              Moving averages describe price trend. ADX measures trend strength,
              not direction. OBV accumulates signed trading volume; its change
              matters more than its absolute level.
            </p>
            <p>
              Bollinger bandwidth measures the spread of the bands relative to
              their average. Drawdown compares the latest close with the highest
              close in the last 252 sessions. These studies use completed daily
              observations regardless of chart interval.
            </p>
          </Help>
        </section>
        <div className="technical-accumulation">{dca}</div>
      </div>
      <div className="shared-stamp">
        <DataStamp
          source={r.historySource}
          asOf={p.tech.last}
          status="Daily study inputs"
        />
      </div>
      <dialog
        ref={anchors}
        className="dialog anchors-dialog"
        aria-label="Fibonacci anchors"
      >
        <header className="dialog-head">
          <h2>Fibonacci anchors</h2>
          <button
            className="icon-button"
            aria-label="Close anchors"
            onClick={() => anchors.current?.close()}
          >
            <X size={20} />
          </button>
        </header>
        <TechnicalLevels research={r} />
      </dialog>
    </>
  );
}

export function ThesisPicture({ research: r }: { research: Research }) {
  const e = useMemo(() => latestFinancialEvidence(r), [r]);
  const c = useMemo(() => financialCase(e.latest, e.prior), [e]);
  const next = r.evidence?.earnings
    ?.filter((x) => x.date >= r.retrievedAt.slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const groups = [
    { label: "Supports the case", rows: c.positive, tone: "positive" },
    { label: "Challenges the case", rows: c.risks, tone: "negative" },
  ];
  return (
    <>
      <header className="section-head">
        <div>
          <h2>The investment case</h2>
          <p>Three drivers. Three risks. What would change the view.</p>
        </div>
      </header>
      <div className="grid2 thesis-evidence">
        {groups.map((g) => (
          <section className="thesis-group" data-tone={g.tone} key={g.label}>
            <h3 className={g.tone}>{g.label}</h3>
            {g.rows.slice(0, 3).map((x) => (
              <div className="driver" key={x.key}>
                <h3>{x.title}</h3>
                <strong className="driver-value num">
                  {x.unit === "percent"
                    ? percent(x.value)
                    : x.unit === "ratio"
                      ? `${x.value.toFixed(1)}×`
                      : amount(x.value, e.latest?.currency, true)}
                </strong>
                <p>{x.text}</p>
              </div>
            ))}
            {!g.rows.length && (
              <p className="context-note">
                {r.company.assetType === "crypto"
                  ? "Evaluate supply, network usage, liquidity and protocol risks. Corporate financial ratios do not apply."
                  : "No confirmed factors in this snapshot. Review the company's own disclosures."}
              </p>
            )}
          </section>
        ))}
      </div>
      <header className="section-head">
        <div>
          <h2>Watch next</h2>
          <p>Evidence to revisit, not predictions.</p>
        </div>
      </header>
      <div className="timeline">
        <div className="step">
          <b>Earnings</b>
          <p>
            {next ? `${dateLabel(next.date)} · ` : ""}Revenue, cash conversion
            and guidance.
          </p>
        </div>
        <div className="step">
          <b>Growth drivers</b>
          <p>Customer demand, competition and investment returns.</p>
        </div>
        <div className="step">
          <b>Margins</b>
          <p>Investment needs, pricing and dilution.</p>
        </div>
      </div>
      <div className="notice">
        <strong>Revisit the case if</strong> growth and cash conversion weaken
        persistently or the funding picture changes.
      </div>
      <section className="research-updates">
        <header className="section-head">
          <div>
            <h2>Events & insider activity</h2>
            <p>
              Reported transactions and scheduled earnings; neither is a
              standalone buy signal.
            </p>
          </div>
        </header>
        <div className="grid2">
          <div>
            <h3>Next scheduled earnings</h3>
            <p className="context-note">
              {next ? dateLabel(next.date) : "No upcoming date supplied"}
            </p>
            {next?.estimate != null && (
              <p>
                EPS estimate{" "}
                {amount(
                  next.estimate,
                  r.evidence?.reportingCurrency ?? undefined,
                )}
              </p>
            )}
          </div>
          <div>
            <h3>Recent insider filings</h3>
            {r.evidence?.insiders?.length ? (
              r.evidence.insiders.slice(0, 4).map((item, i) => (
                <div className="stat-pair" key={i}>
                  <span>
                    {item.name}
                    <small className="muted">
                      {" "}
                      · {dateLabel(item.date)} ·{" "}
                      {item.code === "S"
                        ? "Sale"
                        : item.code === "P"
                          ? "Purchase"
                          : `Code ${item.code}`}
                    </small>
                  </span>
                  <strong>
                    {item.change == null
                      ? "—"
                      : Math.abs(item.change).toLocaleString()}{" "}
                    shares
                  </strong>
                </div>
              ))
            ) : (
              <p className="context-note">No insider records supplied.</p>
            )}
            <p className="context-note">
              Sales can reflect tax, diversification or trading plans.
              Transaction codes and filing dates matter.
            </p>
          </div>
        </div>
      </section>
      <NewsAndFilings research={r} />
      <Analyst research={r} compact />
      <div className="shared-stamp">
        <DataStamp
          source={e.latest?.sourceUrl || e.latest?.basis}
          asOf={e.latest?.end}
          status={e.periodBasis}
        />
      </div>
    </>
  );
}
