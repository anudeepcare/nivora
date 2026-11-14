"use client";
import { useEffect, useState, useRef } from "react";
import type { Research } from "@/lib/types";
import {
  parseVisitSnapshot,
  researchVisitSnapshot,
  researchChanges,
  retainVisitSnapshot,
  type ResearchChange,
  type VisitSnapshot,
} from "@/lib/research-changes";
import { dateLabel } from "@/lib/format";
import styles from "./ResearchChanges.module.css";
export default function ResearchChanges({
  research,
  pace,
  now,
  onOpen,
}: {
  research: Research;
  pace: VisitSnapshot["pace"];
  now: number;
  onOpen: (tab: "Technicals" | "Analysts") => void;
}) {
  const [visit, setVisit] = useState<{
    symbol: string;
    date: string;
    changes: ResearchChange[];
  } | null>(null);
  const captured = useRef<{
    symbol: string;
    baseline: VisitSnapshot | null;
  } | null>(null);
  useEffect(() => {
    const key = `auryn:research-visit:v1:${research.company.symbol}`;
    try {
      if (captured.current?.symbol !== research.company.symbol) {
        const stored = parseVisitSnapshot(localStorage.getItem(key), now);
        captured.current = {
          symbol: research.company.symbol,
          baseline:
            stored && now - Date.parse(stored.seenAt) >= 15 * 60000
              ? stored
              : null,
        };
      }
      const previous = captured.current.baseline;
      const next = researchVisitSnapshot(research, pace, now);
      const changes = previous ? researchChanges(previous, next) : [];
      setVisit(
        previous && changes.length
          ? { symbol: next.symbol, date: previous.seenAt, changes }
          : null,
      );
      const storedData = parseVisitSnapshot(localStorage.getItem(key), now);
      const latest = retainVisitSnapshot(storedData, next);
      if (latest.price || latest.pace)
        localStorage.setItem(key, JSON.stringify(latest));
    } catch {
      /* Private browsing/storage limits do not block research. */
    }
  }, [research, pace, now]);
  if (!visit || visit.symbol !== research.company.symbol) return null;
  return (
    <aside className={styles.root} aria-label="Changes since your last visit">
      <header>
        <strong>Since you last checked</strong>
        <small>{dateLabel(visit.date)} · this device</small>
      </header>
      <div>
        {visit.changes.map((change) => (
          <button
            type="button"
            key={change.label}
            onClick={() => onOpen(change.destination)}
          >
            <span>{change.label}</span>
            <strong>{change.detail}</strong>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
