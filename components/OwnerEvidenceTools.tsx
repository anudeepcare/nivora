"use client";
import OwnerValidation from "./OwnerValidation";
import { useState } from "react";
import { api } from "@/lib/client";
export default function OwnerEvidenceTools() {
  const [symbol, setSymbol] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <OwnerValidation />
      <section className="support">
        <h2>Public Pace record</h2>
        <p>
          Publish the latest completed signal with a fresh reference quote. This
          is a public, append-only observation; existing records cannot be
          edited. No holdings or private notes are included.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await api<{ published_at: string }>("pace-record", {
                symbol,
              });
              setMessage("Published at " + r.published_at);
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Publication failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Stock symbol
            <input
              value={symbol}
              maxLength={15}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </label>
          <button className="button" disabled={busy || !symbol}>
            Publish observation
          </button>
        </form>
        {message && <p role="status">{message}</p>}
        <a href="/track-record">Open public methodology and records →</a>
      </section>
    </>
  );
}
