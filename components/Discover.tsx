"use client";
import { researchEdge } from "@/lib/edge-research";
import { verifiedResearch } from "@/lib/comparison";
import { sameProviderSymbol, providerSymbol } from "@/lib/provider-symbol";
import PaceGuidance from "./PaceGuidance";
import PaceHelp from "./PaceHelp";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search as SearchIcon, Save } from "lucide-react";
import { useProduct, useResource } from "./Session";
import { readResource } from "@/lib/resource-cache";
import { api } from "@/lib/client";
import { perspective } from "@/lib/analysis";
import { amount, percent } from "@/lib/format";
import type { Research } from "@/lib/types";
import { Empty, PageHeading, SecurityLogo, Notice, Help } from "./Ui";
export default function Discover({ embedded = false }: { embedded?: boolean }) {
  const { workspace, demo, cache } = useProduct(),
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "",
    [draft, setDraft] = useState(""),
    [rows, setRows] = useState<Research[]>([]),
    [filter, setFilter] = useState("all"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [coverage, setCoverage] = useState({ requested: 0, returned: 0 });
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
        ? [...new Set(draft.split(/[ ,]+/).filter(Boolean).map(providerSymbol))]
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
                : readResource<Research>(
                    cache,
                    `research/${encodeURIComponent(s.replace("/", "-"))}`,
                    300000,
                    () =>
                      api<Research>(
                        `research/${encodeURIComponent(s.replace("/", "-"))}`,
                      ),
                  ),
            ),
        );
        batch.forEach((v, j) => {
          if (
            v.status === "fulfilled" &&
            verifiedResearch(v.value, symbols[i + j])
          )
            result.push(v.value);
          else failed.push(symbols[i + j]);
        });
      }
      setRows(result);
      setCoverage({ requested: symbols.length, returned: result.length });
      if (failed.length)
        setMessage(
          `Could not verify ${failed.join(", ")}. Other results are ready; check the ticker or try again.`,
        );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }
  const values = useMemo(
    () =>
      rows
        .map((r) => ({
          r,
          p: perspective(r),
          edge: researchEdge(
            r,
            !!workspace?.positions.some(
              (p) =>
                sameProviderSymbol(p.symbol, r.company.symbol) &&
                p.quantity > 0,
            ),
            demo ? Date.parse(r.retrievedAt) : Date.now(),
          ),
        }))
        .filter(
          ({ p }) =>
            filter === "all" ||
            (filter === "cash" && p.last?.fcf != null && p.last.fcf > 0) ||
            (filter === "trend" && p.tech.trend === "Constructive") ||
            (filter === "zone" &&
              p.dca.confirmed &&
              p.dca.confirmed.multiplier >= 2),
        ),
    [rows, filter, workspace?.positions, demo],
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
      {!embedded && (
        <PageHeading
          title="Discover with a purpose."
          subtitle="Screen a focused universe using the same research shown on each company."
        />
      )}
      <p className="small muted">
        Your selected universe only · up to 12 instruments per requested scan.
        No market-wide ranking or automatic background scan.
      </p>
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
      <div className="analyst-controls discover-controls">
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
      {!!coverage.requested && (
        <p className="context-note">
          Evidence returned for {coverage.returned} of {coverage.requested}{" "}
          requested instruments · {values.length} match the selected filter.
          Missing values do not count as matches.
        </p>
      )}
      {message && <Notice>{message}</Notice>}
      {values.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>AURYN View</th>
                <th>Cash after capex</th>
                <th>Revenue growth</th>
                <th>Trend</th>
                <th>
                  AURYN Pace <PaceHelp />
                </th>
              </tr>
            </thead>
            <tbody>
              {values.map(({ r, p, edge }) => (
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
                  <td>
                    <strong
                      className={
                        edge.tone === "risk"
                          ? "red"
                          : edge.tone === "positive"
                            ? "green"
                            : ""
                      }
                    >
                      {edge.assessment}
                    </strong>
                    <small className="block">
                      {edge.decision.contextLabel} · {edge.reason}
                    </small>
                    <small className="block">
                      New purchase: {edge.decision.actions.entry} · Holding:{" "}
                      {edge.decision.actions.holding}
                    </small>
                  </td>
                  <td>
                    {amount(p.last?.fcf, p.last?.currency, true)}
                    <small className="block">
                      {p.periodBasis} · {p.last?.end ?? "Period unavailable"}
                    </small>
                  </td>
                  <td>{percent(p.growth)}</td>
                  <td>{p.tech.trend}</td>
                  <td>
                    <PaceGuidance
                      view={edge.pacePresentation}
                      readings={edge.pacePeriods}
                      compact
                    />
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
          Scan up to twelve companies from your watchlist, holdings or tickers.
          A filter match is a research lead, not a recommendation.
        </Empty>
      )}
    </section>
  );
}
