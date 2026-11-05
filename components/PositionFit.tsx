"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Research, Quote } from "@/lib/types";
import { positionFit } from "@/lib/position-fit";
import { useProduct } from "./Session";
import { useWorkspaceQuotes } from "./Workspace";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { percent, amount } from "@/lib/format";
import s from "./PositionFit.module.css";
export default function PositionFit({ research: r }: { research: Research }) {
  const { workspace, demo } = useProduct();
  const q = useWorkspaceQuotes("portfolio");
  const { preferences } = useWorkspacePreferences();
  const [addition, setAddition] = useState("");
  useEffect(() => setAddition(""), [r.company.symbol, workspace?.email]);
  const quotes = Object.fromEntries(
    Object.entries(q.data).flatMap(([key, row]) =>
      row.quote ? [[key, row.quote]] : [],
    ),
  ) as Record<string, Quote>;
  quotes[r.company.symbol] = r.quote;
  const x = positionFit(
    workspace?.positions ?? [],
    quotes,
    r.company.symbol,
    preferences.concentrationLimit,
    Number(addition),
    demo ? Date.parse(r.retrievedAt) : Date.now(),
  );
  if (!workspace?.positions.length || r.quote.currency !== "USD") return null;
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <section className={s.fit} aria-label="Position fit">
      <div>
        <span className="eyebrow">YOUR PORTFOLIO</span>
        <h3>
          {x.atLimit
            ? "Your chosen position threshold is reached"
            : "Before you add"}
        </h3>
        <p>
          {x.complete
            ? `${r.company.symbol} is ${percent(x.currentWeight)} of your priced investments. ${x.limit == null ? "No position attention threshold is set." : `Your attention threshold is ${x.limit}%.`}`
            : "Complete, recent USD quotes are needed before assessing position weight."}
        </p>
      </div>
      <details>
        <summary>Explore a possible addition</summary>
        <label>
          Additional cash (USD, optional)
          <input
            type="number"
            min="0"
            step="100"
            value={addition}
            onChange={(e) => setAddition(e.target.value)}
            placeholder="Enter an amount"
          />
        </label>
        {addition && x.complete && Number(addition) >= 0 && (
          <p>
            Adding {amount(Number(addition), "USD")} from new cash would make
            this position <strong>{percent(x.afterWeight)}</strong> of priced
            investments.
            {x.limit != null && x.afterWeight! > x.limit
              ? " This exceeds your chosen threshold."
              : ""}
          </p>
        )}
        <small>
          Illustration at observed prices. Assumes new external cash; excludes
          cash holdings, fees, taxes and price movement. This does not place a
          trade or change Pace.
        </small>
        <Link href={`${prefix}/settings`}>
          Manage your position threshold →
        </Link>
      </details>
    </section>
  );
}
