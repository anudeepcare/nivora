"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import styles from "./OwnerHandbook.module.css";
export default function OwnerHandbook() {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setError("");
    api<{ content: string }>("owner/handbook", undefined, c.signal)
      .then((x) => setContent(x.content))
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [retry]);
  const chapters = content.split(/\n## /).map((p, id) => {
    const [title, ...body] = p.split("\n");
    return { id, title: title.replace(/^# /, ""), body: body.join("\n") };
  });
  const matches = chapters.filter((x) =>
    (x.title + x.body).toLowerCase().includes(query.trim().toLowerCase()),
  );
  const active = matches.find((x) => x.id === selected) ?? matches[0];
  function download() {
    const u = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "AURYN-owner-handbook.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  return (
    <section className={styles.root} id="admin-handbook">
      <header>
        <h2>Owner handbook</h2>
        <p>Private formulas and explanations · 7 Nov 2026 source snapshot</p>
        <button className="btn" disabled={!content} onClick={download}>
          Download reference
        </button>
      </header>
      {error ? (
        <p role="alert">
          {error} <button onClick={() => setRetry((x) => x + 1)}>Retry</button>
        </p>
      ) : !content ? (
        <p role="status">Loading private reference…</p>
      ) : (
        <>
          <label>
            Find a metric or topic
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pace, gamma, RSI, cash flow…"
            />
          </label>
          <label>
            Chapter
            <select
              value={active?.id ?? ""}
              onChange={(e) => setSelected(Number(e.target.value))}
            >
              {matches.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          {active ? (
            <article>
              <h3>{active.title}</h3>
              <div className={styles.body}>
                {active.title.startsWith("Reference:") ? (
                  <pre>{active.body}</pre>
                ) : (
                  active.body
                    .split("\n")
                    .filter(Boolean)
                    .map((line, i) => <p key={i}>{line}</p>)
                )}
              </div>
            </article>
          ) : (
            <p>No matching chapters.</p>
          )}
        </>
      )}
    </section>
  );
}
