"use client";
import { useResource } from "./Session";
import IntelligenceTable from "./IntelligenceTable";
import { intelligenceView } from "@/lib/sentisense-view";
import type { SentiSenseResult } from "@/lib/sentisense-api";
import type { CongressDisclosure } from "@/lib/congress-disclosures";
import s from "./PublicOfficialsEvidence.module.css";
export default function PublicOfficialsEvidence({
  symbol,
}: {
  symbol: string;
}) {
  const a = useResource<SentiSenseResult>(
    `intelligence/${encodeURIComponent(symbol)}?dataset=politicians`,
  );
  const b = useResource<{
    rows: CongressDisclosure[];
    asOf: string;
    truncated: boolean;
  }>(`congress?symbol=${encodeURIComponent(symbol)}`);
  const readyA =
    !a.loading &&
    !a.error &&
    (a.data?.status === "available" || a.data?.status === "preview");
  const readyB = !b.loading && !b.error && !!b.data;
  const groups = readyA
    ? intelligenceView("politicians", a.data?.data).groups
    : [];
  const rows = readyB ? b.data!.rows : [];
  const count = groups.reduce((n, g) => n + g.rows.length, 0) + rows.length;
  const preview = !!a.data?.isPreview || a.data?.status === "preview";
  return (
    <section className={s.panel} aria-label="Public-official disclosures">
      <header>
        <h3>Public-official disclosures</h3>
        <button
          type="button"
          className="button"
          disabled={a.loading || b.loading}
          onClick={() => {
            a.refresh();
            b.refresh();
          }}
        >
          Refresh sources
        </button>
      </header>
      <p>
        Reported ranges, not exact trade values. Disclosures can lag
        transactions.
      </p>
      {(a.loading || b.loading) && (
        <p role="status">Checking disclosure sources…</p>
      )}
      {!a.loading && !readyA && (
        <p role="status">
          Source A unavailable. No substitute records are shown.
        </p>
      )}
      {!b.loading && !readyB && (
        <p role="status">
          Source B unavailable. No substitute records are shown.
        </p>
      )}
      {preview && (
        <p>
          Source A is a limited preview; absence does not establish complete
          coverage.
        </p>
      )}
      {readyA && readyB && !count && (
        <p className={s.empty}>
          No displayable disclosures returned from the checked sources. This
          does not prove no transactions occurred.
        </p>
      )}
      <div className={s.coverage}>
        <span>
          Source A ·{" "}
          {readyA
            ? `${groups.reduce((n, g) => n + g.rows.length, 0)} displayed`
            : "not checked"}{" "}
          · evidence {a.data?.asOf?.slice(0, 10) || "date not supplied"}
        </span>
        <span>
          Source B · last 180 days ·{" "}
          {readyB ? `${rows.length} displayed` : "not checked"} · checked{" "}
          {b.data?.asOf?.slice(0, 10) || "date not supplied"}
          {b.data?.truncated ? " · capped at 100 records" : ""}
        </span>
      </div>
      {groups
        .filter((g) => g.rows.length)
        .map((g) => (
          <IntelligenceTable
            key={g.title}
            title={`Source A · ${g.title}`}
            dateHeading="Disclosed"
            rows={g.rows}
          />
        ))}
      {!!rows.length && (
        <IntelligenceTable
          title="Source B · Congressional filings"
          dateHeading="Disclosed"
          rows={rows.map((r) => ({
            label: r.member,
            date: r.disclosed,
            href: r.filingUrl,
            cells: [
              { label: "Chamber", value: r.chamber },
              { label: "Transaction", value: r.action },
              { label: "Reported range", value: r.amountRange },
              { label: "Traded", value: r.traded },
              { label: "Disclosure lag", value: `${r.lagDays} days` },
              { label: "Owner", value: r.owner ?? "Not supplied" },
              { label: "Asset", value: r.assetDescription || "Not supplied" },
              { label: "Asset type", value: r.assetType },
              { label: "Comment", value: r.comment ?? "Not supplied" },
            ],
          }))}
        />
      )}
      <details>
        <summary>Sources &amp; limitations</summary>
        {a.data?.totalCount != null && (
          <p>
            {a.data.totalCount.toLocaleString()} provider records in scope for
            Source A; displayed rows may be a subset. Displayed absence is not a
            claim of zero provider records.
          </p>
        )}
        <p>
          Source A: SentiSense public-official records. Retrieved{" "}
          {a.data?.retrievedAt || "not supplied"}. Source B: EODHD congressional
          filings, checked {b.data?.asOf || "not supplied"}. Source scopes and
          dates differ; records are not merged or deduplicated across providers.
        </p>
        <p>
          Filings can be delayed or amended and may concern a spouse or
          dependent. These records do not establish a suitable entry or trading
          advantage.
        </p>
      </details>
    </section>
  );
}
