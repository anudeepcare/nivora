"use client";
import { useState } from "react";
import Link from "next/link";
import { monthlyAllocation, usdCents } from "@/lib/monthly-allocation";
import { providerIdentity } from "@/lib/provider-symbol";
import type { Quote } from "@/lib/types";
import { useProduct } from "./Session";
import { useWorkspaceQuotes } from "./Workspace";
import s from "./MonthlyPlan.module.css";
const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
const weight = (value: number | null) =>
  value == null ? "—" : `${value.toFixed(2)}%`;
export default function MonthlyPlan() {
  const { workspace, workspaceError, demo, owner } = useProduct();
  const quotes = useWorkspaceQuotes();
  const [budget, setBudget] = useState("1000");
  const [cap, setCap] = useState("20");
  const [reason, setReason] = useState("");
  const [selection, setSelection] = useState<{
    owner: string;
    symbols: string[];
  } | null>(null);
  const options = [
    ...new Set([
      ...(workspace?.positions ?? [])
        .filter((p) => p.assetType !== "cash")
        .map((p) => providerIdentity(p.symbol)),
      ...(workspace?.watchlist ?? []).map((p) => providerIdentity(p.symbol)),
    ]),
  ].sort();
  const selected =
    selection?.owner === owner
      ? selection.symbols.filter((symbol) => options.includes(symbol))
      : [
          ...new Set(
            (workspace?.positions ?? [])
              .filter((p) => p.assetType !== "cash")
              .map((p) => providerIdentity(p.symbol)),
          ),
        ]
          .sort()
          .slice(0, 30);
  const quoteData = Object.fromEntries(
    // Demo quotes must use the same historical clock as demo research. The
    // live hook applies today's quote health and would stale every sample.
    Object.entries(demo?.research ?? quotes.data).flatMap(([symbol, row]) =>
      row.quote ? [[symbol, row.quote]] : [],
    ),
  ) as Record<string, Quote>;
  const demoDates = Object.values(demo?.research ?? {})
    .map((r) => Date.parse(r.retrievedAt))
    .filter(Number.isFinite);
  const result = monthlyAllocation({
    positions: workspace?.positions ?? [],
    quotes: quoteData,
    candidates: selected,
    budgetCents: usdCents(budget) ?? 0,
    capPercent: Number(cap),
    now: demoDates.length ? Math.max(...demoDates) : Date.now(),
  });
  const available = !!workspace && !workspaceError && result.complete;
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <main className={s.page}>
      <p>Your monthly research routine</p>
      <h1>Plan a contribution around your holdings.</h1>
      <p>
        Choose companies and a position cap. This draft directs new money toward
        the smallest selected holdings, aiming for equal final dollar values
        within your cap. Pace does not set allocations or establish that this
        approach outperforms alternatives.
      </p>
      {demo && (
        <p className={s.notice}>
          Illustration using sample holdings and quotes at the sample research
          date.
        </p>
      )}
      <div className={s.inputs}>
        <label>
          Deployable contribution · USD
          <input
            type="text"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-describedby="budget-help"
          />
        </label>
        <label>
          Maximum position weight · %
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="100"
            step="1"
            value={cap}
            onChange={(e) => setCap(e.target.value)}
          />
        </label>
      </div>
      <p id="budget-help">
        Enter money you have available without borrowing. Existing cash holdings
        are excluded so this contribution is not counted twice. The cap uses
        your priced investments plus the whole contribution, including any
        retained new cash.
      </p>
      <fieldset className={s.candidates}>
        <legend>Choose from your holdings and watchlist · up to 30</legend>
        {options.length ? (
          options.map((symbol) => (
            <label key={symbol}>
              <input
                type="checkbox"
                checked={selected.includes(symbol)}
                disabled={!selected.includes(symbol) && selected.length >= 30}
                onChange={(e) =>
                  setSelection({
                    owner,
                    symbols: e.target.checked
                      ? [...selected, symbol]
                      : selected.filter((x) => x !== symbol),
                  })
                }
              />
              <span>{symbol}</span>
            </label>
          ))
        ) : (
          <p>
            Add companies to your{" "}
            <Link href={`${prefix}/watchlist`}>watchlist</Link> or{" "}
            <Link href={`${prefix}/portfolio`}>holdings</Link> to begin.
          </p>
        )}
      </fieldset>
      <button type="button" onClick={quotes.refresh} disabled={quotes.loading}>
        {quotes.loading ? "Refreshing prices…" : "Refresh prices"}
      </button>
      {!available ? (
        <section className={s.notice} role="status">
          <h2>Draft is waiting for complete inputs</h2>
          <p>
            {workspaceError ||
              (!workspace
                ? "Loading your saved holdings…"
                : result.retainedReason)}
          </p>
          <ul>
            {result.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className={s.summary} aria-live="polite">
            <div>
              <span>Current investments</span>
              <strong>{money(result.totalCents!)}</strong>
            </div>
            <div>
              <span>Draft contribution allocated</span>
              <strong>
                {money((usdCents(budget) ?? 0) - result.retainedCents!)}
              </strong>
            </div>
            <div>
              <span>Contribution retained as cash</span>
              <strong>{money(result.retainedCents!)}</strong>
            </div>
          </section>
          <p>{result.retainedReason}</p>
          <p>
            Current weights use priced investments only. After weights also
            include your new cash. Existing positions already above the cap are
            left unchanged; this draft never sells or borrows. Quotes must be
            non-stale USD observations no older than four days.
          </p>
          <ul className={s.rows}>
            {result.rows.map((row) => (
              <li key={row.symbol}>
                <h2>
                  <Link
                    href={`${prefix}/research/${encodeURIComponent(row.symbol)}?tab=Thesis`}
                  >
                    {row.symbol}
                  </Link>
                </h2>
                <dl>
                  <div>
                    <dt>Current value</dt>
                    <dd>{money(row.currentCents)}</dd>
                  </div>
                  <div>
                    <dt>Draft addition</dt>
                    <dd>{money(row.contributionCents)}</dd>
                  </div>
                  <div>
                    <dt>Current weight</dt>
                    <dd>{weight(row.currentWeight)}</dd>
                  </div>
                  <div>
                    <dt>After weight</dt>
                    <dd>{weight(row.afterWeight)}</dd>
                  </div>
                </dl>
                <p>{row.reason}</p>
              </li>
            ))}
          </ul>
        </>
      )}
      <label className={s.notes}>
        Why these companies? What would change your mind?
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <p>
        Dollar targets assume fractional amounts and exclude fees, taxes and
        market movement. Review each thesis and your cash before acting. Nothing
        is ordered or saved to your account.
      </p>
      {available && (
        <button
          type="button"
          onClick={() => {
            const blob = new Blob(
              [
                JSON.stringify(
                  {
                    kind: "holdings-aware-research-draft",
                    createdAt: new Date().toISOString(),
                    currency: "USD",
                    budgetCents: usdCents(budget),
                    capPercent: Number(cap),
                    method:
                      "Equal final dollar targets for user-selected positions; cap denominator includes retained contribution cash and excludes existing cash. Not a recommendation.",
                    sampleData: !!demo,
                    reason,
                    result,
                  },
                  null,
                  2,
                ),
              ],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "auryn-monthly-research-plan.json";
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Download my draft
        </button>
      )}
    </main>
  );
}
