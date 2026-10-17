"use client";
import { useMemo, useState } from "react";
import { Sparkles, Download } from "lucide-react";
import { perspective } from "@/lib/analysis";
import { amount, percent } from "@/lib/format";
import type { Research } from "@/lib/types";
import { api } from "@/lib/client";
import { dateLabel } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import type { AnalystStatus } from "@/lib/analyst-status";
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
  const previewStatus = useMemo<AnalystStatus | undefined>(
    () =>
      demo
        ? {
            available: false,
            reason: "preview",
            message:
              "This preview shows reported evidence. AI generation is off.",
          }
        : undefined,
    [demo],
  );
  const availability = useResource<AnalystStatus>(
    `analyst/${encodeURIComponent(research.company.symbol.replace("/", "-"))}`,
    previewStatus,
  );
  async function generate() {
    setError("");
    if (demo || !availability.data?.available) {
      setError(
        demo
          ? "AI generation is disabled in this illustrative preview. No API credits are used."
          : availability.data?.message ||
              "AI configuration could not be checked. Please retry.",
      );
      return;
    }
    setBusy(true);
    try {
      setReport(
        await api<Report>(
          `analyst/${encodeURIComponent(research.company.symbol.replace("/", "-"))}`,
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
          <h2>Company analysis</h2>
          <p>Source-linked analysis of the data available for this company.</p>
        </div>
        <Sparkles size={26} className="violet" />
      </header>
      <section className="panel evidence-summary">
        <header className="section-heading">
          <div>
            <h3>Financial evidence</h3>
            <p>
              {evidence.last
                ? `${evidence.periodBasis} ending ${dateLabel(evidence.last.end)} · ${evidence.last.currency}`
                : "Reporting period unavailable"}
            </p>
          </div>
          <span className="status-pill">Reported data</span>
        </header>
        <div className="evidence-metrics">
          <div>
            <span>Revenue growth</span>
            <strong
              className={
                evidence.growth != null && evidence.growth < 0 ? "red" : ""
              }
            >
              {percent(evidence.growth, true)}
            </strong>
            <small>
              {evidence.growth != null
                ? `Comparable ${evidence.periodBasis} periods`
                : "Comparable periods not available"}
            </small>
          </div>
          <div>
            <span>Free cash flow</span>
            <strong
              className={
                evidence.last?.fcf != null && evidence.last.fcf < 0 ? "red" : ""
              }
            >
              {amount(evidence.last?.fcf, evidence.last?.currency, true)}
            </strong>
            <small>
              {evidence.last?.fcf != null
                ? "Operating cash flow less capital spending"
                : "Matching cash flow and capital spending needed"}
            </small>
          </div>
          <div>
            <span>Operating margin</span>
            <strong>{percent(evidence.last?.margin)}</strong>
            <small>Operating income ÷ revenue</small>
          </div>
        </div>
        {evidence.last && (
          <Source href={evidence.last.sourceUrl}>
            View reported financials
          </Source>
        )}
      </section>
      <div className="analyst-availability" role="status">
        <span
          className={`status-pill ${availability.data?.available ? "green" : "amber"}`}
        >
          {availability.loading
            ? "Checking AI"
            : availability.data?.available
              ? "AI ready"
              : "AI unavailable"}
        </span>
        <p>
          {availability.error ||
            availability.data?.message ||
            "Checking whether generation is available…"}
        </p>
        {availability.error && (
          <button className="button" onClick={availability.refresh}>
            Retry
          </button>
        )}
      </div>
      {availability.data?.available && (
        <div className="analyst-controls">
          <div className="segment">
            {(["snapshot", "deep-dive", "swot"] as const).map((m) => (
              <button
                key={m}
                aria-pressed={m === mode}
                disabled={busy || !availability.data?.available}
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
            disabled={
              busy || !availability.data?.available || !research.facts.length
            }
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
      )}
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
      ) : availability.data?.available ? (
        <p className="analyst-hint">
          Choose a format to generate a sourced brief from the reported
          evidence. Review its citations before relying on an interpretation.
        </p>
      ) : null}
    </section>
  );
}
