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
  sources: { id: string; label: string; url: string; passage?:string }[];
  generatedAt: string;
};
export default function Analyst({
  research,
  compact = false,
}: {
  research: Research;
  compact?: boolean;
}) {
  const { demo } = useProduct(),
    [mode, setMode] = useState<"snapshot" | "deep-dive" | "swot">("snapshot"),
    [report, setReport] = useState<Report | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [question, setQuestion] = useState(""),
    [prepared, setPrepared] = useState("");
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
  async function generate(
    requestedMode: "snapshot" | "deep-dive" | "swot" = mode,
    intent?: "explain" | "missing" | "strengthen" | "challenge",
  ) {
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
          { mode: requestedMode, ...(intent?{intent}:{}) },
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
  if (compact) {
    const prompts = [
      "What does cash after capex tell me?",
      "What is the biggest missing piece?",
      "What would strengthen the bull case?",
      "Challenge the case",
    ];
    const respond = (prompt: string, index: number) => {
      setQuestion(prompt);
      setError("");
      setReport(null);
      if (availability.data?.available && !demo) {
        setPrepared("");
        void generate(
          index === 1||index === 3 ? "swot" : index === 2 ? "snapshot" : "deep-dive",
          (["explain","missing","strengthen","challenge"] as const)[index],
        );
        return;
      }
      const p = evidence.last;
      setPrepared(
        index === 0
          ? p?.fcf == null
            ? "Matching operating cash flow and capital expenditure are missing for this period."
            : `${amount(p.fcf, p.currency, true)} remained after operating cash flow less reported capital spending in the ${evidence.periodBasis} period to ${dateLabel(p.end)}. This is not automatically distributable cash; financing, acquisitions and dilution still matter.`
          : index === 3
            ? "Challenge growth with cash conversion, financing requirements and dilution. A favorable price chart does not prove business durability; verify the original disclosures. This is a research prompt, not an AI finding."
          : index === 1
            ? "Reported financials do not establish a durable moat or a fair purchase price by themselves. Reconcile assumptions, competitive position, financing and the forecast horizon with company disclosures."
            : `Sustained revenue growth, cash conversion and disciplined reinvestment would strengthen the business case. Current comparable revenue growth is ${percent(evidence.growth, true)}. That observation does not guarantee future returns.`,
      );
    };
    return (
      <section className="ask-auryn">
        <header className="section-head">
          <div>
            <h2>Ask AURYN</h2>
            <p>Explain, find gaps or challenge the case using supplied evidence. Filing excerpts are included only when available and enabled.</p>
          </div>
        </header>
        <div className="prompt-row">
          {prompts.map((prompt, index) => (
            <button
              type="button"
              key={prompt}
              disabled={busy}
              onClick={() => respond(prompt, index)}
            >
              {prompt}
            </button>
          ))}
        </div>
        {busy && (
          <p className="context-note" role="status">
            Reviewing evidence…
          </p>
        )}
        {error && <Notice error>{error}</Notice>}
        {(prepared || report) && (
          <div className="answer" aria-live="polite">
            <strong>{question}</strong>
            <p>{report?.summary.text || prepared}</p>
            <p className="small muted">
              {report
                ? `AI-generated research · ${report.sources.some(s=>s.passage)?"includes selected filing excerpts":"financial observations only; no filing excerpts"} · verify each claim`
                : "Evidence explanation · no AI request made"}
            </p>
            {report?.sources.filter(s=>report.summary.evidenceIds.includes(s.id)).map((source) => (
              <div key={source.id}><Source href={source.url}>{source.id} · {source.label}</Source>{source.passage&&<details><summary>Read supplied excerpt</summary><blockquote>{source.passage}</blockquote><p className="small muted">Selected excerpt; read the full filing for context.</p></details>}</div>
            ))}
          </div>
        )}
      </section>
    );
  }
  return (
    <section>
      <header className="section-heading">
        <div>
          <span className="eyebrow">AURYN ANALYST</span>
          <h2>Ask AURYN</h2>
          <p>Source-linked analysis of the company evidence.</p>
        </div>
        <Sparkles size={26} className="violet" />
      </header>
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
            onClick={() => generate()}
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
