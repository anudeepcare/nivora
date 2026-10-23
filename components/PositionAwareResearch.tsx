"use client";
import { useMemo } from "react";
import Link from "next/link";
import type { Research } from "@/lib/types";
import { positionContext } from "@/lib/position-context";
import { advancedStudies } from "@/lib/advanced-research";
import { amount, percent, dateLabel } from "@/lib/format";
import { useProduct } from "./Session";
import { useWorkspaceQuotes } from "./Workspace";
export default function PositionAwareResearch({
  research: r,
  compact = false,
}: {
  research: Research;
  compact?: boolean;
}) {
  const { workspace } = useProduct();
  if (
    !workspace?.positions.some(
      (p) => p.symbol === r.company.symbol && p.assetType !== "cash",
    )
  )
    return null;
  return <PositionEvidence research={r} compact={compact} />;
}
function PositionEvidence({
  research: r,
  compact = false,
}: {
  research: Research;
  compact?: boolean;
}) {
  const { workspace, demo } = useProduct(),
    quotes = useWorkspaceQuotes("portfolio"),
    q = Object.fromEntries(
      Object.entries(quotes.data ?? {}).flatMap(([symbol, row]) =>
        row.quote ? [[symbol, row.quote]] : [],
      ),
    );
  q[r.company.symbol] = r.quote;
  const gap = useMemo(
      () => advancedStudies(r.history, r.retrievedAt).largestGap,
      [r.history, r.retrievedAt],
    ),
    c = positionContext(workspace?.positions ?? [], q, r.company.symbol, gap);
  if (compact)
    return (
      <aside className="position-readout">
        <span>
          <b>Your position</b> · {c.quantity.toLocaleString()} units ·{" "}
          {c.value == null ? "USD pricing needed" : amount(c.value, "USD")}
        </span>
        <span>
          {c.weight == null
            ? "Exposure incomplete"
            : `${percent(c.weight)} of priced listed assets`}
          {r.quote.stale ? " · older price" : ""}
        </span>
        <Link href={`${demo && demo.routePrefix !== "" ? "/preview" : ""}/portfolio`}>
          Review exposure ↗
        </Link>
      </aside>
    );
  return (
    <aside
      className="position-aware"
      aria-label="Your holding in this research"
    >
      <div>
        <span className="eyebrow">
          YOUR POSITION · {c.quantity.toLocaleString()} UNITS
        </span>
        <h3>
          {c.weight == null
            ? "Pricing needed for exposure"
            : `${percent(c.weight)} of currently priced portfolio value`}
        </h3>
        <p>
          {c.value == null
            ? "A current USD quote is required."
            : `${amount(c.value, "USD")} · Quote ${dateLabel(r.quote.asOf)}`}
          {quotes.loading
            ? " · Remaining holdings are loading"
            : c.missing.length
              ? ` · ${c.missing.length} symbols excluded from the denominator`
              : ""}
        </p>
      </div>
      <div>
        <span>Observed-gap stress</span>
        <strong>
          {c.gapLoss == null ? "Not established" : amount(-c.gapLoss, "USD")}
        </strong>
        <small>
          Applies the largest observed absolute opening gap downward.
          Hypothetical, not a loss bound.
        </small>
      </div>
      <Link href={`${demo && demo.routePrefix !== "" ? "/preview" : ""}/portfolio`}>View holding →</Link>
    </aside>
  );
}
