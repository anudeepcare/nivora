"use client";
import GuardrailReview from "./GuardrailReview";
import SearchableSelect from "./SearchableSelect";
import { useId, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { Research, Quote } from "@/lib/types";
import { aurynDecision } from "@/lib/auryn-decision";
import { paceEvidence } from "@/lib/pace-insights";
import { contributionAmount } from "@/lib/decision-tools";
import { positionFit } from "@/lib/position-fit";
import {
  providerIdentity,
  providerSymbol,
  sameProviderSymbol,
} from "@/lib/provider-symbol";
import { amount, percent, dateLabel } from "@/lib/format";
import { useProduct, useResource } from "./Session";
import { useWorkspaceQuotes } from "./useWorkspaceQuotes";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { Help } from "./Ui";
import s from "./ContributionCompare.module.css";
export default function ContributionCompare({
  symbols,
  prefix = "",
  defaultOpen = false,
}: {
  symbols: string[];
  prefix?: string;
  defaultOpen?: boolean;
}) {
  const { owner } = useProduct();
  const choices = useMemo(
    () =>
      Array.from(
        new Map(
          symbols.map((x) => [
            providerIdentity(providerSymbol(x)),
            providerSymbol(x),
          ]),
        ).values(),
      ),
    [symbols],
  );
  return (
    <Workbench
      key={owner}
      choices={choices}
      prefix={prefix}
      defaultOpen={defaultOpen}
    />
  );
}
function Workbench({
  choices,
  prefix,
  defaultOpen,
}: {
  choices: string[];
  prefix: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen),
    [selection, setSelection] = useState<string[]>([]),
    [addition, setAddition] = useState("");
  const contentId = useId();
  const selected = selection.length ? selection : choices.slice(0, 3);
  return (
    <section className={s.root} aria-label="Compare your next contribution">
      <button
        className={s.toggle}
        type="button"
        aria-controls={contentId}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>
          {open
            ? "Close contribution comparison"
            : "Compare contribution choices"}
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && (
        <div className={s.content} id={contentId}>
          {choices.length ? (
            <>
              <div className={s.controls}>
                {[0, 1, 2].map((i) => (
                  <SearchableSelect
                    key={i}
                    label={`Company ${i + 1}`}
                    value={selected[i] ?? ""}
                    placeholder="Choose a company"
                    options={choices
                      .filter((x) => x === selected[i] || !selected.includes(x))
                      .map((x) => ({ value: x, label: x }))}
                    onChange={(value) => {
                      const next = [...selected];
                      next[i] = value;
                      setSelection(next);
                    }}
                  />
                ))}
                <label>
                  Possible addition (USD)
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="1000000000"
                    value={addition}
                    placeholder="Optional"
                    onChange={(e) => setAddition(e.target.value)}
                  />
                </label>
              </div>
              {contributionAmount(addition) === null && (
                <p role="alert">
                  Enter an addition from 0 to 1,000,000,000 USD.
                </p>
              )}
              <div className={s.grid}>
                {selected
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((symbol) => (
                    <Candidate
                      key={symbol}
                      symbol={symbol}
                      addition={contributionAmount(addition)}
                      prefix={prefix}
                    />
                  ))}
              </div>
              <p className={s.note}>
                Each column considers the same addition independently. This is a
                comparison, not an allocation or trade order. No combined score
                hides disagreements. Only selected companies are loaded.
              </p>
            </>
          ) : (
            <p>
              Save companies to your watchlist to compare them here.{" "}
              <Link href={`${prefix}/research`}>Find a company →</Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
function Candidate({
  symbol,
  addition,
  prefix,
}: {
  symbol: string;
  addition: number | null;
  prefix: string;
}) {
  const product = useProduct(),
    { workspace, demo } = product;
  const resource = useResource<Research>(
    `research/${encodeURIComponent(symbol.replace("/", "-"))}`,
    demo?.research[symbol],
  );
  const quoteRows = useWorkspaceQuotes("portfolio");
  const { preferences } = useWorkspacePreferences();
  const r = resource.data;
  const now = demo && r ? Date.parse(r.retrievedAt) : Date.now();
  const owns = !!workspace?.positions.some(
    (p) => p.quantity > 0 && sameProviderSymbol(p.symbol, symbol),
  );
  const d = useMemo(
    () => (r ? aurynDecision(r, { ownsPosition: owns, now }) : null),
    [r, owns, now],
  );
  const pace = useMemo(
    () =>
      r
        ? paceEvidence(
            r.history,
            new Date(now).toISOString(),
            "confirmed",
            r.company.assetType === "crypto" ? "crypto" : "us-equity",
          )
        : null,
    [r, now],
  );
  const quotes = Object.fromEntries(
    Object.entries(quoteRows.data).flatMap(([s, row]) =>
      row.quote ? [[s, row.quote]] : [],
    ),
  ) as Record<string, Quote>;
  if (r) quotes[symbol] = r.quote;
  const fit = positionFit(
    workspace?.positions ?? [],
    quotes,
    symbol,
    preferences.concentrationLimit,
    addition ?? 0,
    now,
  );
  const quoteAt = Date.parse(r?.quote.asOf ?? "");
  const priceReady =
    !!r &&
    !r.quote.stale &&
    r.quote.price != null &&
    r.quote.price > 0 &&
    Number.isFinite(quoteAt) &&
    quoteAt <= now + 60000 &&
    now - quoteAt <= 4 * 86400000 &&
    r.quote.currency === "USD";
  return (
    <article>
      <h3>{symbol}</h3>
      {resource.loading ? (
        <p role="status">Loading dated research…</p>
      ) : resource.error ? (
        <p role="alert">
          Research could not load.{" "}
          <Link href={`${prefix}/research/${encodeURIComponent(symbol)}`}>
            Open research
          </Link>
        </p>
      ) : r && d ? (
        <>
          <p>{r.company.name}</p>
          <GuardrailReview cashSpend={addition} />
          <dl>
            <div>
              <dt>Current assessment</dt>
              <dd>{d.actionLabel}</dd>
            </div>
            <div>
              <dt>Current eligible Pace</dt>
              <dd>
                {d.pace.eligibleLevel == null
                  ? "Unavailable"
                  : `P${d.pace.eligibleLevel}`}
              </dd>
            </div>
            <div>
              <dt>
                Business{" "}
                <Help label="Business comparison">
                  <p>
                    Uses existing AURYN financial qualification rules.
                    Developing or missing evidence is shown separately from weak
                    evidence.
                  </p>
                </Help>
              </dt>
              <dd>
                {d.business === "strong"
                  ? "Supported"
                  : d.business === "weak"
                    ? "Concerns"
                    : d.business === "missing"
                      ? "Incomplete"
                      : "Developing"}
              </dd>
            </div>
            <div>
              <dt>
                Completed Pace{" "}
                <Help label="Pace comparison">
                  <p>
                    Price-based completed monthly zone. It does not override
                    business risks or establish fair value. P0 Pause, P1
                    Watch/Hold, P2 Start small, P3 Add gradually, P4 Highest
                    planned accumulation within limits.
                  </p>
                </Help>
              </dt>
              <dd>
                {pace?.confirmed ? `P${pace.confirmed.multiplier}` : "Pending"}
              </dd>
            </div>
            <div>
              <dt>Valuation</dt>
              <dd>
                {d.value === "unassessed"
                  ? "Needs assumptions"
                  : d.value === "expensive"
                    ? "Demanding"
                    : d.value === "fair"
                      ? "Within model range"
                      : "Attractive"}
              </dd>
            </div>
            <div>
              <dt>Position weight</dt>
              <dd>
                {fit.complete
                  ? percent(fit.currentWeight)
                  : "Incomplete quotes"}
              </dd>
            </div>
            {addition != null && addition > 0 && (
              <div>
                <dt>After adding {amount(addition, "USD")}</dt>
                <dd>
                  {priceReady && fit.complete
                    ? percent(fit.afterWeight)
                    : "Check quote coverage"}
                </dd>
              </div>
            )}
          </dl>
          {(fit.atLimit || !priceReady) && (
            <p className={s.reason}>
              {fit.atLimit
                ? "Your chosen position threshold is reached."
                : "A recent USD quote is needed before considering an addition."}
            </p>
          )}
          <details className={s.evidenceDetails}>
            <summary>Evidence and limitations</summary>
            <p>{d.explanation.detail}</p>
            <p>
              The completed monthly reading is historical. Current eligible Pace
              and the business assessment can differ; a deeper historical zone
              is not an instruction to add.
            </p>
          </details>
          {addition != null &&
            addition > 0 &&
            fit.limit != null &&
            fit.afterWeight != null &&
            fit.afterWeight > fit.limit && (
              <p className={s.reason}>
                This addition would exceed your {fit.limit}% position threshold.
              </p>
            )}
          <footer className={s.footer}>
            <small>
              Financial period {dateLabel(d.period)} · quote{" "}
              {dateLabel(r.quote.asOf)}
            </small>
            <Link href={`${prefix}/research/${encodeURIComponent(symbol)}`}>
              Review the evidence →
            </Link>
          </footer>
        </>
      ) : (
        <p>Research unavailable in this preview.</p>
      )}
    </article>
  );
}
