"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type { Catalog, CatalogKind } from "@/lib/screener-catalog";
import s from "./GlobalEarningsCalendar.module.css";
export default function ScreenerCatalog({
  universe,
}: {
  universe: "STOCK" | "ETF";
}) {
  const [kind, setKind] = useState<CatalogKind | null>(null);
  return (
    <details>
      <summary>Explore available fields and screen ideas</summary>
      <p className={s.note}>
        Discover the provider catalog and curated presets, not your saved
        screens. These plans are inspected here, not executed. Current AURYN
        screen controls support a smaller validated subset.
      </p>
      <div
        className="auryn-detail-tabs"
        role="group"
        aria-label="Screener catalog view"
      >
        <button
          type="button"
          onClick={() => setKind("fields")}
          aria-pressed={kind === "fields"}
        >
          Browse fields
        </button>
        <button
          type="button"
          onClick={() => setKind("screens")}
          aria-pressed={kind === "screens"}
        >
          Browse curated screens
        </button>
      </div>
      {kind && (
        <CatalogContent
          key={`${universe}:${kind}`}
          kind={kind}
          universe={universe}
        />
      )}
    </details>
  );
}
function CatalogContent({
  kind,
  universe,
}: {
  kind: CatalogKind;
  universe: "STOCK" | "ETF";
}) {
  const resource = useResource<Catalog & { receivedAt: string }>(
      `screener-catalog?kind=${kind}`,
      undefined,
      300000,
    ),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    data = resource.data;
  const query = search.trim().toLowerCase();
  const fields =
    data?.kind === "fields"
      ? (universe === "STOCK" ? data.stock : data.etf).filter((f) =>
          `${f.name} ${f.label} ${f.group} ${f.description}`
            .toLowerCase()
            .includes(query),
        )
      : [];
  const screens =
    data?.kind === "screens"
      ? data.screens.filter(
          (p) =>
            p.universe === universe &&
            `${p.name} ${p.summary}`.toLowerCase().includes(query),
        )
      : [];
  const total = kind === "fields" ? fields.length : screens.length;
  return (
    <div className={s.root}>
      <div className={s.filters}>
        <label>
          Find {kind === "fields" ? "a field" : "a screen"}
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      {resource.loading ? (
        <p role="status">Loading catalog…</p>
      ) : resource.error ? (
        <p role="status">{resource.error}</p>
      ) : data ? (
        <>
          <p className={s.note}>
            {total} matching {universe === "ETF" ? "ETF" : "stock"} {kind}.
            Received {data.receivedAt}.
          </p>
          {!total && <p>No matching entries in the returned catalog.</p>}
          {fields.slice(page * 20, (page + 1) * 20).map((f) => (
            <details key={f.name}>
              <summary>
                {f.label} · {f.group} · {f.unit}
              </summary>
              <p>{f.description}</p>
              <p className={s.note}>
                Field: {f.name}. Type: {f.type}. Comparisons: {f.ops.join(", ")}
                . Sortable: {f.sortable ? "Yes" : "No"}.
              </p>
              {f.options.length > 0 && (
                <ul>
                  {f.options.map((o, i) => (
                    <li key={i}>
                      {o.value}: {o.label}
                    </li>
                  ))}
                </ul>
              )}
              {f.values.length > 0 && (
                <p className={s.note}>
                  Available values: {f.values.join(", ")}
                </p>
              )}
            </details>
          ))}
          {screens.slice(page * 20, (page + 1) * 20).map((p) => (
            <details key={p.id}>
              <summary>{p.name}</summary>
              <p>{p.summary}</p>
              <ul>
                {p.filters.map((f, i) => (
                  <li key={i}>
                    {f.fieldName} {f.op} {f.value ?? f.values.join(", ")}
                  </li>
                ))}
              </ul>
              <p className={s.note}>
                All conditions are required.{" "}
                {p.sort
                  ? `Sort: ${p.sort.fieldName} ${p.sort.dir}.`
                  : "No sort supplied."}{" "}
                This is a provider recipe, not a recommendation or a saved
                personal screen. Units and comparison meanings should be checked
                in the field catalog.
              </p>
            </details>
          ))}
        </>
      ) : null}
      <div className={s.controls} role="group" aria-label="Catalog pagination">
        <button
          type="button"
          disabled={resource.loading}
          onClick={() => {
            setPage(0);
            resource.refresh();
          }}
        >
          Check catalog again
        </button>
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {Math.max(1, Math.ceil(total / 20))}
        </span>
        <button
          type="button"
          disabled={(page + 1) * 20 >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
      <details>
        <summary>Source and freshness</summary>
        <p className={s.note}>
          SentiSense screener fields and curated screens. Server cache 15
          minutes, client cache 5 minutes; the loaded view can be older. The
          contract has no generation timestamp or preview flag. Field metadata
          and recipes may change or retire. No provider plan is submitted from
          this catalog.
        </p>
      </details>
    </div>
  );
}
