"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Research } from "@/lib/types";
import { researchDecision } from "@/lib/decision-research";
import { percent } from "@/lib/format";
import { api } from "@/lib/client";
import { useProduct } from "./Session";
export default function DecisionWatch({ research: r }: { research: Research }) {
  const d = useMemo(() => researchDecision(r), [r]),
    { demo } = useProduct(),
    [busy, setBusy] = useState(""),
    [saved, setSaved] = useState<string[]>([]),
    [message, setMessage] = useState("");
  if (!d.tripwires.length) return null;
  async function enable(id: string, threshold: number, label: string) {
    setBusy(id);
    setMessage("");
    try {
      if (demo) throw Error("Sign in to save alerts.");
      const types: Record<string, string> = {
        current: "current-below",
        interest: "interest-below",
        sbc: "sbc-above",
        margin: "margin-below",
      };
      await api("documents", {
        kind: "alert",
        key: `research-${r.company.symbol}-${id}`,
        body: {
          symbol: r.company.symbol,
          type: types[id],
          threshold,
          enabled: true,
          name: label,
        },
      });
      setSaved((old) => [...new Set([...old, id])]);
      setMessage(
        "Alert rule saved. Open Alerts to check evidence; financial alerts establish a baseline before reporting a new crossing.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save alert.");
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="decision-watch">
      <header className="section-head">
        <div>
          <span className="eyebrow">Keep the thesis honest</span>
          <h3>What would change the view?</h3>
          <p>
            Current reported evidence
            {d.period ? ` · period ending ${d.period}` : ""}. Save a threshold
            alert; checks run when you request them or when scheduled checks are enabled.
          </p>
        </div>
        <Link href={`${demo && demo.routePrefix !== "" ? "/preview" : ""}/alerts`}>Manage alerts →</Link>
      </header>
      <div>
        {d.tripwires.map((t) => (
          <section
            key={t.id}
            data-state={
              t.breached
                ? "breached"
                : t.headroom != null && t.headroom < 20
                  ? "close"
                  : "clear"
            }
          >
            <span>{t.label}</span>
            <strong>
              {t.value.toFixed(1)}
              {t.unit === "percent" ? "%" : "×"}
            </strong>
            <small>
              Review {t.direction} {t.threshold}
              {t.unit === "percent" ? "%" : "×"}
            </small>
            <b>{t.breached ? "Review now" : "Within this threshold"}</b>
            <button
              className="text-button"
              disabled={!!busy || saved.includes(t.id)}
              onClick={() => enable(t.id, t.threshold, t.label)}
            >
              {busy === t.id
                ? "Saving…"
                : saved.includes(t.id)
                  ? "Alert saved"
                  : "Enable alert"}
            </button>
          </section>
        ))}
      </div>
      {message && (
        <p role="status" className="context-note">
          {message}
        </p>
      )}
    </section>
  );
}
