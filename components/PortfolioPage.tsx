"use client";
import dynamic from "next/dynamic";
import QuickRead from "./QuickRead";
import { companyAccent } from "@/lib/visual-signals";
import portfolioStyles from "./PortfolioWorkspace.module.css";
import { PaceBadge } from "./WorkspacePace";
import workspaceVisuals from "./WorkspaceVisuals.module.css";

import { researchLink } from "@/lib/approved-workspace";
import { amount, percent, quoteTime } from "@/lib/format";
import { earningsEventState, marketDay } from "@/lib/home-feed";
import { ledgerRows } from "@/lib/portfolio-ledger";
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
  colors,
  Coverage,
  Heading,
  SectionHead,
  useWorkspaceData,
  WealthStrip,
} from "./WorkspaceShared";
export function Portfolio() {
  const state = useWorkspaceData("portfolio"),
    { workspace, quotes, model, q, prefix } = state;
  const positions = workspace?.positions ?? [];
  const [query, setQuery] = useWorkspaceFilter("portfolio"),
    [editing, setEditing] = useState<Position | "new" | null>(null),
    [cashDefault, setCashDefault] = useState(false),
    [depthOpen, setDepthOpen] = useState(false),
    [currencySaving, setCurrencySaving] = useState(false),
    [currencyError, setCurrencyError] = useState("");
  const [paceFilter, setPaceFilter] = useState("all");
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
      className={`approved-workspace approved-portfolio ${portfolioStyles.portfolio} ${workspaceVisuals.workspaceVisuals}`}
    >
      <Heading
        title="Portfolio"
        subtitle="Holdings, performance and allocation."
        actions={
          <>
            <button
              className="btn"
              onClick={() => {
                setDepthOpen(true);
                depth.current?.showModal();
              }}
            >
              Transactions
            </button>
            <button
              className="btn"
              onClick={() => balances.current?.showModal()}
            >
              Cash & balances
            </button>
            <button
              className="btn primary"
              onClick={() => {
                setCashDefault(false);
                setEditing("new");
              }}
            >
              <Plus size={16} />
              Add position
            </button>
          </>
        }
      />
      {state.workspaceError && <Notice error>{state.workspaceError}</Notice>}
      <WealthStrip state={state} portfolio />
      <Coverage state={state} />
      {quotes.ready && positions.length > 0 && (
        <QuickRead
          title="Your portfolio in 30 seconds"
          items={[
            ...(model.allocations[0]
              ? [
                  {
                    label: "Largest position",
                    value: `${model.allocations[0].symbol} · ${percent(model.allocations[0].weight)}`,
                    detail:
                      "Share of priced investments, excluding cash and unpriced holdings.",
                    tone:
                      model.allocations[0].weight > 30
                        ? ("caution" as const)
                        : ("neutral" as const),
                  },
                ]
              : []),
            {
              label: "Earnings · next 7 days",
              value:
                calendar.data && calendar.data.followed > 0
                  ? `${positions.filter((p) => p.assetType === "stock" && earnings.has(p.symbol)).length} confirmed holdings`
                  : "Dates not confirmed",
              detail:
                "Review supplied dates before changing position sizes; calendar coverage may be incomplete.",
            },
            {
              label: "Price coverage",
              value: model.unpriced.length
                ? `${model.unpriced.length} holdings need a price`
                : "All holdings priced",
              detail: model.older
                ? `${model.older} use older available prices. Check timestamps before acting.`
                : "Prices are snapshots; totals are not a live account balance.",
              tone:
                model.unpriced.length || model.older
                  ? ("caution" as const)
                  : ("positive" as const),
            },
          ]}
        />
      )}
      <div className="portfolio-grid">
        <div>
          <section className="card portfolio-trend-panel">
            <SectionHead
              title="Portfolio trend"
              subtitle="Current holdings · historical prices"
            />
            <ApprovedPortfolioChart
              positions={positions}
              quotes={quotes.data}
            />
          </section>
        </div>
        <div className="portfolio-sidebar">
          <section className="card portfolio-allocation-panel">
            <SectionHead title="Allocation" subtitle="Priced investments" />
            {model.allocations.length ? (
              <>
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
                        background: companyAccent(a.symbol),
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
                        style={{ background: companyAccent(a.symbol) }}
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
                            style={{ background: companyAccent(a.symbol) }}
                          />
                          {a.symbol}
                        </span>
                        <strong>{percent(a.weight)}</strong>
                      </Link>
                    ))}
                  </details>
                )}
                <p className="chart-note">
                  Cash and managed balances excluded. Duplicate ticker positions
                  combined.
                  {model.unpriced.length
                    ? " Unpriced instruments are excluded."
                    : ""}
                </p>
              </>
            ) : (
              <Empty title="See how your holdings fit together">
                Available USD prices will reveal your allocation.
              </Empty>
            )}
          </section>
          <section className="card portfolio-exposure-panel">
            <SectionHead
              title="Exposure"
              subtitle="Shared sectors and themes"
            />
            {model.groups.length ? (
              <>
                <div
                  className="portfolio-exposure-rows"
                  aria-label="Sector and crypto exposure groups"
                >
                  {model.groups.slice(0, 5).map((group, i) => (
                    <div key={group.name}>
                      <div>
                        <strong>{group.name}</strong>
                        <b>{percent(group.weight)}</b>
                      </div>
                      <span className="portfolio-exposure-track">
                        <i
                          style={{
                            width: `${group.weight}%`,
                            background: colors[i],
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
                <p className="chart-note">
                  Supplied sector labels, not measured correlations.
                  Unclassified holdings remain visible. Weights use priced
                  invested value.
                </p>
                <details className="approved-risk-details">
                  <summary>See companies in each group</summary>
                  {model.groups.map((g) => (
                    <p key={g.name}>
                      <strong>
                        {g.name} · {percent(g.weight)}
                      </strong>
                      <br />
                      {g.symbols.join(", ")}
                    </p>
                  ))}
                </details>
              </>
            ) : (
              <Empty title="Understand shared exposure">
                Sector groups appear when your holdings have usable prices and
                company evidence.
              </Empty>
            )}
          </section>
        </div>
        <section className="card portfolio-holdings-panel">
          <div className={portfolioStyles.holdingsToolbar}>
            <h2>
              <Wallet size={20} aria-hidden="true" />
              Holdings
            </h2>
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
                Transactions & analysis <ArrowUpRight size={15} />
              </button>
            )}
          </div>
        </section>
      </div>
      <p className="chart-note">
        Unrealized returns exclude realized trades, dividends, fees and taxes.
        Non-USD prices and costs are not converted.{" "}
        {quotes.checkedAt
          ? `Prices checked ${quoteTime(quotes.checkedAt)}.`
          : ""}
      </p>
      {editing && (
        <PositionEditor
          key={editing === "new" ? "new" : editing.id}
          position={editing === "new" ? null : editing}
          cashDefault={cashDefault}
          onClose={() => setEditing(null)}
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
        ref={depth}
        className="detail-drawer approved-depth-dialog"
        aria-labelledby="approved-depth-title"
        onClose={() => setDepthOpen(false)}
      >
        <header>
          <div>
            <span className="eyebrow">YOUR PORTFOLIO</span>
            <h2 id="approved-depth-title">The full picture</h2>
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
              <TransactionWorkspace quotes={q} positions={positions} />
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
}: {
  positions: Position[];
  allPositions: Position[];
  state: ReturnType<typeof useWorkspaceData>;
  earnings: Set<string>;
  onEdit: (p: Position) => void;
}) {
  const { model, q, quotes, prefix } = state;
  const selected = new Set(positions.map((p) => p.id));
  const rows = ledgerRows(allPositions, q, model.invested, earnings)
    .filter((r) => selected.has(r.position.id))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  return (
    <div className={`table-scroll ${portfolioStyles.ledger}`}>
      <table className="holdings-table approved-holdings-table">
        <caption className="sr-only">
          Your recorded investments. Weights use priced invested value; cash is
          excluded from weight. Returns require a USD cost basis.
        </caption>
        <thead>
          <tr>
            <th>Company / accumulation pace</th>
            <th>Weight</th>
            <th>Price</th>
            <th>Value / return</th>
            <th>
              <span className="sr-only">Edit holding</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const p = row.position,
              cash = p.assetType === "cash",
              quote = quotes.data[p.symbol]?.quote,
              decision = cash ? null : state.pace(p.symbol);
            return (
              <tr key={p.id}>
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
                          <br />
                          {p.quantity.toLocaleString(undefined, {
                            maximumFractionDigits: 6,
                          })}{" "}
                          {p.assetType === "crypto" ? "units" : "shares"} ·{" "}
                          {p.currency
                            ? amount(p.cost, p.currency)
                            : "Unknown currency"}{" "}
                          cost
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
                    {row.returnPct != null
                      ? `${amount(row.pnl)} · ${percent(row.returnPct, true)}`
                      : !cash
                        ? "Return unavailable"
                        : "Cash balance"}
                  </small>
                  {row.note && (
                    <small className="approved-holding-note">{row.note}</small>
                  )}
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`Edit ${p.symbol}`}
                    onClick={() => onEdit(p)}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
