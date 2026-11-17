"use client";
import { useProduct } from "./Session";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { useWorkspaceQuotes } from "./useWorkspaceQuotes";
import { portfolioTotals } from "@/lib/engine";
import { portfolioGuardrails } from "@/lib/portfolio-guardrails";
import { amount } from "@/lib/format";

export default function GuardrailReview({
  cashSpend,
  maximumLoss,
}: {
  cashSpend?: number | null;
  maximumLoss?: number | null;
}) {
  const { workspace, workspaceError } = useProduct();
  const { preferences } = useWorkspacePreferences();
  const rows = useWorkspaceQuotes("portfolio");
  const quotes = Object.fromEntries(
    Object.entries(rows.data).flatMap(([symbol, row]) =>
      row.quote ? [[symbol, row.quote]] : [],
    ),
  );
  const positions = workspace?.positions ?? [];
  const totals = portfolioTotals(positions, quotes);
  const cash = positions
    .filter(
      (p) =>
        p.assetType === "cash" &&
        p.symbol === "USD" &&
        p.currency === "USD" &&
        Number.isFinite(p.quantity) &&
        p.quantity > 0,
    )
    .reduce((sum, p) => sum + p.quantity, 0);
  const complete =
    !!workspace &&
    !workspaceError &&
    !rows.loading &&
    !totals.missing.length &&
    positions.every(
      (p) =>
        p.assetType === "cash" || (quotes[p.symbol] && !quotes[p.symbol].stale),
    );
  const review = portfolioGuardrails({
    portfolioValue: totals.knownValue,
    cash,
    complete,
    cashReservePercent: preferences.cashReservePercent,
    maxLossPercent: preferences.maxLossPercent,
    cashSpend,
    maximumLoss,
  });
  const cashRule =
    cashSpend !== undefined && preferences.cashReservePercent != null;
  const lossRule =
    maximumLoss !== undefined && preferences.maxLossPercent != null;
  if (!cashRule && !lossRule) return null;
  return (
    <aside className="notice" aria-label="Your portfolio guardrails">
      <strong>Your portfolio guardrails</strong>
      {!review.available ? (
        <p>
          Complete, non-stale USD portfolio prices are needed to check your
          saved limits.
        </p>
      ) : (
        <>
          {cashRule && (
            <p>
              {amount(review.reserve)} reserved; {amount(review.spendable)} of
              recorded cash remains available for this review.{" "}
              {review.reserveBreach === true
                ? "This proposed cash-funded addition exceeds the amount above your reserve."
                : review.reserveBreach === false
                  ? "This proposed addition stays within the recorded cash above your reserve."
                  : "Enter a proposed amount to check the reserve."}
            </p>
          )}
          {lossRule && (
            <p>
              Maximum loss budget: {amount(review.budget)}.{" "}
              {review.lossBreach === true
                ? "The modeled maximum loss exceeds your saved budget."
                : review.lossBreach === false
                  ? "The modeled maximum loss is within your saved budget."
                  : "A defined maximum loss is needed to check this rule."}
            </p>
          )}
        </>
      )}
      <small>
        Review only, not an order restriction. Recorded cash is not confirmed
        buying power. Fees, taxes, assignments and gaps can change realized
        loss.
      </small>
    </aside>
  );
}
