"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
type Ticket = {
  id: string;
  email: string;
  category: string;
  message: string;
  page: string;
  status: string;
  created_at: string;
  owner_notified_at: string | null;
  receipt_sent_at: string | null;
  attempts: number;
};
export default function SupportInbox() {
  const [rows, setRows] = useState<Ticket[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all");
  async function load() {
    const r = await api<{ requests: Ticket[] }>("support");
    setRows(r.requests);
  }
  useEffect(() => {
    void load().catch((e) => setError(e.message));
  }, []);
  async function change(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const { authClient } = await import("@/lib/client");
      const { data } = await authClient().auth.getSession();
      const r = await fetch("/api/support", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const v = await r.json();
      if (!r.ok) throw Error(v.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }
  const visible = rows.filter(
    (row) => filter === "all" || row.status === filter,
  );
  return (
    <section className="support-inbox">
      <header>
        <h2>Support inbox</h2>
        <button
          className="button"
          disabled={busy}
          onClick={() => change({ action: "retry" })}
        >
          Retry pending emails
        </button>
      </header>
      <div className="support-inbox-tools">
        <span>{rows.length} saved requests</span>
        <label>
          Show
          <select
            aria-label="Filter support requests"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All requests</option>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      {!visible.length && !error && <p>No requests to show.</p>}
      {visible.map((r) => (
        <article key={r.id}>
          <header>
            <strong>{r.category}</strong>
            <span>{new Date(r.created_at).toLocaleString()}</span>
          </header>
          <a
            href={`mailto:${r.email}?subject=${encodeURIComponent(`AURYN support · ${r.id.slice(0, 8)}`)}`}
          >
            Reply to {r.email}
          </a>
          <p style={{ whiteSpace: "pre-wrap" }}>{r.message}</p>
          <small>
            #{r.id.slice(0, 8)} · {r.page} ·{" "}
            {r.owner_notified_at ? "Owner notified" : "Owner email pending"} ·{" "}
            {r.receipt_sent_at
              ? "Receipt sent"
              : r.attempts >= 5
                ? "Automatic delivery paused · use Retry pending emails"
                : "Receipt pending"}
          </small>
          <label>
            Status
            <select
              value={r.status}
              disabled={busy}
              onChange={(e) => change({ id: r.id, status: e.target.value })}
            >
              <option value="new">New</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
        </article>
      ))}
    </section>
  );
}
