"use client";
import { useState } from "react";
import type { Research } from "@/lib/types";
import { tradeReference } from "@/lib/trade-reference";
export default function TradeReference({
  research,
  inputs,
}: {
  research: Research;
  inputs: {
    capital: number;
    risk: number;
    entry: number;
    stop: number;
    target: number;
    slippage: number;
  };
}) {
  const [message, setMessage] = useState(""),
    brief = tradeReference(research, inputs);
  if (!brief) return null;
  return (
    <section className="trade-reference">
      <div>
        <h4>Take your plan to your broker</h4>
        <p>
          {brief.fresh
            ? "A dated quote is available. Broker checks are still required."
            : "Recheck the current quote before relying on this plan."}
        </p>
      </div>
      <button
        type="button"
        className="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(brief.text);
            setMessage("Manual trade reference copied. No order submitted.");
          } catch {
            setMessage(
              "Clipboard unavailable. Open the reference below to select its text.",
            );
          }
        }}
      >
        Copy trade reference
      </button>
      <details>
        <summary>Review plan & execution checks</summary>
        <pre>{brief.text}</pre>
      </details>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
