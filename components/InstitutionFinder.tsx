"use client";
import { useState } from "react";
import { useResource } from "./Session";
import InstitutionDetail from "./InstitutionDetail";
import type { InstitutionPage } from "@/lib/institution-directory";
import { amount } from "@/lib/format";
import styles from "./InstitutionFinder.module.css";
export default function InstitutionFinder() {
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(""),
    [query, setQuery] = useState({ q: "", offset: 0, quarter: "" }),
    [selected, setSelected] = useState("");
  const p = new URLSearchParams({ q: query.q, offset: String(query.offset) });
  if (query.quarter) p.set("quarter", query.quarter);
  const r = useResource<InstitutionPage>(
    open ? `institution-directory?${p}` : null,
    undefined,
    300000,
  );
  return (
    <details
      className={styles.finder}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>Find an institution · reported equity holdings</summary>
      {open && (
        <>
          <p>
            Search reported 13F filers by name. Reported equity value is not
            total firm assets or investment performance. Pages are ranked by
            reported equity value.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQuery({ q: draft.trim(), offset: 0, quarter: "" });
              setSelected("");
            }}
          >
            <label>
              Institution name
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={100}
                placeholder="Search institutions"
              />
            </label>
            <button className="btn" type="submit">
              Search institutions
            </button>
          </form>
          {r.loading ? (
            <p role="status">Loading institutions…</p>
          ) : r.error ? (
            <p role="alert">
              {r.error} <button onClick={r.refresh}>Retry</button>
            </p>
          ) : (
            r.data && (
              <>
                <p>
                  Snapshot {r.data.quarter}. {r.data.returnedCount} shown from
                  row {r.data.offset + 1}; {r.data.totalCount ?? "unknown"}{" "}
                  matching institutions. Retrieved {r.data.retrievedAt}.
                </p>
                {r.data.institutions.length === 0 ? (
                  <p>No matching institutions returned.</p>
                ) : (
                  <ul
                    className={styles.results}
                    tabIndex={0}
                    aria-label="Institution search results, scroll for more"
                  >
                    {r.data.institutions.map((i) => (
                      <li key={i.cik}>
                        <button
                          className="btn"
                          onClick={() => setSelected(i.cik)}
                          aria-pressed={selected === i.cik}
                        >
                          {i.displayName}
                        </button>{" "}
                        <span>
                          CIK {i.cik} ·{" "}
                          {i.totalValueUsd === null
                            ? "Value unavailable"
                            : amount(i.totalValueUsd, "USD", true)}{" "}
                          reported equity · {i.holdingsCount ?? "Unknown"}{" "}
                          holdings
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <nav aria-label="Institution finder pages">
                  <button
                    className="btn"
                    disabled={query.offset === 0}
                    onClick={() =>
                      setQuery({
                        ...query,
                        offset: Math.max(0, query.offset - 50),
                        quarter: r.data!.quarter,
                      })
                    }
                  >
                    Previous institutions
                  </button>
                  <button
                    className="btn"
                    disabled={!r.data.canNext}
                    onClick={() =>
                      setQuery({
                        ...query,
                        offset: query.offset + 50,
                        quarter: r.data!.quarter,
                      })
                    }
                  >
                    Next institutions
                  </button>
                </nav>
                {query.offset === 1000 && (
                  <p>
                    Interactive limit reached. Narrow the institution name
                    search.
                  </p>
                )}
              </>
            )
          )}
          {selected && <InstitutionDetail key={selected} cik={selected} />}
        </>
      )}
    </details>
  );
}
