"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {researchDecision} from "@/lib/decision-research";
import { Save, BookmarkCheck, Pencil, X } from "lucide-react";
import { useProduct, useResource } from "./Session";
import { api } from "@/lib/client";
import type { Research } from "@/lib/types";
import { Notice, Source } from "./Ui";
export default function ResearchNotes({ research: r }: { research: Research }) {
  const decision=useMemo(()=>researchDecision(r),[r]);
  const { demo } = useProduct(),
    preview = useMemo(() => (demo ? { documents: [] } : undefined), [demo]),
    records = useResource<{
      documents: { key: string; body: Record<string, string> }[];
    }>("documents?kind=note", preview);
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
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState(false);
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
      setEditing(false);
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
    <section className={`support decision-record ${!form.thesis&&!editing?"record-empty":""}`}>
      <header className="section-heading">
        <div>
          <h2>Keep your reasoning</h2>
          <p>Your reasoning, counter-case and review conditions. Private and separate from company evidence.</p>
        </div>
        <div className="note-actions">
          <button
            className="button"
            disabled={busy || records.loading || !!records.error}
            aria-expanded={editing}
            aria-controls="thesis-editor"
            onClick={() => {
              if (editing) {
                const saved = records.data?.documents.find(
                  (x) => x.key === r.company.symbol,
                );
                setForm(saved ? { ...empty, ...saved.body } : empty);
              }
              setEditing(!editing);
              setMessage("");
            }}
          >
            <Pencil size={16} />
            {editing
              ? "Close editor"
              : form.thesis
                ? "Edit thesis"
                : "Add a note"}
          </button>
          <button className="button" disabled={busy} onClick={snapshot}>
            <BookmarkCheck size={16} />
            Save snapshot
          </button>
        </div>
      </header>
      {records.error && <Notice error>{records.error}</Notice>}
      {message && <Notice>{message}</Notice>}
      {!editing &&
        (form.thesis ||
          form.counterargument ||
          form.condition ||
          form.milestone) && (
          <div className="thesis-summary">
            {[
              ["Reason to own", form.thesis],
              ["Counterargument", form.counterargument],
              ["Review trigger", form.condition],
              ["Next milestone", form.milestone],
            ]
              .filter(([, text]) => text)
              .map(([label, text]) => (
                <div key={label}>
                  <span>{label}</span>
                  <p>{text}</p>
                </div>
              ))}
            {form.sourceUrl && (
              <Source href={form.sourceUrl}>Saved source</Source>
            )}
          </div>
        )}
      {(form.thesis||form.condition)&&<div className="record-evidence-check"><h4>Review against current evidence</h4>{decision.tripwires.some(t=>t.breached)?decision.tripwires.filter(t=>t.breached).map(t=><p key={t.id}><strong>{t.label}</strong> · {t.value.toFixed(1)}{t.unit==='percent'?'%':'×'} · review {t.direction} {t.threshold}{t.unit==='percent'?'%':'×'}</p>):<p>No available threshold is currently breached. This does not validate your written thesis.</p>}<Link href={`${demo?'/preview':''}/research/${encodeURIComponent(r.company.symbol.replace('/','-'))}?tab=Snapshot`}>Review evidence & save threshold alerts →</Link><p className="small muted">Written conditions are your interpretation. These checks do not automatically interpret free text or monitor continuously.</p></div>}
      {editing && (
        <form id="thesis-editor" className="research-note-form" onSubmit={save}>
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
              Pre-mortem: how could this go wrong?
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
              Measurable evidence that would change your mind?
              <textarea
                value={form.condition}
                maxLength={1500}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
                placeholder="Name a measurable condition, not just a share-price move."
              />
            </label>
            <label>
              Next milestone
              <textarea
                value={form.milestone}
                maxLength={1500}
                onChange={(e) =>
                  setForm({ ...form, milestone: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, sourceUrl: e.target.value })
                }
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
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={() => {
              const saved = records.data?.documents.find(
                (x) => x.key === r.company.symbol,
              );
              setForm(saved ? { ...empty, ...saved.body } : empty);
              setEditing(false);
            }}
          >
            <X size={15} />
            Cancel
          </button>
        </form>
      )}
    </section>
  );
}
