"use client";
import { useEffect, useState } from "react";
import { useProduct } from "./Session";
import type { Research } from "@/lib/types";
import { latestFinancialEvidence, perspective } from "@/lib/analysis";
import {
  observedChanges,
  type ResearchObservation,
} from "@/lib/holdings-brief";
export default function ResearchChanges({
  research: r,
}: {
  research: Research;
}) {
  const { cache } = useProduct();
  const [changes, setChanges] = useState<string[]>([]);
  useEffect(() => {
    const latest = latestFinancialEvidence(r).latest,
      estimate = r.evidence?.estimates
        .filter(
          (e) =>
            e.date > r.retrievedAt.slice(0, 10) && e.frequency === "Annual",
        )
        .sort((a, b) => a.date.localeCompare(b.date))[0];
    const current: ResearchObservation = {
      price: r.quote.price,
      period: latest?.end ?? null,
      revenue: latest?.revenue ?? null,
      monthly: perspective(r).dca.confirmed?.multiplier ?? null,
      observedAt: r.retrievedAt,
      estimate,
    };
    const key = `observation:${r.company.symbol}`;
    const prior = cache.get(key)?.value as ResearchObservation | undefined;
    const list = observedChanges(prior ?? null, current);
    setChanges(list);
    cache.set(key, { at: Date.now(), value: current });
    if (list.length) {
      const feed = (cache.get("brief:changes")?.value ?? []) as {
        symbol: string;
        changes: string[];
        at: string;
      }[];
      cache.set("brief:changes", {
        at: Date.now(),
        value: [
          { symbol: r.company.symbol, changes: list, at: r.retrievedAt },
          ...feed.filter((x) => x.symbol !== r.company.symbol),
        ].slice(0, 12),
      });
    }
  }, [r, cache]);
  if (!changes.length) return null;
  return (
    <section className="observed-changes">
      <span className="eyebrow">
        Changed since an earlier observation this session
      </span>
      {changes.map((x) => (
        <p key={x}>{x}</p>
      ))}
      <small>
        Observed when reports refresh, not a complete point-in-time revision
        history.
      </small>
    </section>
  );
}
