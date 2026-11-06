"use client";
import { useEffect, useState } from "react";
import { useProduct, useResource } from "./Session";
import { api } from "@/lib/client";
import { amount, quoteTime } from "@/lib/format";
import {
  accountEquity,
  parseAccountMoney,
  type AccountBalances as Balances,
} from "@/lib/account-balances";
const preview = { balances: null };
export default function AccountBalances({
  assets,
  ready,
  missing,
}: {
  assets: number;
  ready: boolean;
  missing: number;
}) {
  const { demo } = useProduct();
  const records = useResource<{ balances: Balances | null }>(
    "account-balances",
    demo ? preview : undefined,
  );
  const b = records.data?.balances;
  const [editing, setEditing] = useState(false),
    [debt, setDebt] = useState(""),
    [managed, setManaged] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    setDebt(b ? String(b.margin_debt) : "");
    setManaged(b?.managed_value == null ? "" : String(b.managed_value));
    setConfirmed(b?.managed_value != null);
  }, [b]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (demo) throw Error("Sign in to save balances.");
      if (managed.trim() && !confirmed)
        throw Error(
          "Confirm that managed investments are separate from listed holdings.",
        );
      await api("account-balances", {
        margin_debt: parseAccountMoney(debt),
        managed_value: parseAccountMoney(managed, true),
      });
      setEditing(false);
      records.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="account-equity">
      <div className="account-equity-primary">
        <span className="eyebrow">
          {b ? "Net equity · USD" : "Priced assets & cash · USD"}
        </span>
        <div className="balance">
          {ready ? amount(b ? accountEquity(assets, b) : assets) : "—"}
        </div>
        <small>
          {b
            ? "Listed assets + managed balance − margin debt"
            : "Your recorded holdings and cash at available prices"}
        </small>
      </div>
      <dl className="account-equity-breakdown">
        <div data-tone="blue">
          <dt>Listed assets & cash</dt>
          <dd>{ready ? amount(assets) : "—"}</dd>
          <small>Available USD prices</small>
        </div>
        <div data-tone="green">
          <dt>Managed investments</dt>
          <dd>
            {b?.managed_value == null ? "Not entered" : amount(b.managed_value)}
          </dd>
          <small>Separate recorded balance</small>
        </div>
        <div data-tone="amber">
          <dt>Margin debt</dt>
          <dd>{b ? "−" + amount(b.margin_debt) : "Not entered"}</dd>
          <small>Deducted from net equity</small>
        </div>
      </dl>
      {b && (missing > 0 || b.managed_value == null) && (
        <p className="balance-caption">
          Partial equity:{" "}
          {missing > 0 ? `${missing} unpriced holdings excluded. ` : ""}
          {b.managed_value == null
            ? "Managed portfolio not included until its exact value is entered."
            : ""}
        </p>
      )}
      {b?.updated_at && (
        <small className="account-balance-date">
          Balances recorded {quoteTime(b.updated_at)} · manual values
        </small>
      )}
      {records.error && (
        <p className="balance-caption">
          Margin and managed balances unavailable; shown total is gross listed
          assets.
        </p>
      )}
      {!editing && (
        <button
          type="button"
          className="text-button account-balance-edit"
          onClick={() => setEditing(true)}
        >
          Edit margin & managed balance
        </button>
      )}
      {editing && (
        <form onSubmit={save} className="account-balance-form" noValidate>
          <div className="account-balance-form-head">
            <strong>Account balances</strong>
            <span>USD · update when your broker balance changes</span>
          </div>
          <div className="account-balance-fields">
            <label>
              Margin used
              <div className="account-money-input">
                <span aria-hidden="true">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label="Margin used in USD"
                  value={debt}
                  onChange={(e) => setDebt(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <small>Deducted from your net equity.</small>
            </label>
            <label>
              Managed investments
              <div className="account-money-input">
                <span aria-hidden="true">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label="Managed investments in USD"
                  value={managed}
                  onChange={(e) => {
                    setManaged(e.target.value);
                    setConfirmed(false);
                  }}
                  placeholder="Exact balance, or leave blank"
                />
              </div>
              <small>Added separately to your listed holdings.</small>
            </label>
          </div>
          <label className="account-balance-confirm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Managed investments are not already in my holdings.
          </label>
          {message && (
            <p className="account-balance-error" role="alert">
              {message}
            </p>
          )}
          <div className="account-balance-actions">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setMessage("");
                setDebt(b ? String(b.margin_debt) : "");
                setManaged(
                  b?.managed_value == null ? "" : String(b.managed_value),
                );
                setConfirmed(b?.managed_value != null);
              }}
            >
              Cancel
            </button>
            <button type="submit" disabled={busy || !!demo}>
              {busy ? "Saving…" : "Save balances"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
