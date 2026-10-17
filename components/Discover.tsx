"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search as SearchIcon, Save } from "lucide-react";
import { useProduct, useResource } from "./Session";
import { api } from "@/lib/client";
import { perspective } from "@/lib/analysis";
import { symbolInput, amount, percent } from "@/lib/format";
import type { Research } from "@/lib/types";
import { Empty, PageHeading, SecurityLogo, Notice, Help } from "./Ui";
export default function Discover() {
  const { workspace, demo } = useProduct(),
    prefix = demo ? "/preview" : "",
    [draft, setDraft] = useState(""),
    [rows, setRows] = useState<Research[]>([]),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const preview = useMemo(() => (demo ? { documents: [] } : undefined), [demo]),
    saved = useResource<{
      documents: {
        key: string;
        body: { name: string; symbols: string[]; filter: string };
      }[];
    }>("documents?kind=view", preview);
  const universe = [
    ...new Set([
      ...(workspace?.watchlist.map((w) => w.symbol) || []),
      ...(workspace?.positions
        .filter((p) => p.assetType !== "cash")
        .map((p) => p.symbol) || []),
    ]),
  ].slice(0, 12);
  async function scan(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const symbols = draft.trim()
        ? [...new Set(draft.split(/[ ,]+/).filter(Boolean).map(symbolInput))]
        : universe;
      if (!symbols.length || symbols.length > 12)
        throw Error("Choose between one and twelve companies.");
      const result: Research[] = [],
        failed: string[] = [];
      for (let i = 0; i < symbols.length; i += 3) {
        const batch = await Promise.allSettled(
          symbols
            .slice(i, i + 3)
            .map((s) =>
              demo
                ? Promise.resolve(demo.research[s])
                : api<Research>(
                    `research/${encodeURIComponent(s.replace("/", "-"))}`,
                  ),
            ),
        );
        batch.forEach((v, j) => {
          if (v.status === "fulfilled" && v.value) result.push(v.value);
          else failed.push(symbols[i + j]);
        });
      }
      setRows(result);
      if (failed.length) setMessage(`No response for ${failed.join(", ")}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }
  const values = useMemo(
    () =>
      rows
        .map((r) => ({ r, p: perspective(r) }))
        .filter(
          ({ p }) =>
            filter === "all" ||
            (filter === "cash" && p.last?.fcf != null && p.last.fcf > 0) ||
            (filter === "trend" && p.tech.trend === "Constructive") ||
            (filter === "zone" &&
              p.dca.confirmed &&
              p.dca.confirmed.multiplier >= 2),
        ),
    [rows, filter],
  );
  async function save() {
    try {
      if (demo) throw Error("Saving a screen requires your signed-in account.");
      await api("documents", {
        kind: "view",
        key: "discovery",
        body: {
          name: "My research screen",
          symbols: rows.map((r) => r.company.symbol),
          filter,
        },
      });
      saved.refresh();
      setMessage("Screen saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    }
  }
  return (
    <section>
      <PageHeading
        title="Discover with a purpose."
        subtitle="Screen a focused universe using the same research shown on each company."
      />
      {saved.data?.documents.length ? (
        <div className="source-line">
          Saved screens:{" "}
          {saved.data.documents.map((v) => (
            <button
              className="text-button"
              key={v.key}
              onClick={() => {
                setDraft(v.body.symbols.join(", "));
                setFilter(v.body.filter || "all");
                setRows([]);
                setMessage(
                  "Saved criteria loaded. Screen companies to refresh the evidence.",
                );
              }}
            >
              {v.body.name}
            </button>
          ))}
        </div>
      ) : null}
      <form className="compare-search" onSubmit={scan}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
          aria-label="Screen symbols"
          placeholder={
            universe.length
              ? `Use your ${universe.length} saved companies, or enter tickers`
              : "Enter up to 12 tickers, separated by commas"
          }
        />
        <button className="button primary" disabled={busy}>
          <SearchIcon size={16} />
          {busy ? "Reviewing sources…" : "Screen companies"}
        </button>
      </form>
      <div className="analyst-controls">
        <div className="segment">
          {[
            ["all", "All"],
            ["cash", "Positive cash flow"],
            ["trend", "Constructive trend"],
            ["zone", "Accumulation zones"],
          ].map(([key, label]) => (
            <button
              key={key}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="button" disabled={!rows.length} onClick={save}>
          <Save size={16} />
          Save screen
        </button>
      </div>
      {message && <Notice>{message}</Notice>}
      {values.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Business</th>
                <th>Annual FCF</th>
                <th>Revenue growth</th>
                <th>Trend</th>
                <th>Monthly</th>
              </tr>
            </thead>
            <tbody>
              {values.map(({ r, p }) => (
                <tr key={r.company.symbol}>
                  <td>
                    <Link
                      className="investment-identity"
                      href={`${prefix}/research/${encodeURIComponent(r.company.symbol.replace("/", "-"))}`}
                    >
                      <SecurityLogo symbol={r.company.symbol} />
                      <span>
                        <b>{r.company.symbol}</b>
                        <small>{r.company.name}</small>
                      </span>
                    </Link>
                  </td>
                  <td>{p.business}</td>
                  <td>{amount(p.last?.fcf, p.last?.currency, true)}</td>
                  <td>{percent(p.growth)}</td>
                  <td>{p.tech.trend}</td>
                  <td>
                    {p.dca.confirmed ? `${p.dca.confirmed.multiplier}×` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title={
            rows.length
              ? "No companies match this filter"
              : "Start with companies you want to understand"
          }
        >
          Screening uses a deliberately bounded universe to protect your data
          allowance. A filter match is a research lead, not a recommendation.
        </Empty>
      )}
    </section>
  );
}
