"use client";
import { useState } from "react";
import { Sparkles, ArrowUpRight, Download, ShieldCheck } from "lucide-react";
import { perspective } from "@/lib/analysis";
import { amount, percent } from "@/lib/format";
import type { Research } from "@/lib/types";
import { api } from "@/lib/client";
import { dateLabel } from "@/lib/format";
import { useProduct } from "./Session";
import { Notice, Source } from "./Ui";
type Claim = { text: string; evidenceIds: string[] };
type Report = {
  summary: Claim;
  strengths: Claim[];
  risks: Claim[];
  watch: Claim[];
  sources: { id: string; label: string; url: string }[];
  generatedAt: string;
};
export default function Analyst({ research }: { research: Research }) {
  const { demo } = useProduct(),
    [mode, setMode] = useState<"snapshot" | "deep-dive" | "swot">("snapshot"),
    [report, setReport] = useState<Report | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function generate() {
    setError("");
    if (demo) {
      setError(
        "AI generation is disabled in this illustrative preview. No API credits are used.",
      );
      return;
    }
    setBusy(true);
    try {
      setReport(
        await api<Report>(
          `analyst/${encodeURIComponent(research.company.symbol)}`,
          { mode },
        ),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Analysis could not be generated.",
      );
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!report) return;
    const lines = [
      `${research.company.name} · ${mode}`,
      `Generated ${report.generatedAt}`,
      `${report.summary.text} [${report.summary.evidenceIds.join(", ")}]`,
      ...["strengths", "risks", "watch"].flatMap((k) => [
        k.toUpperCase(),
        ...report[k as "strengths"].map(
          (c) => `${c.text} [${c.evidenceIds.join(", ")}]`,
        ),
      ]),
      "SOURCES",
      ...report.sources.map((s) => `${s.id}: ${s.label} ${s.url}`),
      "AI-generated research. Verify claims against their sources.",
    ];
    const url = URL.createObjectURL(
      new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `AURYN-${research.company.symbol}-${mode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const evidence = perspective(research);
  return (
    <section>
      <header className="section-heading">
        <div>
          <span className="eyebrow">AURYN ANALYST</span>
          <h2>Understand the evidence. Challenge the thesis.</h2>
          <p>Source-linked analysis of the data available for this company.</p>
        </div>
        <Sparkles size={26} className="violet" />
      </header>
      <section className="panel support">
        <h3>Evidence answers</h3>
        <p className="muted">
          Calculated from the current research snapshot · no AI charge
        </p>
        <div className="three-col">
          <div>
            <b>What is improving?</b>
            <p>
              {evidence.growth != null
                ? `Comparable annual revenue changed ${percent(evidence.growth)}.`
                : "Comparable annual revenue periods are needed."}
            </p>
            {evidence.last && (
              <Source href={evidence.last.sourceUrl}>
                Reported financials
              </Source>
            )}
          </div>
          <div>
            <b>Does profit turn into cash?</b>
            <p>
              {evidence.last?.fcf != null
                ? `Free cash flow was ${amount(evidence.last.fcf, evidence.last.currency, true)}, versus net income of ${amount(evidence.last.netIncome, evidence.last.currency, true)}.`
                : "Matching operating cash flow and capital expenditure periods are needed."}
            </p>
          </div>
          <div>
            <b>What could change the view?</b>
            <p>
              {research.snapshot?.coverage.drivers.slice(0, 3).join(" · ") ||
                "Review revenue durability, cash conversion, financing and the next reported milestone."}
            </p>
          </div>
        </div>
      </section>
      <div className="analyst-controls">
        <div className="segment">
          {(["snapshot", "deep-dive", "swot"] as const).map((m) => (
            <button
              key={m}
              aria-pressed={m === mode}
              disabled={busy}
              onClick={() => {
                setMode(m);
                setReport(null);
                setError("");
              }}
            >
              {m === "snapshot"
                ? "Snapshot"
                : m === "deep-dive"
                  ? "Deep dive"
                  : "SWOT"}
            </button>
          ))}
        </div>
        <button
          className="button primary"
          disabled={busy || !research.facts.length}
          onClick={generate}
        >
          <Sparkles size={16} />
          {busy
            ? "Reviewing evidence…"
            : report
              ? "Refresh analysis"
              : "Generate analysis"}
        </button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {report ? (
        <div className="ai-report">
          <header>
            <div>
              <h3>{report.summary.text}</h3>
              <div className="source-line">
                {report.summary.evidenceIds.map((id) => {
                  const s = report.sources.find((s) => s.id === id);
                  return s ? (
                    <Source key={id} href={s.url}>
                      {id}
                    </Source>
                  ) : null;
                })}
              </div>
            </div>
            <button
              className="icon-button"
              aria-label="Download analysis"
              onClick={download}
            >
              <Download size={18} />
            </button>
          </header>
          <div className="three-col">
            {(["strengths", "risks", "watch"] as const).map((k, i) => (
              <section key={k} className="panel">
                <h3 className={["green", "amber", "violet"][i]}>
                  {["Strengths", "Risks & counterarguments", "Watch next"][i]}
                </h3>
                {report[k].map((c, j) => (
                  <div className="ai-claim" key={j}>
                    <p>{c.text}</p>
                    <div>
                      {c.evidenceIds.map((id) => {
                        const s = report.sources.find((s) => s.id === id);
                        return s ? (
                          <Source key={id} href={s.url}>
                            {id}
                          </Source>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
          <p className="footnote">
            AI-generated · {dateLabel(report.generatedAt)}. Citations link to
            supplied evidence; they do not guarantee every interpretation is
            correct.
          </p>
        </div>
      ) : (
        <div className="analyst-intro">
          <div className="analyst-mark">
            <Sparkles size={32} />
          </div>
          <h3>A clear brief, built from sources.</h3>
          <p>
            Review the business, challenge the strongest argument and identify
            what deserves a closer look.
          </p>
          <div className="analyst-features">
            <span>
              <ShieldCheck size={17} />
              Source references
            </span>
            <span>
              <ArrowUpRight size={17} />
              Bull & bear evidence
            </span>
            <span>
              <Sparkles size={17} />
              Generated when requested
            </span>
          </div>
          <small>
            {research.facts.length
              ? `${research.facts.length} reported observations available. Paid generation requires configured access and an account budget.`
              : "Reported source evidence is needed before generating analysis."}
          </small>
        </div>
      )}
      <section className="panel support">
        <h3>Earnings transcripts & analyst forecasts</h3>
        <p>
          These require a provider with the relevant coverage and display
          rights. They are not inferred from SEC financial totals or fabricated
          by AI.
        </p>
        <div className="source-line">
          <span>Provider coverage pending verification</span>
        </div>
      </section>
    </section>
  );
}
