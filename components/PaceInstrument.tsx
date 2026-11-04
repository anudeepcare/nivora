"use client";
import { useState } from "react";
import { ArrowRight, Diamond, Info, ShieldCheck } from "lucide-react";
import {
  PACE_DESCRIPTIONS,
  PACE_EXPLANATION,
  type pacePeriods,
  type pacePresentation,
} from "@/lib/pace-presentation";
import { instrumentReading } from "@/lib/pace-instrument";
import s from "./PaceInstrument.module.css";
const names = [
  "Pause",
  "Watch / hold",
  "Start small",
  "Add gradually",
  "Within your limits",
];
const short = ["Pause", "Watch", "Initial", "Gradual", "Deep"];
type Props = {
  view?: ReturnType<typeof pacePresentation>;
  readings?: ReturnType<typeof pacePeriods>;
  publicGuide?: boolean;
  compact?: boolean;
  onHistory?: () => void;
};
export default function PaceInstrument({
  view,
  readings = [],
  publicGuide = false,
  compact = false,
  onHistory,
}: Props) {
  const [period, setPeriod] = useState("confirmed");
  const [inspect, setInspect] = useState<number | null>(publicGuide ? 2 : null);
  const [help, setHelp] = useState(false);
  const reading = instrumentReading(readings, period),
    selected = inspect ?? reading.level;
  const exploring = publicGuide || inspect !== null;
  return (
    <section
      className={`${s.instrument} ${compact ? s.compact : ""}`}
      aria-label={
        publicGuide ? "Explore the AURYN Pace framework" : "AURYN Pace"
      }
    >
      <header className={s.header}>
        <span>
          <Diamond size={15} fill="currentColor" /> AURYN PACE
        </span>
        <button
          type="button"
          aria-label="What does Pace mean?"
          aria-expanded={help}
          onClick={() => setHelp(!help)}
        >
          <Info size={19} />
        </button>
      </header>
      <div className={s.title}>
        <small>
          {exploring ? "Explore the framework" : "Your contribution context"}
        </small>
        <h2>
          {exploring && selected !== null
            ? names[selected]
            : period === "forming"
              ? "Developing price zone"
              : view?.actionLabel || "Awaiting evidence"}
          <span>.</span>
        </h2>
      </div>
      <div className={s.terraces}>
        <svg viewBox="0 0 520 285" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((z) => {
            const x = 20 + z * 50,
              y = 252 - z * 45,
              w = 230;
            return (
              <g key={z} data-active={selected === z}>
                <path
                  className={s.shadow}
                  d={`M${x + 9},${y + 12}h${w}l38,-24h-${w}z`}
                />
                <path className={s.edge} d={`M${x},${y}h${w}v9h-${w}z`} />
                <path
                  className={s.side}
                  d={`M${x + w},${y}l38,-25v9l-38,25z`}
                />
                <path className={s.slab} d={`M${x},${y}h${w}l38,-25h-${w}z`} />
              </g>
            );
          })}
        </svg>
        {short.map((name, z) => (
          <button
            key={name}
            type="button"
            className={s.stage}
            style={{
              left: `${((20 + z * 50 + 72) / 520) * 100}%`,
              top: `${((252 - z * 45 - 27) / 285) * 100}%`,
            }}
            aria-pressed={selected === z}
            aria-label={`Explore P${z}: ${names[z]}`}
            onClick={() => setInspect(z)}
          >
            <span>
              {selected === z && <Diamond size={11} fill="currentColor" />}
              {name}
            </span>
            <small>P{z}</small>
          </button>
        ))}
      </div>
      <div className={s.status}>
        <span>
          <Diamond
            size={12}
            fill={period === "forming" ? "none" : "currentColor"}
          />
          {exploring
            ? "Framework · P" + selected
            : reading.level == null
              ? reading.status
              : `P${reading.level} · ${reading.status}`}
        </span>
        {!publicGuide && inspect !== null ? (
          <button onClick={() => setInspect(null)}>
            Back to reading <ArrowRight size={13} />
          </button>
        ) : (
          <small>{publicGuide ? "Tap a step to explore" : reading.date}</small>
        )}
      </div>
      <p className={s.description}>
        {exploring && selected !== null
          ? PACE_DESCRIPTIONS[selected]
          : period === "forming"
            ? "The current-period price zone can change. Use the completed period alongside business checks and your position limits."
            : view?.detail ||
              "A completed price reading is needed. Review business evidence in the meantime."}
      </p>
      {!publicGuide && (
        <div className={s.periods} aria-label="Pace reading period">
          {["confirmed", "forming"].map((p) => (
            <button
              key={p}
              aria-pressed={period === p && inspect === null}
              onClick={() => {
                setPeriod(p);
                setInspect(null);
              }}
            >
              {p === "confirmed" ? "Completed period" : "Current · forming"}
            </button>
          ))}
        </div>
      )}
      {help && <p className={s.help}>{PACE_EXPLANATION}</p>}
      <footer className={s.footer}>
        <span>
          <ShieldCheck size={15} />
          {publicGuide
            ? "Price context. Business checks first. Zones are not predicted returns."
            : view?.permitted
              ? "Keep within your cash and position limits"
              : "Business and risk checks take priority"}
        </span>
        {onHistory && (
          <button onClick={onHistory}>
            Evidence & history <ArrowRight size={15} />
          </button>
        )}
      </footer>
    </section>
  );
}
