"use client";
import { useId, useMemo, useState } from "react";
import type { Research } from "@/lib/types";
import { researchDecision } from "@/lib/decision-research";
import { crystalFacets } from "@/lib/evidence-crystal";
import { amount, percent } from "@/lib/format";
import s from "./EvidenceCrystal.module.css";
export default function EvidenceCrystal({
  research,
  onOpen,
}: {
  research: Research;
  onOpen: () => void;
}) {
  const model = useMemo(
    () => researchDecision(research, "Balanced"),
    [research],
  );
  const [selected, setSelected] = useState(0);
  const lens = model.lenses[selected];
  const facets = crystalFacets(model.lenses.map((x) => x.score));
  const id = useId().replace(/:/g, "");
  return (
    <section className={s.root} aria-label="Explore the evidence crystal">
      <header>
        <span>THE EVIDENCE CRYSTAL</span>
        <small>{model.scoredLenses} of 8 lenses measured</small>
      </header>
      <div className={s.stage}>
        <svg
          viewBox="0 0 320 320"
          role="img"
          aria-label="Eight evidence facets. Longer points mean higher measured lens scores; striped facets are unscored."
        >
          <defs>
            <radialGradient id={`${id}-glow`}>
              <stop stopColor="#bbed9350" />
              <stop offset="1" stopColor="#81cbb000" />
            </radialGradient>
            <linearGradient id={`${id}-facet`} x2="1" y2="1">
              <stop stopColor="#e2fa91" />
              <stop offset=".5" stopColor="#68cbb0" />
              <stop offset="1" stopColor="#286f77" />
            </linearGradient>
            <pattern
              id={`${id}-frost`}
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(35)"
            >
              <rect width="7" height="7" fill="#819d9625" />
              <path d="M0 0V7" stroke="#b7d4ca55" strokeWidth="2" />
            </pattern>
          </defs>
          <circle cx="160" cy="160" r="155" fill={`url(#${id}-glow)`} />
          {[66, 101, 136].map((radius) => (
            <circle
              key={radius}
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="currentColor"
              opacity=".08"
              strokeDasharray="2 8"
            />
          ))}
          {facets.map((f, i) => (
            <polygon
              key={i}
              points={f.points.map((p) => p.join(",")).join(" ")}
              fill={`url(#${id}-${f.measured ? "facet" : "frost"})`}
              fillOpacity={i === selected ? 1 : 0.32 + (i % 3) * 0.15}
              stroke={i === selected ? "#efffc9" : "#aed0bc"}
              strokeOpacity={i === selected ? 0.9 : 0.2}
              strokeWidth={i === selected ? 2 : 1}
            />
          ))}
          <path
            d="M160 117 191 160 160 202 130 160Z"
            fill="#e5ffa9"
            fillOpacity=".3"
            stroke="#e8ffc2"
            strokeOpacity=".4"
          />
        </svg>
        <div className={s.lenses} aria-label="Choose an evidence lens">
          {model.lenses.map((x, i) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              <span>{x.name}</span>
              <strong>
                {x.score === null ? "Unscored" : `${x.score.toFixed(1)}/10`}
              </strong>
            </button>
          ))}
        </div>
      </div>
      <div className={s.detail} aria-live="polite">
        <h3>
          {lens.name}
          <span>
            {lens.score === null ? "Unscored" : `${lens.score.toFixed(1)}/10`}
          </span>
        </h3>
        <p>{lens.note}</p>
        <dl>
          {lens.metrics
            .filter((x) => x.value !== null)
            .slice(0, 2)
            .map((x) => (
              <div key={x.id}>
                <dt>{x.label}</dt>
                <dd>
                  {x.unit === "money"
                    ? amount(x.value, model.currency, true)
                    : x.unit === "percent"
                      ? percent(x.value)
                      : `${x.value!.toFixed(1)}${x.unit === "ratio" ? "×" : x.unit === "days" ? " days" : ""}`}
                </dd>
              </div>
            ))}
        </dl>
        <button type="button" onClick={onOpen}>
          Inspect all evidence →
        </button>
      </div>
      <footer>
        Shape shows measured evidence, not a forecast. Select a lens to read its
        inputs.
      </footer>
    </section>
  );
}
