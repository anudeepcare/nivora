"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, BookmarkCheck, ExternalLink } from "lucide-react";
import { useProduct, useResource } from "./Session";
import { api } from "@/lib/client";
import { modelCoverage } from "@/lib/research-depth";
import type { Research } from "@/lib/types";
import { Notice, Source } from "./Ui";
export default function ResearchNotes({ research: r }: { research: Research }) {
  const { demo } = useProduct(),
    preview = useMemo(() => (demo ? { documents: [] } : undefined), [demo]),
    records = useResource<{
      documents: { key: string; body: Record<string, string> }[];
    }>("documents?kind=note", preview),
    coverage = modelCoverage(r.company.symbol, r.company.assetType);
  const empty = {
    thesis: "",
    counterargument: "",
    condition: "",
    milestone: "",
    sourceUrl: "",
    evidenceDate: "",
    status: "researching",
    horizon: "long-term",
  };
  const [form, setForm] = useState(empty),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const found = records.data?.documents.find(
      (x) => x.key === r.company.symbol,
    );
    setForm(found ? { ...empty, ...found.body } : empty);
  }, [records.data, r.company.symbol]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (demo)
        throw Error(
          "Preview notes are illustrative; sign in to save your own research.",
        );
      await api("documents", {
        kind: "note",
        key: r.company.symbol,
        body: form,
      });
      records.refresh();
      setMessage(
        "Thesis saved. Your interpretation stays separate from reported evidence.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  async function snapshot() {
    setBusy(true);
    try {
      if (demo)
        throw Error("Snapshot saving is disabled in this design preview.");
      await api("observations", { symbol: r.company.symbol });
      setMessage(
        "Dated research snapshot saved. Later observations will not rewrite it.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Snapshot failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="support">
      <header className="section-heading">
        <div>
          <h2>Your investment thesis</h2>
          <p>{coverage.method}</p>
        </div>
        <button className="button" disabled={busy} onClick={snapshot}>
          <BookmarkCheck size={16} />
          Save snapshot
        </button>
      </header>
      <div className="driver-strip">
        {coverage.drivers.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <form className="research-note-form" onSubmit={save}>
        <div className="two-col">
          <label>
            Reason to own
            <textarea
              value={form.thesis}
              maxLength={3000}
              onChange={(e) => setForm({ ...form, thesis: e.target.value })}
              placeholder="What gives this business an enduring advantage?"
            />
          </label>
          <label>
            Strongest counterargument
            <textarea
              value={form.counterargument}
              maxLength={2000}
              onChange={(e) =>
                setForm({ ...form, counterargument: e.target.value })
              }
              placeholder="What could make this thesis wrong?"
            />
          </label>
          <label>
            What would change your mind?
            <textarea
              value={form.condition}
              maxLength={1500}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              placeholder="Name a measurable condition, not just a share-price move."
            />
          </label>
          <label>
            Next milestone
            <textarea
              value={form.milestone}
              maxLength={1500}
              onChange={(e) => setForm({ ...form, milestone: e.target.value })}
              placeholder="Separate delivered results from management targets."
            />
          </label>
        </div>
        <div className="form-grid">
          <label>
            Original source
            <input
              type="url"
              value={form.sourceUrl}
              placeholder="https://…"
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
            />
          </label>
          <label>
            Evidence date
            <input
              type="date"
              value={form.evidenceDate}
              onChange={(e) =>
                setForm({ ...form, evidenceDate: e.target.value })
              }
            />
          </label>
          <label>
            Thesis status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {["researching", "intact", "review", "broken"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Horizon
            <select
              value={form.horizon}
              onChange={(e) => setForm({ ...form, horizon: e.target.value })}
            >
              {["tactical", "swing", "long-term"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="button primary" disabled={busy}>
          <Save size={16} />
          {busy ? "Saving…" : "Save thesis"}
        </button>
        {message && <Notice>{message}</Notice>}
      </form>
      <p className="footnote">
        Your notes are personal interpretations. They do not automatically
        establish a moat, change canonical research or authorize paper
        execution.
      </p>
    </section>
  );
}
