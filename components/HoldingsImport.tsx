"use client";
import { useRef, useState } from "react";
import { parseHoldingsCsv } from "@/lib/planning";
import { api } from "@/lib/client";
import { useProduct } from "./Session";
import { amount } from "@/lib/format";
export default function HoldingsImport() {
  const { demo, reloadWorkspace } = useProduct(),
    [rows, setRows] = useState<ReturnType<typeof parseHoldingsCsv>>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [filename, setFilename] = useState(""),
    request = useRef("");
  return (
    <details className="holdings-import">
      <summary>Import holdings from CSV</summary>
      <p>
        Columns: symbol, quantity, cost, currency. Cost is the average cost per
        unit. Review before importing; existing positions remain unchanged.
      </p>
      <label className="csv-upload">
        <span>Choose CSV</span>
        <input
          aria-label="Choose holdings CSV"
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setFilename(file.name);
            try {
              if (file.size > 1000000)
                throw Error("Use a CSV smaller than 1 MB.");
              setRows(parseHoldingsCsv(await file.text()));
              request.current = crypto.randomUUID();
              setMessage("Review all rows before confirming.");
            } catch (err) {
              setRows([]);
              setMessage(
                err instanceof Error ? err.message : "Could not read CSV.",
              );
            }
          }}
        />
        <small>{filename || "CSV · up to 1 MB"}</small>
      </label>
      {rows.length > 0 && (
        <>
          <div className="table-scroll">
            <table>
              <caption>{rows.length} new positions to import</caption>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Units</th>
                  <th>Cost per unit</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={i}>
                    <td>{p.symbol}</td>
                    <td>{p.quantity}</td>
                    <td>{amount(p.cost, p.currency)}</td>
                    <td>{p.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="button primary"
            disabled={busy || !!demo}
            onClick={async () => {
              setBusy(true);
              try {
                if (demo) throw Error("Sign in to import holdings.");
                await api("portfolio-import", {
                  rows,
                  requestId: request.current,
                });
                setRows([]);
                await reloadWorkspace();
                setMessage(
                  "Holdings imported. Portfolio exposure updates after quotes load.",
                );
              } catch (err) {
                setMessage(
                  err instanceof Error ? err.message : "Import failed.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Importing…" : "Confirm import"}
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => setRows([])}
          >
            Cancel
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}
