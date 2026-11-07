"use client";
import { useMemo, useState } from "react";
import type { OptionContract } from "@/lib/options-analysis";
import { api } from "@/lib/client";
import {
  newSimulationLedger,
  openSimulation,
  closeSimulation,
  simulationSummary,
  simulationQuoteIssue,
  cleanSimulationLedger,
  type SimulationLedger,
} from "@/lib/options-simulation";
import { useProduct, useResource } from "./Session";
import styles from "./OptionsSimulation.module.css";
type Props = {
  contracts: OptionContract[];
  symbol: string;
  spot: number;
  disabled?: boolean;
};
const usd = (n: number | null) =>
  n === null
    ? "Unavailable"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
export default function OptionsSimulation(props: Props) {
  const { owner, demo } = useProduct();
  return (
    <Wallet key={`${owner}:${demo}`} {...props} owner={owner} demo={!!demo} />
  );
}
function Wallet({
  contracts,
  symbol,
  spot,
  disabled = false,
  owner,
  demo,
}: Props & { owner: string; demo: boolean }) {
  const [ledger, setLedger] = useState<SimulationLedger>(newSimulationLedger),
    [selected, setSelected] = useState(""),
    [quantity, setQuantity] = useState("1"),
    [notes, setNotes] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [closeQuantities, setCloseQuantities] = useState<Record<string, string>>(
      {},
    );
  const account = useResource<{
    documents: { key: string; body: { simulationLedger?: unknown } }[];
  }>("documents?kind=view", demo ? { documents: [] } : undefined);
  const localKey = `auryn-options-simulation-v1:${demo ? "demo" : owner}`;
  const available = useMemo(
    () => contracts.filter((c) => !simulationQuoteIssue(c)),
    [contracts],
  );
  const nearest = available.reduce<OptionContract | undefined>(
    (best, contract) =>
      !best ||
      (Number.isFinite(spot) &&
        Math.abs(contract.strike - spot) < Math.abs(best.strike - spot))
        ? contract
        : best,
    undefined,
  );
  const chosen = available.find((c) => c.id === selected) ?? nearest;
  const totalPremium =
    chosen &&
    Number.isInteger(Number(quantity)) &&
    Number(quantity) > 0 &&
    Number(quantity) <= 100
      ? chosen.ask! * 100 * Number(quantity)
      : null;
  const summary = simulationSummary(ledger, contracts);
  const accountSaved = account.data?.documents.find(
    (d) => d.key === "options-simulation",
  )?.body.simulationLedger;
  function transact(run: () => SimulationLedger) {
    try {
      setLedger(run());
      setStatus("Simulation updated. Save explicitly to keep this ledger.");
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : "Simulation could not be updated.",
      );
    }
  }
  function saveDevice() {
    try {
      localStorage.setItem(localKey, JSON.stringify(ledger));
      setStatus("Saved on this device for this profile.");
    } catch {
      setStatus("Device storage is unavailable.");
    }
  }
  function loadDevice() {
    try {
      const stored = localStorage.getItem(localKey),
        next = stored ? cleanSimulationLedger(JSON.parse(stored)) : null;
      if (!next) throw Error();
      setLedger(next);
      setStatus(
        "Device ledger loaded. It replaces the current working ledger.",
      );
    } catch {
      setStatus("No valid saved device ledger was found.");
    }
  }
  async function saveAccount() {
    setBusy(true);
    try {
      await api("documents", {
        kind: "view",
        key: "options-simulation",
        body: { name: "Options simulation", simulationLedger: ledger },
      });
      account.refresh();
      setStatus("Simulation saved to your account.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Account save failed.");
    } finally {
      setBusy(false);
    }
  }
  function loadAccount() {
    const next = cleanSimulationLedger(accountSaved);
    if (!next) {
      setStatus("No valid account ledger was found.");
      return;
    }
    setLedger(next);
    setStatus("Account ledger loaded. It replaces the current working ledger.");
  }
  return (
    <section className={styles.wallet} aria-label="Options paper wallet">
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>PAPER WALLET</span>
          <h3>Practice an option trade</h3>
          <p>Simulation only · $100,000 starting cash. No real orders.</p>
          <p>
            Choose a contract and quantity, review the premium, then simulate
            buying at the ask. One standard contract represents 100 shares.
          </p>
        </div>
        <span className={styles.badge}>SIMULATED</span>
      </header>
      <div className={styles.metrics}>
        {(
          [
            ["Simulated cash", usd(ledger.cash)],
            ["Realized P/L", usd(summary.realized)],
            ["Open marked P/L", usd(summary.marked)],
            ["Simulated equity", usd(summary.equity)],
            [
              "Closed-position win rate",
              summary.winRate === null
                ? "No closed positions"
                : `${Math.round(summary.winRate * 100)}% · ${summary.closedPositions} closed`,
            ],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <details className={styles.help}>
        <summary>Simulation assumptions</summary>
        <p>
          Fully paid long calls and puts; no broker connection. You can lose the
          entire premium. Entries use the supplied ask; exits and open marks use
          the supplied bid. Quotes must be no more than three calendar days old
          and cannot be future dated. Fees and slippage are excluded.{" "}
          {summary.unpriced > 0
            ? `${summary.unpriced} open position(s) lack a valid quote; total marks and equity are withheld.`
            : ""}
        </p>
      </details>
      <div className={styles.tradingDesk}>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (!chosen) return;
            transact(() =>
              openSimulation(ledger, {
                contract: chosen,
                symbol,
                quantity: Number(quantity),
                notes,
              }),
            );
          }}
        >
          <label>
            1. Choose a {symbol} contract
            <select
              value={chosen?.id ?? ""}
              disabled={disabled || busy || !chosen}
              onChange={(e) => setSelected(e.target.value)}
            >
              {!available.length && (
                <option value="">No eligible fresh quotes</option>
              )}
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.expiry} · {c.strike} {c.type} · ask {usd(c.ask)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contracts
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={quantity}
              disabled={disabled || busy}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <details className={styles.notes}>
            <summary>Add practice notes</summary>
            <label>
              Trade notes
              <textarea
                value={notes}
                maxLength={500}
                rows={2}
                disabled={disabled || busy}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thesis, risk, and what you want to learn"
              />
            </label>
          </details>
          <div className={styles.order}>
            <div className={styles.review}>
              <span>2. Review cost</span>
              <strong>Total premium {usd(totalPremium)}</strong>
              <span>
                Maximum loss {usd(totalPremium)} · premiums paid in full
              </span>
              <small>
                {chosen
                  ? `Ask ${usd(chosen.ask)} × 100 shares × ${quantity} contract(s) · quote ${chosen.observed}`
                  : "Load a fresh standard-contract chain to practice."}
              </small>
              {Number.isFinite(spot) && spot > 0 && (
                <small>
                  Underlying reference {usd(spot)} · not a verified expiry close
                </small>
              )}
            </div>
            <button type="submit" disabled={disabled || busy || !chosen}>
              3. Simulate buy at ask
            </button>
          </div>
        </form>
        <div className={styles.positions}>
          <h4>Simulation ledger</h4>
          {!ledger.positions.length && (
            <p>
              Your practice trades will appear here. Buying subtracts the
              premium from simulated cash. Review each position’s marked gain or
              loss, then simulate closing it at an available bid. Save
              explicitly to keep your practice ledger.
            </p>
          )}
          {ledger.positions.map((p) => {
            const quote = contracts.find((c) => c.id === p.contract.id);
            const issue = quote
              ? simulationQuoteIssue(quote)
              : "Load a current quote for this exact contract to close.";
            const expired =
              Date.now() >= Date.parse(p.contract.expiry + "T21:00:00Z");
            const realized = p.exits.reduce(
              (n, e) => n + (e.premium - p.entryPremium) * 100 * e.quantity,
              0,
            );
            return (
              <article key={p.id} className={styles.position}>
                <div>
                  <strong>
                    {p.symbol} · {p.contract.strike} {p.contract.type} ·{" "}
                    {p.contract.expiry}
                  </strong>
                  <p>
                    {p.remaining} of {p.quantity} open · entry{" "}
                    {usd(p.entryPremium)} · realized {usd(realized)}
                  </p>
                  <small>
                    {p.contract.id} · opened {p.openedAt.slice(0, 10)} · entry
                    source {p.contract.observed}
                  </small>
                  {p.notes && <p className={styles.tradeNote}>{p.notes}</p>}
                  {p.exits.map((exit, i) => (
                    <small className={styles.exit} key={i}>
                      Closed {exit.quantity} at bid {usd(exit.premium)} · quote{" "}
                      {exit.observed} · recorded {exit.at.slice(0, 10)}
                    </small>
                  ))}
                </div>
                {p.remaining > 0 && (
                  <div className={styles.close}>
                    <label>
                      Contracts to close
                      <input
                        aria-label={`Contracts to close ${p.contract.id}`}
                        type="number"
                        min="1"
                        max={p.remaining}
                        step="1"
                        value={closeQuantities[p.id] ?? "1"}
                        disabled={disabled || busy}
                        onChange={(e) =>
                          setCloseQuantities({
                            ...closeQuantities,
                            [p.id]: e.target.value,
                          })
                        }
                      />
                    </label>
                    <button
                      disabled={disabled || busy || !!issue}
                      onClick={() =>
                        quote &&
                        transact(() =>
                          closeSimulation(
                            ledger,
                            p.id,
                            Number(closeQuantities[p.id] ?? "1"),
                            quote,
                          ),
                        )
                      }
                    >
                      Simulate close at bid
                    </button>
                    <small>
                      {expired
                        ? "Settlement pending. A verified underlying closing price dated at expiry is required; this wallet does not infer settlement from current spot."
                        : (issue ??
                          `Bid ${usd(quote!.bid)} · source ${quote!.observed}`)}
                    </small>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
      <footer className={styles.saving}>
        <details>
          <summary>Save &amp; load ledger</summary>
          <div className={styles.saveActions}>
            <button disabled={busy} onClick={saveDevice}>
              Save on device
            </button>
            <button disabled={busy} onClick={loadDevice}>
              Load device ledger
            </button>
            <button
              disabled={demo || busy || !account.data || !!account.error}
              onClick={() => void saveAccount()}
            >
              {busy ? "Saving…" : "Save to account"}
            </button>
            <button
              disabled={demo || busy || !accountSaved || !!account.error}
              onClick={loadAccount}
            >
              Load account ledger
            </button>
          </div>
          <p>
            Saving is explicit. Load replaces the working ledger. Device and
            account ledgers stay separate until you choose to save or load.
            Limited to 15 positions and 45 exits.
          </p>
          {demo && <p>Sign in to save across devices.</p>}
          {account.error && <p>Account ledger unavailable: {account.error}</p>}
        </details>
        <p role="status" aria-live="polite">
          {status}
        </p>
      </footer>
    </section>
  );
}
