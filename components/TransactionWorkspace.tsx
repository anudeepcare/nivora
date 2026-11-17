"use client";
import { useState } from "react";
import { useProduct, useResource } from "./Session";
import { api } from "@/lib/client";
import {
  holdingDifferences,
  mergeTransactionImport,
  parseTransactionCsv,
  reconcileTransactions,
  moneyWeightedReturn,
  type Transaction,
} from "@/lib/transaction-ledger";
import type { Position, Quote } from "@/lib/types";
import { amount, percent, dateLabel } from "@/lib/format";
import s from "./TransactionWorkspace.module.css";
type Ledger = {
  rows: Transaction[];
  revision: number;
  updated_at: string | null;
};
export default function TransactionWorkspace({
  quotes,
  positions,
}: {
  quotes: Record<string, Quote>;
  positions: Position[];
}) {
  const { demo } = useProduct(),
    resource = useResource<Ledger>(
      "transactions",
      demo ? { rows: [], revision: 0, updated_at: null } : undefined,
    );
  const [draft, setDraft] = useState<Transaction[] | null>(null),
    [base, setBase] = useState<number | null>(null),
    [errors, setErrors] = useState<string[]>([]),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(0),
    [importMode, setImportMode] = useState<"append" | "replace">("append"),
    [reconciled, setReconciled] = useState(false);
  const rows = draft ?? resource.data?.rows ?? [],
    filtered =
      filter === "all" ? rows : rows.filter((r) => r.account === filter),
    result = reconcileTransactions(filtered),
    accounts = [...new Set(rows.map((r) => r.account))].sort();
  const mismatches = holdingDifferences(
    reconcileTransactions(rows).positions,
    positions,
  );
  const start = filtered.map((r) => r.date).sort()[0],
    today = new Date().toISOString().slice(0, 10);
  const quoteDates = result.positions.map((p) =>
    quotes[p.symbol]?.asOf?.slice(0, 10),
  );
  const fresh = result.positions.every((p) => {
    const q = quotes[p.symbol];
    return (
      q?.currency === "USD" &&
      q.price != null &&
      q.price > 0 &&
      Number.isFinite(q.price) &&
      q.asOf &&
      Date.parse(q.asOf) <= Date.now() + 60000 &&
      Date.now() - Date.parse(q.asOf) < 4 * 86400000
    );
  });
  const endDate =
    result.positions.length && fresh && new Set(quoteDates).size === 1
      ? quoteDates[0]
      : result.positions.length
        ? undefined
        : today;
  const cash = result.accounts.reduce((n, a) => n + a.cash, 0),
    value =
      cash +
      result.positions.reduce(
        (n, p) => n + p.quantity * (quotes[p.symbol]?.price ?? 0),
        0,
      );
  const eligible =
    reconciled &&
    !draft &&
    mismatches.length === 0 &&
    endDate &&
    fresh &&
    !result.errors.length &&
    filtered.every((r) => r.date <= endDate);
  const flows = filtered
    .filter((r) => r.type === "deposit" || r.type === "withdrawal")
    .map((r) => ({
      date: r.date,
      amount: r.type === "deposit" ? -r.amount : r.amount,
    }));
  const mwr =
    eligible &&
    start &&
    Date.parse(endDate) - Date.parse(start) >= 365 * 86400000
      ? moneyWeightedReturn([...flows, { date: endDate, amount: value }])
      : null;
  function download(text: string, name: string) {
    const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  const header =
    "id,account,date,type,symbol,quantity,price,amount,fee,currency";
  async function read(file?: File) {
    if (!file) return;
    setNotice("");
    setErrors([]);
    try {
      if (file.size > 2000000) throw Error("CSV must be under 2 MB.");
      const imported = parseTransactionCsv(await file.text());
      if (imported.errors.length) {
        setErrors(imported.errors);
        return;
      }
      const { rows: next, skipped } = mergeTransactionImport(
        draft ?? resource.data?.rows ?? [],
        imported.rows,
        importMode,
      );
      setReconciled(false);
      setDraft(next);
      setBase(base ?? resource.data?.revision ?? 0);
      setPage(0);
      setNotice(
        importMode === "replace"
          ? `Replacement preview: ${next.length} transactions will replace the entire saved ledger when you save.`
          : `${imported.rows.length - skipped} new transactions ready for review; ${skipped} duplicates skipped. Save after checking reconciliation.`,
      );
    } catch (e) {
      setErrors([(e as Error).message]);
    }
  }
  async function save() {
    if (!draft || base === null) return;
    setBusy(true);
    setErrors([]);
    try {
      if (demo) throw Error("Sign in to save actual transactions.");
      await api("transactions", { rows: draft, revision: base });
      setDraft(null);
      setBase(null);
      resource.refresh();
      setNotice("Transactions saved. Recorded holdings are unchanged.");
    } catch (e) {
      setErrors([(e as Error).message]);
    } finally {
      setBusy(false);
    }
  }
  const exportRows = () =>
    [
      header,
      ...rows.map((r) =>
        [
          r.id,
          r.account,
          r.date,
          r.type,
          r.symbol,
          r.quantity,
          r.price,
          r.amount,
          r.fee,
          r.currency,
        ]
          .map((x) => '"' + String(x).replaceAll('"', '""') + '"')
          .join(","),
      ),
    ].join("\n");
  return (
    <section className={s.root}>
      <header>
        <div>
          <h2>Transactions & reconciliation</h2>
          <p>
            Import your activity once. Check cash, units and realized results by
            account.
          </p>
        </div>
        <label>
          Account
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
      </header>
      <label>
        Import action
        <select
          value={importMode}
          onChange={(e) =>
            setImportMode(e.target.value as "append" | "replace")
          }
        >
          <option value="append">Append new transactions</option>
          <option value="replace">
            Replace entire ledger from corrected CSV
          </option>
        </select>
      </label>
      <div className={s.actions}>
        <button
          type="button"
          onClick={() =>
            download(header + "\n", "auryn-transactions-template.csv")
          }
        >
          Download template
        </button>
        <label className={s.upload}>
          Import CSV
          <input
            aria-label="Import transactions CSV"
            type="file"
            accept=".csv,text/csv"
            disabled={busy || !resource.data || !!resource.error}
            onChange={(e) => {
              void read(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button
          disabled={!rows.length}
          onClick={() => download(exportRows(), "auryn-transactions.csv")}
        >
          Export ledger
        </button>
        {draft && (
          <>
            <button
              disabled={busy || !!resource.error || !!errors.length}
              onClick={() => void save()}
            >
              {busy ? "Saving…" : "Save reviewed ledger"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setDraft(null);
                setErrors([]);
                setNotice("Import discarded.");
              }}
            >
              Discard import
            </button>
          </>
        )}
      </div>
      <details>
        <summary>CSV format & supported activity</summary>
        <p>
          Use one unique ID per transaction and USD accounts. Supported types:
          deposit, withdrawal, buy, sell, dividend, fee and split. Trades use
          quantity and per-share price; cash entries use amount. For a 2-for-1
          split, quantity is 2. Keep same-day rows in execution order. Begin
          with deposits and opening purchases so cash and units reconcile. Fees
          are positive costs.
        </p>
        <p>
          This ledger uses average cost for research, not tax-lot reporting.
          Transfers, mergers, spin-offs, non-USD accounts and broker sync
          require reconciliation outside this importer. Imports do not overwrite
          your recorded holdings.
        </p>
      </details>
      {resource.loading && !resource.data && (
        <p role="status">Loading saved transactions…</p>
      )}
      {resource.error && (
        <p role="alert">
          {resource.error} <button onClick={resource.refresh}>Retry</button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {errors.length > 0 && (
        <div role="alert">
          <strong>Import needs correction</strong>
          {errors.slice(0, 8).map((e) => (
            <p key={e}>{e}</p>
          ))}
          {errors.length > 8 && (
            <p>
              {errors.length - 8} more errors. Correct the source file before
              importing.
            </p>
          )}
        </div>
      )}
      {!!rows.length && (
        <>
          <div className={s.metrics}>
            <div>
              <span>Recorded cash</span>
              <strong>{amount(cash)}</strong>
            </div>
            <div>
              <span>Realized trade result</span>
              <strong>{amount(result.realized)}</strong>
            </div>
            <div>
              <span>Dividend income</span>
              <strong>{amount(result.income)}</strong>
            </div>
            <div>
              <span>Total recorded fees</span>
              <strong>{amount(result.fees)}</strong>
            </div>
          </div>
          <details open={result.errors.length > 0}>
            <summary>
              Reconciliation ·{" "}
              {result.errors.length
                ? `${result.errors.length} issues`
                : "No ledger arithmetic issues"}{" "}
              · {new Set(mismatches).size} holdings differences
            </summary>
            {result.errors.slice(0, 20).map((e, i) => (
              <p key={i}>{e}</p>
            ))}
            {[...new Set(mismatches)].map((e) => (
              <p key={e}>{e}</p>
            ))}
            <p>
              Arithmetic checks do not confirm that all broker transactions are
              present. Compare deposits, withdrawals and closing units with your
              statements.
            </p>
          </details>
          <details>
            <summary>Cash-flow-aware return</summary>
            <label className={s.confirm}>
              <input
                type="checkbox"
                checked={reconciled}
                onChange={(e) => setReconciled(e.target.checked)}
              />
              I checked all transactions, cash and closing units against my
              account statements.
            </label>
            <p>
              Annualized money-weighted return:{" "}
              <strong>
                {mwr === null
                  ? "Needs complete, dated records"
                  : percent(mwr, true)}
              </strong>
            </p>
            <p>
              {mwr !== null
                ? `Through ${dateLabel(endDate!)} using recorded external cash flows and current closing value. Check all activity against statements before relying on this result.`
                : "Requires at least one year, reconciled activity, valid deposit/withdrawal cash flows and prices from one observation date. No return is inferred from incomplete records."}
            </p>
            <p>
              Time-weighted performance needs account valuations immediately
              around every external cash flow. Current holdings at past prices
              are not account performance.
            </p>
          </details>
          <div className={s.entries}>
            {[...filtered]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(page * 25, page * 25 + 25)
              .map((r) => (
                <article key={r.id}>
                  <span>
                    <strong>{r.symbol || r.type}</strong>
                    <small>
                      {r.account} · {dateLabel(r.date)}
                    </small>
                  </span>
                  <span>
                    <b>{r.type}</b>
                    <small>
                      {["buy", "sell"].includes(r.type)
                        ? `${r.quantity.toLocaleString()} × ${amount(r.price)}`
                        : r.type === "split"
                          ? `${r.quantity}:1 split`
                          : amount(r.amount)}
                    </small>
                  </span>
                </article>
              ))}
          </div>
          <footer>
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              {filtered.length} transactions · Page {page + 1}
            </span>
            <button
              disabled={(page + 1) * 25 >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </footer>
        </>
      )}
      {!rows.length && !resource.loading && (
        <p>
          Start with the template, then import your transaction history to see
          reconciliation and realized results.
        </p>
      )}
    </section>
  );
}
