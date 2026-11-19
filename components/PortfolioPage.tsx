"use client";
import DecisionAttention from "./DecisionAttention";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import dynamic from "next/dynamic";
import composition from "./PortfolioComposition.module.css";
import reference from "./PortfolioReference.module.css";
import portfolioStyles from "./PortfolioWorkspace.module.css";
import { PaceBadge } from "./WorkspacePace";
import workspaceVisuals from "./WorkspaceVisuals.module.css";

import { researchLink } from "@/lib/approved-workspace";
import { amount, percent, quoteTime } from "@/lib/format";
import { earningsEventState, marketDay } from "@/lib/home-feed";
import { groupedLedgerRows } from "@/lib/portfolio-ledger";
import type { Position } from "@/lib/types";
import {
  ArrowUpRight,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search as SearchIcon,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { FeatureGate } from "./Access";
import AccountBalances from "./AccountBalances";
import ApprovedPortfolioChart from "./ApprovedPortfolioChart";
import { PositionEditor } from "./ApprovedWorkspaceForms";
const AccountHistory = dynamic(() => import("./AccountHistory"), {
  loading: () => null,
});
const PortfolioCharts = dynamic(() => import("./PortfolioCharts"), {
  loading: () => <p role="status">Loading analysis…</p>,
});
const PortfolioExposure = dynamic(() => import("./PortfolioExposure"), {
  loading: () => <p role="status">Loading analysis…</p>,
});
const PortfolioLedger = dynamic(() => import("./PortfolioLedger"), {
  loading: () => <p role="status">Loading analysis…</p>,
});
import PortfolioRiskSummary, {
  usePortfolioCalendar,
} from "./PortfolioRiskSummary";
const SectorBenchmarks = dynamic(() => import("./SectorBenchmarks"), {
  loading: () => <p role="status">Loading analysis…</p>,
});
import { useWorkspaceFilter } from "./Session";
const TransactionWorkspace = dynamic(() => import("./TransactionWorkspace"), {
  loading: () => <p role="status">Loading analysis…</p>,
});
import { Empty, Notice, SecurityLogo } from "./Ui";

import {
  Coverage,
  Heading,
  SectionHead,
  useWorkspaceData,
  WealthStrip,
} from "./WorkspaceShared";
export function Portfolio() {
  const preferences = useWorkspacePreferences();
  const state = useWorkspaceData("portfolio"),
    { workspace, quotes, model, q, prefix } = state;
  const positions = workspace?.positions ?? [];
  const [query, setQuery] = useWorkspaceFilter("portfolio"),
    [editing, setEditing] = useState<Position | "new" | null>(null),
    [cashDefault, setCashDefault] = useState(false),
    [purchaseSeed, setPurchaseSeed] = useState<{
      symbol: string;
      currency: string | null;
    } | null>(null),
    [depthOpen, setDepthOpen] = useState(false),
    [currencySaving, setCurrencySaving] = useState(false),
    [currencyError, setCurrencyError] = useState("");
  const [paceFilter, setPaceFilter] = useState("all");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const transactionDialog = useRef<HTMLDialogElement>(null);
  const openTransaction = () => {
    setTransactionOpen(true);
    transactionDialog.current?.showModal();
  };
  const balances = useRef<HTMLDialogElement>(null),
    depth = useRef<HTMLDialogElement>(null);
  const calendar = usePortfolioCalendar(positions);
  const today = marketDay();
  const earnings = new Set(
    (calendar.data?.events ?? [])
      .filter(
        (e) =>
          /earnings/i.test(e.kind) &&
          earningsEventState(e, today).status !== "reported" &&
          e.date >= today &&
          Date.parse(e.date) <= Date.parse(today) + 7 * 86400000,
      )
      .map((e) => e.symbol),
  );
  const earningsHoldingsCount = new Set(
    positions
      .filter(
        (p) =>
          p.assetType === "stock" &&
          Number.isFinite(p.quantity) &&
          p.quantity !== 0 &&
          earnings.has(p.symbol),
      )
      .map((p) => p.symbol),
  ).size;
  const visible = positions.filter(
    (p) =>
      `${p.symbol} ${quotes.data[p.symbol]?.company?.name || ""} ${p.assetType === "cash" ? "cash" : ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (paceFilter === "all" ||
        String(state.pace(p.symbol)?.view.rawLevel) === paceFilter),
  );
  const companies = Object.fromEntries(
    Object.entries(quotes.data).map(([symbol, row]) => [symbol, row.company]),
  );
  const unlabeledCosts = positions.filter(
    (p) => p.assetType !== "cash" && !p.currency,
  );
  async function confirmUsdCosts() {
    setCurrencySaving(true);
    setCurrencyError("");
    try {
      await state.mutate({
        op: "confirm-cost-currency",
        currency: "USD",
        ids: unlabeledCosts.map((p) => p.id),
      });
    } catch (e) {
      setCurrencyError(
        e instanceof Error ? e.message : "Could not save cost labels.",
      );
    } finally {
      setCurrencySaving(false);
    }
  }
  return (
    <section
      className={`approved-workspace approved-portfolio ${portfolioStyles.portfolio} ${workspaceVisuals.workspaceVisuals} ${reference.page} ${composition.root}`}
    >
      <Heading
        title="Portfolio"
        subtitle="Holdings, performance and allocation."
        actions={
          <div
            className={reference.actionsBar}
            role="group"
            aria-label="Portfolio actions"
          >
            <button type="button" className="btn" onClick={openTransaction}>
              Record transaction
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => balances.current?.showModal()}
            >
              Cash &amp; balances
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setCashDefault(false);
                setEditing("new");
              }}
            >
              <Plus size={16} aria-hidden="true" />
              Add purchase
            </button>
          </div>
        }
      />
      {state.workspaceError && <Notice error>{state.workspaceError}</Notice>}
      <WealthStrip state={state} portfolio className={reference.snapshot} />
      <Coverage state={state} />
      <section className={reference.history} aria-label="Portfolio history">
        <AccountHistory
          readOnly
          key={historyVersion}
          onReviewRecords={openTransaction}
          currentHoldingsHistory={
            <ApprovedPortfolioChart
              positions={positions}
              quotes={quotes.data}
              compact
            />
          }
        />
      </section>
      <div className={reference.grid} data-portfolio-layout="reference">
        <section className={`portfolio-holdings-panel ${reference.holdings}`}>
          <div
            className={`${portfolioStyles.holdingsToolbar} ${composition.toolbar}`}
          >
            <h2>
              <Wallet size={20} aria-hidden="true" />
              Holdings
            </h2>
            {earningsHoldingsCount > 0 && (
              <span
                className={reference.earnings}
                title="Calendar coverage may be incomplete"
              >
                {earningsHoldingsCount} with earnings this week
              </span>
            )}
            {positions.length > 0 && (
              <label className={portfolioStyles.holdingsSearch}>
                <SearchIcon size={18} aria-hidden="true" />
                <input
                  aria-label="Filter holdings"
                  placeholder="Find a holding"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            )}
            <select
              aria-label="Filter holdings by accumulation pace"
              value={paceFilter}
              onChange={(e) => setPaceFilter(e.target.value)}
            >
              <option value="all">All pace levels</option>
              {[4, 3, 2, 1, 0].map((n) => (
                <option key={n} value={n}>
                  P{n}
                </option>
              ))}
            </select>
            <div className={portfolioStyles.refreshControls}>
              {positions.length > 0 && (
                <select
                  aria-label="Portfolio price refresh interval"
                  value={quotes.mode}
                  onChange={(e) =>
                    quotes.changeMode(e.target.value as typeof quotes.mode)
                  }
                >
                  <option value="balanced">Every 5 min</option>
                  <option value="live">Every 2 min</option>
                  <option value="hourly">Hourly</option>
                  <option value="manual">Manual</option>
                </select>
              )}
              <button
                type="button"
                disabled={quotes.loading}
                onClick={quotes.refresh}
                aria-label={
                  quotes.loading
                    ? "Refreshing portfolio prices"
                    : "Refresh portfolio prices"
                }
                aria-busy={quotes.loading}
                title="Refresh prices now"
              >
                <RefreshCw size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          {visible.length ? (
            <HoldingsTable
              positions={visible}
              allPositions={positions}
              state={state}
              earnings={earnings}
              onEdit={setEditing}
              onAddPurchase={(seed) => {
                setCashDefault(false);
                setPurchaseSeed(seed);
                setEditing("new");
              }}
            />
          ) : (
            <Empty
              title={
                positions.length
                  ? "No holdings match your filter"
                  : "Bring your holdings into focus"
              }
              icon={Wallet}
              action={
                <button
                  className="btn"
                  onClick={() =>
                    positions.length
                      ? (setQuery(""), setPaceFilter("all"))
                      : setEditing("new")
                  }
                >
                  {positions.length
                    ? "Clear filter"
                    : "Add your first position"}
                </button>
              }
            >
              {positions.length
                ? "Try another company name or ticker."
                : "Record shares and average costs. Adding a position does not place a trade."}
            </Empty>
          )}
          <div className="approved-holding-tools">
            {positions.length > 0 && (
              <button
                className="text-link"
                onClick={() => {
                  setDepthOpen(true);
                  depth.current?.showModal();
                }}
              >
                Transactions &amp; analysis <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </section>
        <div className={reference.capitalOverview}>
          <section className="portfolio-allocation-panel">
            <SectionHead
              title="Allocation"
              subtitle="Priced investments · excludes cash"
            />
            {model.allocations.length > 0 && (
              <div className={composition.concentration}>
                <span>
                  {model.allocations.length >= 3
                    ? "Largest three holdings"
                    : "Priced holdings share"}
                </span>
                <strong>
                  {percent(
                    model.allocations
                      .slice(0, 3)
                      .reduce((sum, item) => sum + item.weight, 0),
                  )}
                </strong>
                <small>
                  Share of priced investments · cash and unpriced holdings
                  excluded
                </small>
              </div>
            )}
            <div className={reference.allocationBody}>
              {model.allocations.length ? (
                <div className={reference.allocationLegend}>
                  <div
                    className="allocation-track"
                    role="img"
                    aria-label={model.allocations
                      .map((a) => `${a.symbol} ${percent(a.weight)}`)
                      .join("; ")}
                  >
                    {model.allocations.map((a) => (
                      <i
                        key={a.symbol}
                        style={{
                          width: `${a.weight}%`,
                          background: [
                            "var(--portfolio-basket)",
                            "var(--portfolio-spy)",
                            "var(--portfolio-qqq)",
                          ][
                            model.allocations.findIndex(
                              (item) => item.symbol === a.symbol,
                            ) % 3
                          ],
                        }}
                      />
                    ))}
                  </div>
                  {model.allocations.slice(0, 6).map((a) => (
                    <Link
                      key={a.symbol}
                      href={researchLink(a.symbol, prefix)}
                      className="allocation-row"
                    >
                      <span>
                        <i
                          className="dot"
                          style={{
                            background: [
                              "var(--portfolio-basket)",
                              "var(--portfolio-spy)",
                              "var(--portfolio-qqq)",
                            ][
                              model.allocations.findIndex(
                                (item) => item.symbol === a.symbol,
                              ) % 3
                            ],
                          }}
                        />
                        {a.symbol}
                      </span>
                      <strong>{percent(a.weight)}</strong>
                    </Link>
                  ))}
                  {model.allocations.length > 6 && (
                    <details className="allocation-more">
                      <summary>All {model.allocations.length} holdings</summary>
                      {model.allocations.slice(6).map((a) => (
                        <Link
                          key={a.symbol}
                          href={researchLink(a.symbol, prefix)}
                          className="allocation-row"
                        >
                          <span>
                            <i
                              className="dot"
                              style={{
                                background: [
                                  "var(--portfolio-basket)",
                                  "var(--portfolio-spy)",
                                  "var(--portfolio-qqq)",
                                ][
                                  model.allocations.findIndex(
                                    (item) => item.symbol === a.symbol,
                                  ) % 3
                                ],
                              }}
                            />
                            {a.symbol}
                          </span>
                          <strong>{percent(a.weight)}</strong>
                        </Link>
                      ))}
                    </details>
                  )}
                </div>
              ) : (
                <Empty title="See how your holdings fit together">
                  Available USD prices will reveal your allocation.
                </Empty>
              )}
            </div>
            {model.groups.length > 0 && (
              <section
                className={`${reference.exposure} ${composition.sectors}`}
              >
                <h3>Sector exposure</h3>
                <div
                  className="portfolio-exposure-rows"
                  role="region"
                  tabIndex={0}
                  aria-label="Sector and crypto exposure groups"
                >
                  {model.groups.map((group, i) => (
                    <div key={group.name}>
                      <div>
                        <strong>{group.name}</strong>
                        <b>{percent(group.weight)}</b>
                      </div>
                      <span className="portfolio-exposure-track">
                        <i
                          style={{
                            width: `${group.weight}%`,
                            background: [
                              "var(--portfolio-basket)",
                              "var(--portfolio-spy)",
                              "var(--portfolio-qqq)",
                            ][i % 3],
                          }}
                        />
                      </span>
                      <small>
                        {group.symbols.length}{" "}
                        {group.symbols.length === 1 ? "company" : "companies"}
                      </small>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>
        </div>
      </div>
      <details className={reference.methodology}>
        <summary>About these values</summary>
        <p className="chart-note">
          Unrealized returns exclude realized trades, dividends, fees and taxes.
          Non-USD prices and costs are not converted.{" "}
          {quotes.checkedAt
            ? `Prices checked ${quoteTime(quotes.checkedAt)}.`
            : ""}
        </p>
      </details>
      {editing && (
        <PositionEditor
          key={editing === "new" ? "new" : editing.id}
          position={editing === "new" ? null : editing}
          cashDefault={cashDefault}
          initialSymbol={purchaseSeed?.symbol}
          initialCurrency={purchaseSeed?.currency}
          onClose={() => {
            setEditing(null);
            setPurchaseSeed(null);
            setCashDefault(false);
          }}
        />
      )}
      <dialog
        ref={balances}
        className="dialog approved-workspace-dialog approved-balances-dialog"
        aria-labelledby="approved-balances-title"
        onClose={() => state.balances.refresh()}
      >
        <div className="dialog-head">
          <h2 id="approved-balances-title">Cash & balances</h2>
          <button
            className="icon-button"
            onClick={() => balances.current?.close()}
            aria-label="Close balances"
          >
            <X size={20} />
          </button>
        </div>
        <AccountBalances
          assets={model.assets}
          ready={!!workspace && quotes.ready}
          missing={model.unpriced.length}
        />
        <button
          className="btn"
          onClick={() => {
            balances.current?.close();
            setCashDefault(true);
            setEditing(
              positions.find(
                (p) => p.assetType === "cash" && p.symbol === "USD",
              ) || "new",
            );
          }}
        >
          Record or edit cash
        </button>
      </dialog>
      <dialog
        ref={transactionDialog}
        className="dialog approved-workspace-dialog"
        aria-labelledby="record-transaction-title"
        onClose={() => setTransactionOpen(false)}
      >
        <div className="dialog-head">
          <h2 id="record-transaction-title">Record transaction</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close record transaction"
            onClick={() => transactionDialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        {transactionOpen && (
          <TransactionWorkspace
            directRecord
            quotes={q}
            positions={positions}
            onRecorded={() => {
              transactionDialog.current?.close();
              setHistoryVersion((v) => v + 1);
            }}
          />
        )}
      </dialog>
      <dialog
        ref={depth}
        className="detail-drawer approved-depth-dialog"
        aria-labelledby="approved-depth-title"
        onClose={() => {
          setDepthOpen(false);
          setHistoryVersion((version) => version + 1);
        }}
      >
        <header>
          <div>
            <span className="eyebrow">YOUR PORTFOLIO</span>
            <h2 id="approved-depth-title">Transactions &amp; analysis</h2>
          </div>
          <button
            className="icon-button"
            onClick={() => depth.current?.close()}
            aria-label="Close portfolio analysis"
          >
            <X size={22} />
          </button>
        </header>
        <div className="detail-content">
          {depthOpen && (
            <>
              {unlabeledCosts.length > 0 && (
                <section className="card">
                  <SectionHead
                    title="Confirm your recorded cost currency"
                    subtitle={`${unlabeledCosts.length} older holdings have saved costs without a currency label. Their value remains visible; their return needs that label.`}
                  />
                  <p className="chart-note">
                    {unlabeledCosts.map((p) => p.symbol).join(", ")}. Confirm
                    only if all these average costs are in USD. Otherwise edit
                    each holding below.
                  </p>
                  <button
                    className="btn"
                    disabled={currencySaving}
                    onClick={confirmUsdCosts}
                  >
                    {currencySaving ? "Saving…" : "Confirm these costs are USD"}
                  </button>
                  {currencyError && <Notice error>{currencyError}</Notice>}
                </section>
              )}
              <TransactionWorkspace
                quotes={q}
                positions={positions}
                hideComparison
              />
              <DecisionAttention
                compact
                symbols={[
                  ...new Set(
                    positions
                      .filter((p) => p.assetType !== "cash" && p.quantity > 0)
                      .map((p) => p.symbol),
                  ),
                ]}
                held={positions
                  .filter((p) => p.assetType !== "cash" && p.quantity > 0)
                  .map((p) => p.symbol)}
                rows={state.paceScan.rows}
                allocations={model.allocations}
                concentrationLimit={preferences.preferences.concentrationLimit}
                prefix={prefix}
                loading={state.paceScan.loading}
              />
              <PortfolioLedger
                positions={positions}
                allPositions={positions}
                quotes={q}
                companies={companies}
                total={model.assets}
                earnings={earnings}
                prefix={prefix}
                onEdit={(p) => {
                  depth.current?.close();
                  setEditing(p);
                }}
              />
              <FeatureGate feature="portfolio">
                <PortfolioCharts positions={positions} quotes={q} />
                <PortfolioRiskSummary
                  positions={positions}
                  quotes={q}
                  calendar={calendar}
                />
                <PortfolioExposure positions={positions} quotes={quotes.data} />
                <SectorBenchmarks />
              </FeatureGate>
            </>
          )}
        </div>
      </dialog>
    </section>
  );
}
function HoldingsTable({
  positions,
  allPositions,
  state,
  earnings,
  onEdit,
  onAddPurchase,
}: {
  positions: Position[];
  allPositions: Position[];
  state: ReturnType<typeof useWorkspaceData>;
  earnings: Set<string>;
  onEdit: (p: Position) => void;
  onAddPurchase: (seed: { symbol: string; currency: string | null }) => void;
}) {
  const { model, q, quotes, prefix } = state;
  const selected = new Set(positions.map((p) => p.id));
  const rows = groupedLedgerRows(allPositions, q, model.invested, earnings)
    .filter((r) => r.lots.some((p) => selected.has(p.id)))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  const purchaseDialog = useRef<HTMLDialogElement>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeHolding = rows.find((row) => row.groupKey === activeKey);
  return (
    <>
      <div
        className={`table-scroll ${portfolioStyles.ledger} ${reference.holdingsScroll}`}
        role="region"
        aria-label="Portfolio holdings, scroll for more rows and columns"
        tabIndex={0}
      >
        <table className="holdings-table approved-holdings-table">
          <caption className="sr-only">
            Your recorded investments. Weights use priced invested value; cash
            is excluded from weight. Purchases are grouped by ticker. Returns
            require a USD cost basis.
          </caption>
          <thead>
            <tr>
              <th>Company / accumulation pace</th>
              <th>Weight</th>
              <th>Price</th>
              <th>Value / unrealized return</th>
              <th>
                <span className="sr-only">Manage purchases</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const p = row.position,
                cash = p.assetType === "cash",
                quote = quotes.data[p.symbol]?.quote,
                decision = cash ? null : state.pace(p.symbol),
                quantityDisplay =
                  row.quantity?.toLocaleString(undefined, {
                    maximumFractionDigits: 8,
                  }) ?? "—",
                costDisplay =
                  row.avgCost != null && row.costCurrency
                    ? amount(row.avgCost, row.costCurrency)
                    : row.costState === "mixed"
                      ? "Mixed currencies"
                      : "Cost unavailable";
              return (
                <tr key={row.groupKey}>
                  <td>
                    {cash ? (
                      <div className="company-row">
                        <span className="approved-cash-mark">
                          <Wallet size={23} />
                        </span>
                        <span>
                          <b>{p.symbol} cash</b>
                          <small>Recorded balance</small>
                        </span>
                      </div>
                    ) : (
                      <Link
                        className="company-row"
                        href={researchLink(p.symbol, prefix)}
                      >
                        <SecurityLogo symbol={p.symbol} />
                        <span>
                          <b>{p.symbol}</b>
                          <small>
                            {quotes.data[p.symbol]?.company?.name ||
                              "Open research"}
                            {row.lots.length > 1
                              ? ` · ${row.lots.length} purchases`
                              : ""}
                            <br />
                            {quantityDisplay}{" "}
                            {p.assetType === "crypto" ? "units" : "shares"} ·{" "}
                            {costDisplay}
                            {row.avgCost != null ? " avg cost" : ""}
                          </small>
                          {p.assetType !== "crypto" && (
                            <PaceBadge
                              signal={decision}
                              loading={state.paceScan.loading}
                            />
                          )}
                        </span>
                      </Link>
                    )}
                  </td>
                  <td>{cash ? "—" : percent(row.weight)}</td>
                  <td>
                    <strong>
                      {cash ? "—" : amount(quote?.price, quote?.currency)}
                    </strong>
                    {!cash && (
                      <small
                        title={
                          quote
                            ? `Price as of ${quoteTime(quote.asOf)}`
                            : undefined
                        }
                      >
                        {quote?.asOf
                          ? `${quote.stale ? "Older · " : ""}${quoteTime(quote.asOf, true)}`
                          : "Price unavailable"}
                      </small>
                    )}
                  </td>
                  <td>
                    <strong>{amount(row.value)}</strong>
                    <small
                      className={
                        row.pnl == null
                          ? "muted"
                          : row.pnl < 0
                            ? "negative"
                            : "green"
                      }
                    >
                      {row.pnl != null
                        ? row.returnPct == null
                          ? amount(row.pnl)
                          : `${amount(row.pnl)} · ${percent(row.returnPct, true)}`
                        : !cash
                          ? "Return unavailable"
                          : "Cash balance"}
                    </small>
                    {row.note && (
                      <small className="approved-holding-note">
                        {row.note}
                      </small>
                    )}
                  </td>
                  <td>
                    <div className={reference.rowActions}>
                      {!cash && (
                        <button
                          className="icon-button"
                          type="button"
                          title="Add purchase"
                          aria-label={`Add purchase for ${p.symbol}`}
                          onClick={() =>
                            onAddPurchase({
                              symbol: p.symbol,
                              currency: row.costCurrency,
                            })
                          }
                        >
                          <Plus size={17} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        className="icon-button"
                        type="button"
                        title={cash ? "Edit cash" : "Manage purchases"}
                        aria-label={
                          cash
                            ? `Edit ${p.symbol} cash`
                            : `Manage ${p.symbol} purchases`
                        }
                        onClick={() => {
                          if (cash) onEdit(p);
                          else {
                            setActiveKey(row.groupKey);
                            purchaseDialog.current?.showModal();
                          }
                        }}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <dialog
        ref={purchaseDialog}
        className="dialog approved-workspace-dialog"
        aria-labelledby="holding-purchases-heading"
        onClose={() => setActiveKey(null)}
      >
        <div className="dialog-head">
          <h2 id="holding-purchases-heading">
            {activeHolding
              ? `${activeHolding.position.symbol} purchases`
              : "Holding purchases"}
          </h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close purchases"
            onClick={() => purchaseDialog.current?.close()}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {activeHolding && (
          <>
            <ul
              className={reference.purchaseLots}
              aria-label="Recorded purchases"
            >
              {activeHolding.lots.map((lot, index) => (
                <li key={lot.id}>
                  <span>
                    <strong>Purchase {index + 1}</strong>
                    <small>
                      {lot.quantity.toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })}{" "}
                      {lot.assetType === "crypto" ? "units" : "shares"} ·{" "}
                      {lot.currency
                        ? `${amount(lot.cost, lot.currency)} per unit`
                        : "Cost currency unknown"}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="btn"
                    aria-label={`Edit purchase ${index + 1}`}
                    onClick={() => {
                      purchaseDialog.current?.close();
                      onEdit(lot);
                    }}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </dialog>
    </>
  );
}
