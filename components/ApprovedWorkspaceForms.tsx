"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Position } from "@/lib/types";
import { api } from "@/lib/client";
import { useProduct, useResource } from "./Session";
import { Notice } from "./Ui";

export function PositionEditor({
  position,
  onClose,
  cashDefault = false,
}: {
  position: Position | null;
  onClose: () => void;
  cashDefault?: boolean;
}) {
  const { mutate } = useProduct();
  const dialog = useRef<HTMLDialogElement>(null);
  const [symbol, setSymbol] = useState(position?.symbol ?? "");
  const [quantity, setQuantity] = useState(
    position ? String(position.quantity) : "",
  );
  const [cost, setCost] = useState(position ? String(position.cost) : "");
  const [currency, setCurrency] = useState(
    position ? position.currency || "" : "USD",
  );
  const [cash, setCash] = useState(
    position ? position.assetType === "cash" : cashDefault,
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate({
        op: "position",
        id: position?.id,
        symbol: cash ? "USD" : symbol,
        quantity: Number(quantity),
        cost: cash ? 1 : Number(cost),
        assetType: cash ? "cash" : "stock",
        currency: cash ? "USD" : currency,
      });
      dialog.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Position could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await mutate({ op: "remove-position", id: position?.id });
      dialog.current?.close();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Position could not be removed.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="dialog approved-workspace-dialog portfolio-editor"
      aria-labelledby="approved-position-title"
      onClose={onClose}
    >
      <div className="dialog-head">
        <span className="eyebrow">YOUR HOLDINGS</span>
        <button
          className="icon-button"
          type="button"
          aria-label="Close position editor"
          onClick={() => dialog.current?.close()}
        >
          <X size={20} />
        </button>
      </div>
      <h2 id="approved-position-title">
        {position ? "Edit position" : "Add a position"}
      </h2>
      <p>Update your records. No trade will be placed.</p>
      <form onSubmit={save}>
        <label className="approved-check">
          <input
            type="checkbox"
            checked={cash}
            onChange={(e) => setCash(e.target.checked)}
          />
          Record USD cash
        </label>
        {!cash && (
          <label>
            Ticker or crypto pair
            <input
              autoFocus
              required
              maxLength={20}
              value={symbol}
              placeholder="Company ticker or crypto pair"
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </label>
        )}
        <div className="two-grid">
          <label>
            {cash ? "Cash balance" : "Shares / units"}
            <input
              required
              type="number"
              min="0.00000001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          {!cash && (
            <label>
              Average cost
              <input
                required
                type="number"
                min="0"
                step="any"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </label>
          )}
        </div>
        {!cash && (
          <label>
            Cost currency
            <select
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="" disabled>
                Choose currency
              </option>
              {[
                ...new Set([
                  "USD",
                  "EUR",
                  "CAD",
                  "GBP",
                  ...(/^[A-Z]{3}$/.test(currency) ? [currency] : []),
                ]),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        {error && <Notice error>{error}</Notice>}
        <button className="btn primary" disabled={busy}>
          {busy ? "Saving…" : "Save position"}
        </button>
      </form>
      {position && (
        <div className="approved-remove">
          {removing ? (
            <>
              <p>Remove this holding from your records?</p>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={remove}
              >
                Remove holding
              </button>
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => setRemoving(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="text-link negative"
              disabled={busy}
              onClick={() => setRemoving(true)}
            >
              Remove holding
            </button>
          )}
        </div>
      )}
    </dialog>
  );
}

/** Edits only the thesis field and retains each company's other recorded research fields. */
export function WatchlistNote({ symbols }: { symbols: string[] }) {
  const { demo } = useProduct();
  const records = useResource<{
    documents: { key: string; body: Record<string, string> }[];
  }>("documents?kind=note", demo ? { documents: [] } : undefined);
  const [symbol, setSymbol] = useState(symbols[0] ?? ""),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const selected = symbols.includes(symbol) ? symbol : (symbols[0] ?? "");
  const saved = records.data?.documents.find((d) => d.key === selected);
  useEffect(() => {
    setText(saved?.body.thesis ?? "");
    setMessage("");
  }, [selected, saved]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (demo) throw Error("Sign in to save your research note.");
      if (!records.data || records.error)
        throw Error(
          "Load your existing notes before saving so your research stays intact.",
        );
      await api("documents", {
        kind: "note",
        key: selected,
        body: { ...saved?.body, thesis: text },
      });
      records.refresh();
      setMessage("Your reason is saved with this company’s research.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save your note.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="approved-watch-note">
      {symbols.length ? (
        <>
          <label>
            Company
            <select
              value={selected}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {symbols.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="sr-only" htmlFor="approved-watch-note">
            Your reason for following {selected}
          </label>
          <textarea
            id="approved-watch-note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={3000}
            placeholder="What would you want to see before adding this company?"
          />
          <button
            className="btn"
            disabled={busy || records.loading || !!records.error || !!demo}
          >
            {busy ? "Saving…" : "Save note"}
          </button>
        </>
      ) : (
        <p>Save a company to write the evidence you want to see next.</p>
      )}
      {(records.error || message) && (
        <p role="status">{records.error || message}</p>
      )}
    </form>
  );
}
