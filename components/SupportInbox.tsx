"use client";
import { useEffect, useState, useRef } from "react";
import s from "./SupportInbox.module.css";
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
  const [delivery,setDelivery] = useState<{recipient:string;sender:string;issue:string|null}|null>(null);
  const [cursor,setCursor] = useState<string|null>(null);
  const [pages,setPages] = useState<(string|null)[]>([]);
  const [next,setNext] = useState<string|null>(null);
  const [loading,setLoading] = useState(true);
  const generation = useRef(0);
  const [revision,setRevision] = useState(0);
  const controller = useRef<AbortController|null>(null);
  const [notice,setNotice] = useState("");
  const [attachments,setAttachments] = useState<Record<string,string|null>>({});
  const [rows, setRows] = useState<Ticket[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("all");
  async function attachment(id:string){
    setBusy(true);setError('');try{const r=await api<{screenshot:string|null}>(`support?attachment=${encodeURIComponent(id)}`);setAttachments(old=>({...old,[id]:r.screenshot}));}catch(e){setError(e instanceof Error?e.message:'Attachment unavailable.');}finally{setBusy(false);}
  }
  async function load() {
    const token = ++generation.current;
    controller.current?.abort();
    const active = new AbortController(); controller.current = active;
    setLoading(true); setError("");
    try {
      const query = new URLSearchParams({status:filter});
      if(cursor) query.set("cursor",cursor);
      const r = await api<{requests:Ticket[];nextCursor:string|null;delivery?:{recipient:string;sender:string;issue:string|null}}>(`support?${query}`,undefined,active.signal);
      if(token !== generation.current) return;
      setRows(r.requests); setNext(r.nextCursor); setDelivery(r.delivery ?? null); setAttachments({});
    } catch(e) { if(token === generation.current) setError(e instanceof Error ? e.message : "Inbox unavailable."); }
    finally { if(token === generation.current) setLoading(false); }
  }
  useEffect(() => { void load(); return () => { generation.current++; controller.current?.abort(); }; }, [filter,cursor,revision]);
  async function change(body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
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
      setRevision(value=>value+1);
      if (Array.isArray(v.results)) {
        const failures = v.results.filter((item: {error?:string}) => item.error);
        if (failures.length) setError(failures[0].error);
        else setNotice(v.results.length ? "Retry completed. Accepted emails can still be delayed or rejected by the receiving inbox; check Resend delivery events." : "No pending emails.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }
  const visible = loading ? [] : rows;
  return (
    <section className={s.inbox}>
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
      {delivery && <details className={s.delivery}><summary>Email delivery · {delivery.issue ? "Needs attention" : "Configuration"}</summary><p>Inbox: {delivery.recipient}</p><p>Sender: {delivery.sender || "Not configured"}</p><p>{delivery.issue || "Configured. Provider acceptance does not confirm inbox delivery."}</p><a href="https://resend.com/emails" target="_blank" rel="noopener noreferrer">Open delivery events ↗</a></details>}
      {notice && <p role="status">{notice}</p>}
      <div className={s.tools}>
        <span>{loading ? "Loading…" : `${rows.length} requests on this page`}</span>
        <label>
          Show
          <select
            aria-label="Filter support requests"
            value={filter}
            onChange={(event) => {setFilter(event.target.value);setCursor(null);setPages([]);}}
          >
            <option value="all">All requests</option>
            <option value="new">New</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      </div>
      {error && <p role="alert">{error}</p>}
      {!loading && !visible.length && !error && <p>No requests to show.</p>}
      {visible.map((r) => (
        <details className={s.ticket} key={r.id}>
          <summary><span className={s.badge} data-status={r.status}>{r.status.replace("_"," ")}</span><span className={s.identity}><strong>{r.category}</strong><span>{r.email}</span></span><time>{new Date(r.created_at).toLocaleDateString()}</time></summary>
          <div className={s.body}>
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
          <div><button type="button" disabled={busy} onClick={()=>void attachment(r.id)}>View screenshot</button>
          {attachments[r.id]===null && <p>No screenshot attached.</p>}
          {attachments[r.id]?.startsWith('data:image/jpeg;base64,') && <img src={attachments[r.id]!} alt="User supplied support screenshot" style={{maxWidth:'100%',maxHeight:400,objectFit:'contain'}}/>}</div>
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
          </div>
        </details>
      ))}
      <footer className={s.tools}><button className="button" disabled={loading || !pages.length} onClick={()=>{setCursor(pages[pages.length-1]);setPages(pages.slice(0,-1));}}>Previous</button><span>Page {pages.length+1}</span><button className="button" disabled={loading || !next} onClick={()=>{setPages([...pages,cursor]);setCursor(next);}}>Next</button></footer>
    </section>
  );
}
