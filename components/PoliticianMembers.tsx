"use client";
import { useState } from "react";
import { useResource } from "./Session";
import type {
  DirectoryResult,
  MemberResult,
  PoliticianMember,
} from "@/lib/politician-members";
import IntelligenceTable from "./IntelligenceTable";
export function MemberHistory({ member }: { member: PoliticianMember }) {
  const [offset, setOffset] = useState(0);
  const r = useResource<MemberResult>(
    `politician-members?slug=${encodeURIComponent(member.urlSlug)}&bioguideId=${member.bioguideId}&offset=${offset}`,
    undefined,
    300000,
  );
  const d = r.data;
  if (r.loading) return <p role="status">Loading reported member history…</p>;
  if (r.error || !d)
    return (
      <p role="status">
        Member history unavailable. <button onClick={r.refresh}>Retry</button>
        {offset > 0 && (
          <button onClick={() => setOffset(0)}>Return to first page</button>
        )}
      </p>
    );
  return (
    <section aria-label="Member disclosure history">
      <h4>{d.member.displayName}</h4>
      <p>
        {d.member.former
          ? `Former ${d.member.chamber} member${d.member.servedUntil ? ` · left ${d.member.servedUntil}` : ""}`
          : d.member.chamber + " member"}{" "}
        · {d.member.state} · {d.member.party} · Bioguide {d.member.bioguideId}
      </p>
      <p>
        {d.isPreview ? "Limited subscription preview. " : ""}
        {d.trades.length} rows shown from offset {offset};{" "}
        {d.totalCount ?? "unknown"} records in provider history.{" "}
        {d.profileAvailable
          ? "Profile covers the full provider history, not only this page."
          : "Profile statistics unavailable in this preview."}
      </p>
      <p>
        Disclosed USD ranges, not exact amounts or portfolio balances.
        Transaction dates and filing/disclosure dates are different. These
        records do not establish motive, wrongdoing or future performance.
      </p>
      <IntelligenceTable
        title="Reported transactions"
        dateHeading="Transaction date"
        rows={d.trades.map((t) => ({
          label: t.ticker || t.assetDescription || "Asset not supplied",
          date: t.transactionDate,
          href: null,
          cells: [
            {
              label: "Disclosure date",
              value: t.disclosureDate || "Not supplied",
            },
            { label: "Transaction", value: t.transactionType },
            { label: "Disclosed amount range (USD)", value: t.amountRange },
            {
              label: "Lower / upper reported bounds (USD)",
              value: `${t.amountMin === null ? "Not supplied" : t.amountMin.toLocaleString("en-US")} / ${t.amountMax === null ? "Not supplied or open-ended" : t.amountMax.toLocaleString("en-US")}`,
            },
            { label: "Reported owner", value: t.owner },
            {
              label: "Asset",
              value: t.assetDescription || t.assetType || "Not supplied",
            },
          ],
        }))}
      />
      {!d.trades.length && (
        <p>
          No records returned for this page. This does not prove no
          transactions.
        </p>
      )}
      {!d.isPreview && (
        <nav aria-label="Member history pages">
          <button
            className="btn"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 50))}
          >
            Previous history
          </button>
          <button
            className="btn"
            disabled={!d.canNext}
            onClick={() => setOffset(offset + 50)}
          >
            Next history
          </button>
        </nav>
      )}
      {offset === 1000 && (
        <p>
          Interactive paging limit reached; this is not the complete history.
        </p>
      )}
      <p>
        Source: SentiSense congressional disclosures. Retrieved {d.retrievedAt}.
        Pages can change with new filings or corrections; no immutable snapshot
        is implied. Existing official filing links remain in the ticker
        disclosure table.
      </p>
    </section>
  );
}
function MemberDirectory() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<PoliticianMember | null>(null);
  const r = useResource<DirectoryResult>(
    `politician-members?q=${encodeURIComponent(query)}&offset=${offset}`,
    undefined,
    300000,
  );
  const d = r.data;
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(draft.trim());
          setOffset(0);
          setSelected(null);
        }}
      >
        <label>
          Find a tracked member
          <input
            value={draft}
            maxLength={100}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Name or state"
          />
        </label>
        <button className="btn" type="submit">
          Search members
        </button>
      </form>
      <p>
        Directory includes tracked former members. Selecting a person loads
        their reported history, not only transactions in this ticker.
      </p>
      {r.loading ? (
        <p role="status">Loading member directory…</p>
      ) : r.error || !d ? (
        <p role="status">
          Directory unavailable. <button onClick={r.refresh}>Retry</button>
        </p>
      ) : (
        <>
          <label>
            Reported member
            <select
              value={selected?.bioguideId || ""}
              onChange={(e) =>
                setSelected(
                  d.members.find((m) => m.bioguideId === e.target.value) ||
                    null,
                )
              }
            >
              <option value="">Choose a member</option>
              {d.members.map((m) => (
                <option key={m.bioguideId} value={m.bioguideId}>
                  {m.displayName} · {m.state} · {m.former ? "Former " : ""}
                  {m.chamber}
                </option>
              ))}
            </select>
          </label>
          <p>
            {d.members.length} of {d.totalCount} matched members · retrieved{" "}
            {d.retrievedAt}.
          </p>
          <nav aria-label="Member directory pages">
            <button
              className="btn"
              disabled={offset === 0}
              onClick={() => {
                setOffset(Math.max(0, offset - 50));
                setSelected(null);
              }}
            >
              Previous members
            </button>
            <button
              className="btn"
              disabled={!d.canNext}
              onClick={() => {
                setOffset(offset + 50);
                setSelected(null);
              }}
            >
              Next members
            </button>
          </nav>
          {offset === 1000 && (
            <p>
              Interactive directory limit reached; narrow the name/state search.
            </p>
          )}
        </>
      )}
      {selected && (
        <MemberHistory key={selected.bioguideId} member={selected} />
      )}
    </div>
  );
}
export default function PoliticianMembers() {
  const [open, setOpen] = useState(false);
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>Find a member · reported transaction history</summary>
      {open && <MemberDirectory />}
    </details>
  );
}
