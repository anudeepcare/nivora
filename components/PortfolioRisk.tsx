"use client";

type Risk = { coverage: number; concentration: number; var_95: number; expected_shortfall_95: number; scenario_contribution: Record<string, number>; flags?: string[] };
const pct = (value: number | null | undefined) => typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—";

export default function PortfolioRisk({ risk }: { risk: Risk }) {
  return <section className="portfolio-risk" aria-label="Portfolio risk">
    <header><div><span className="eyebrow">Portfolio lens</span><h2>Risk concentration</h2></div>{risk.coverage < 1 ? <span className="risk-partial">Partial coverage</span> : <span className="risk-complete">Full coverage</span>}</header>
    <div className="portfolio-risk-grid"><article><span>Concentration</span><strong>{pct(risk.concentration)}</strong></article><article><span>VaR · 95%</span><strong>{pct(risk.var_95)}</strong></article><article><span>Expected shortfall</span><strong>{pct(risk.expected_shortfall_95)}</strong></article></div>
    <div className="portfolio-risk-scenarios"><span>Scenario contribution</span>{["bear", "base", "bull"].map((key) => <div key={key}><span>{key[0].toUpperCase() + key.slice(1)} case</span><strong>{pct(risk.scenario_contribution[key])}</strong></div>)}</div>
    {risk.flags?.length ? <p className="context-note">{risk.flags.join(" · ")}</p> : null}
  </section>;
}

