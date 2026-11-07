"use client";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import SectionIcon from "./SectionIcon";
import { useWorkspacePace } from "./WorkspacePace";

import type { AccountBalances as Balances } from "@/lib/account-balances";
import { workspaceOverview } from "@/lib/approved-workspace";
import { workspaceGuidance } from "@/lib/edge-research";
import { amount, percent } from "@/lib/format";
import type { HomeFeed } from "@/lib/home-feed";
import type { Research } from "@/lib/types";
import { Activity, ArrowUpRight, Bookmark, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useProduct, useResource } from "./Session";
import { Help } from "./Ui";
import { useWorkspaceQuotes } from "./useWorkspaceQuotes";
import visual from "./WorkspacePrimitives.module.css";

export const colors = [
  "#76b6aa",
  "#b6ce58",
  "#68ae94",
  "#638a99",
  "#d28b78",
  "#7b8a85",
];
export const previewBalances = { balances: null };
export const emptyFeed: HomeFeed = {
  events: [],
  news: [],
  issues: [],
  retrievedAt: "",
  followed: 0,
  newsFollowed: 0,
  eventsReady: true,
  newsReady: true,
};

export function Heading({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className={visual.heading}>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function SectionHead({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className={visual.sectionHead}>
      <div>
        <h2>
          <SectionIcon name={title} />
          {title}
        </h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function Metric({
  label,
  value,
  note,
  tone = "",
}: {
  label: string;
  value: ReactNode;
  note: ReactNode;
  tone?: string;
}) {
  const kind = /return|gain|performance/i.test(label)
    ? "return"
    : /watch|idea/i.test(label)
      ? "ideas"
      : "value";
  const Icon =
    kind === "return" ? Activity : kind === "ideas" ? Bookmark : Wallet;
  return (
    <div
      className={visual.metric}
      data-kind={kind}
      data-tone={tone || undefined}
    >
      <span>
        <Icon aria-hidden="true" />
        <Help label={label} trigger={label}>
          <p>{note}</p>
          <p>
            {kind === "return"
              ? "Unrealized change compares available position prices with recorded cost. It excludes realized trades, dividends, fees and taxes."
              : kind === "ideas"
                ? "Companies saved to your watchlist for further research. Saving a company does not create a holding."
                : label === "Margin used"
                  ? "Recorded borrowing is subtracted from portfolio net value. This is not available buying power."
                  : label === "Cash & managed"
                    ? "Recorded cash and separately managed balances. These are entered balances, not live bank balances."
                    : "Available investment values plus recorded cash and managed balances, less recorded margin. Missing prices and currency mismatches can make this total incomplete."}
          </p>
        </Help>
      </span>
      <strong className={tone}>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
export function useWorkspaceData(
  scope: "all" | "portfolio" | "watchlist" = "all",
) {
  const product = useProduct(),
    quotes = useWorkspaceQuotes(scope);
  const balances = useResource<{ balances: Balances | null }>(
    scope === "watchlist" ? null : "account-balances",
    product.demo ? previewBalances : undefined,
  );
  const prefix =
    product.demo && product.demo.routePrefix !== "" ? "/preview" : "";
  const paceScan = useWorkspacePace([
    ...(scope === "watchlist"
      ? []
      : (product.workspace?.positions ?? [])
          .filter((p) => p.assetType === "stock")
          .map((p) => p.symbol)),
    ...(scope === "portfolio"
      ? []
      : (product.workspace?.watchlist ?? []).map((p) => p.symbol)),
  ]);
  const research = (symbol: string) =>
    product.demo?.research[symbol] ??
    (product.cache.get(
      `research/${encodeURIComponent(symbol.replace("/", "-"))}`,
    )?.value as Research | undefined) ??
    (product.cache.get(`research:${symbol}`)?.value as Research | undefined);
  const sectors: Record<string, string> = {};
  for (const p of product.workspace?.positions ?? []) {
    const r = research(p.symbol),
      sector = r?.evidence?.profile?.sector || r?.company.sector;
    if (sector) sectors[p.symbol] = sector;
  }
  const model = workspaceOverview(
    product.workspace?.positions ?? [],
    quotes.data,
    balances.data?.balances,
    sectors,
  );
  const q = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(quotes.data).flatMap(([symbol, row]) =>
          row.quote ? [[symbol, row.quote]] : [],
        ),
      ),
    [quotes.data],
  );
  const pace = (symbol: string) => {
    if (paceScan.rows[symbol]?.signal) return paceScan.rows[symbol].signal!;
    const r = research(symbol);
    if (!r) return paceScan.rows[symbol]?.signal ?? null;
    return workspaceGuidance(
      r,
      !!product.workspace?.positions.some(
        (p) => sameProviderSymbol(p.symbol, r.company.symbol) && p.quantity > 0,
      ),
      product.demo ? Date.parse(r.retrievedAt) : Date.now(),
    );
  };
  return {
    ...product,
    quotes,
    balances,
    prefix,
    model,
    q,
    pace,
    research,
    paceScan,
  };
}
export function WealthStrip({
  state,
  portfolio = false,
}: {
  state: ReturnType<typeof useWorkspaceData>;
  portfolio?: boolean;
}) {
  const { model, balances, workspace, quotes, prefix } = state;
  const ready = !!workspace && quotes.ready;
  const partial = model.unpriced.length > 0;
  const exactBalance = !!balances.data?.balances;
  return (
    <>
      <section
        className={`wealth-strip${portfolio ? " four" : ""}`}
        aria-label="Portfolio summary"
      >
        <Metric
          label={
            exactBalance
              ? partial || balances.data?.balances?.managed_value == null
                ? "Known net portfolio value"
                : "Net portfolio value"
              : "Priced assets & cash"
          }
          value={ready ? amount(model.net) : "—"}
          note={
            partial
              ? `${model.unpriced.length} unpriced instruments excluded`
              : exactBalance
                ? balances.data?.balances?.managed_value == null
                  ? "Managed balance not entered"
                  : "After cash and borrowing"
                : "Recorded USD holdings and cash"
          }
        />
        <Metric
          label="Unrealized return"
          value={ready ? amount(model.pnl) : "—"}
          tone={
            model.pnl == null ? "muted" : model.pnl < 0 ? "negative" : "green"
          }
          note={
            model.returnPct != null
              ? `${percent(model.returnPct, true)} · ${model.returnCovered}/${model.investmentCount} holdings with cost`
              : "Needs available price and recorded USD cost"
          }
        />
        {portfolio ? (
          <>
            <Metric
              label="Cash & managed"
              value={ready ? amount(model.cashAndManaged) : "—"}
              note={
                balances.data?.balances?.managed_value == null
                  ? "Recorded cash · managed not entered"
                  : "Recorded balances"
              }
            />
            <Metric
              label="Margin used"
              value={amount(model.margin)}
              note={
                exactBalance
                  ? "Subtracted from net value"
                  : "Balance not entered"
              }
            />
          </>
        ) : (
          <>
            <Metric
              label="Watchlist ideas"
              value={workspace?.watchlist.length ?? "—"}
              note="Ideas in your watchlist"
            />
            <Link href={`${prefix}/portfolio`} className="text-link">
              View portfolio <ArrowUpRight size={17} />
            </Link>
          </>
        )}
      </section>
      {balances.error && (
        <p className="approved-data-note" role="status">
          Account balances could not be checked. The total includes available
          listed assets and cash only.
        </p>
      )}
    </>
  );
}
export function Coverage({
  state,
}: {
  state: ReturnType<typeof useWorkspaceData>;
}) {
  const { model, quotes } = state;
  if (!model.unpriced.length && !model.older && !quotes.error) return null;
  return (
    <p className="approved-data-note" role="status">
      {model.unpriced.length
        ? `Not included in USD totals: ${model.unpriced.join(", ")}. `
        : ""}
      {model.older
        ? `${model.older} older quote${model.older === 1 ? "" : "s"} included. `
        : ""}
      {quotes.error || ""}{" "}
      <button
        className="text-link"
        onClick={quotes.refresh}
        disabled={quotes.loading}
      >
        Refresh prices
      </button>
    </p>
  );
}
