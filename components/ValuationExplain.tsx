"use client";

type Case = { value?: number | null; vsPrice?: number | null; g0?: number | null; margin?: number | null; rate?: number | null; gT?: number | null };
type Output = { status: string; symbol: string; asOf: string; family: string; modelVersion: string; traceId: string; confidence: number; dataQuality: number; cases: { bear: Case; base: Case; bull: Case }; methods?: Array<{ id: string; confidence: number; value: number | null }>; flags?: string[]; refusalReason?: string | null };
type Source = { metric: string; tag?: string; source?: string; sourceRef?: string; transformation?: string; asOf?: string };

const pct = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—";
const value = (number: number | null | undefined) => typeof number === "number" && Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";

export default function ValuationExplain({ output, sources = [], adjusted = false, stale = false }: { output: Output; sources?: Source[]; adjusted?: boolean; stale?: boolean }) {
  const supported = ["ok", "low-confidence"].includes(output.status) && output.cases?.base?.value != null;
  return (
    <section className="valuation-explain" aria-label="AURYN valuation explanation">
      <header className="valuation-explain-header">
        <div>
          <span className="eyebrow">AURYN valuation · {output.family}</span>
          <h2>{supported ? "Assumption range" : "Valuation not established"}</h2>
          <p>{supported ? "A transparent range, separate from business quality and confirmed Pace." : output.refusalReason || "The available evidence is not sufficient for a responsible price range."}</p>
        </div>
        <span className={`valuation-status valuation-status-${output.status}`}>{output.status.replace("-", " ")}</span>
      </header>
      {supported ? (
        <div className="valuation-case-grid">
          {(["bear", "base", "bull"] as const).map((key) => <article key={key} className={`valuation-case valuation-case-${key}`}><span>{key === "base" ? "Base case" : `${key[0].toUpperCase()}${key.slice(1)} case`}</span><strong>{value(output.cases[key].value)}</strong><small>{pct(output.cases[key].vsPrice)} vs observed price</small></article>)}
        </div>
      ) : <div className="valuation-refusal"><strong>No target shown</strong><p>Missing or disputed evidence is kept visible as a limitation; it is not converted into a zero or a generic recommendation.</p></div>}
      {(output.flags?.length || adjusted || stale) ? <div className="valuation-flags" aria-label="Valuation limitations">{stale && <span>Stale snapshot</span>}{adjusted && <span>Analyst adjustment pending review</span>}{output.flags?.map((flag) => <span key={flag}>{flag}</span>)}</div> : null}
      <details className="valuation-glass-box">
        <summary>Glass-box audit</summary>
        <dl>
          <div><dt>As of</dt><dd>{output.asOf}</dd></div>
          <div><dt>Model version</dt><dd>{output.modelVersion}</dd></div>
          <div><dt>Trace ID</dt><dd>{output.traceId}</dd></div>
          <div><dt>Confidence / data quality</dt><dd>{value(output.confidence)} / {value(output.dataQuality)}</dd></div>
          <div><dt>Method</dt><dd>{output.methods?.[0]?.id || "Facts-only"}</dd></div>
        </dl>
        <h3>Model assumptions</h3>
        <div className="valuation-assumption-grid"><span>Growth · {pct(output.cases.base?.g0)}</span><span>Margin · {pct(output.cases.base?.margin)}</span><span>Rate · {pct(output.cases.base?.rate)}</span><span>Terminal growth · {pct(output.cases.base?.gT)}</span></div>
        <h3>Source lineage</h3>
        {sources.length ? <ul>{sources.map((source, index) => <li key={`${source.metric}-${index}`}><strong>{source.metric}</strong> · {source.transformation || "Used as reported"}{source.asOf ? ` · ${source.asOf}` : ""}{source.tag ? <details><summary>Source detail</summary><code>{source.tag}</code>{source.sourceRef ? <span> · {source.sourceRef}</span> : null}</details> : null}</li>)}</ul> : <p>No eligible source rows were supplied for this snapshot.</p>}
      </details>
    </section>
  );
}

