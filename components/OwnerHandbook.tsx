"use client";
import { useEffect, useState, useMemo, useDeferredValue } from "react";
import { api } from "@/lib/client";
import { handbookChapters, findHandbookChapters } from "@/lib/handbook-reader";
import styles from "./OwnerHandbook.module.css";
export default function OwnerHandbook() {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [references, setReferences] = useState(false);
  const deferredQuery = useDeferredValue(query);
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
  const chapters = useMemo(() => handbookChapters(content), [content]);
  const matches = useMemo(
    () => findHandbookChapters(chapters, deferredQuery, references),
    [chapters, deferredQuery, references],
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
          <label className={styles.referenceToggle}>
            <input
              type="checkbox"
              checked={references}
              onChange={(e) => setReferences(e.target.checked)}
            />{" "}
            Include implementation reference
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
            <article aria-live="polite">
              <h3>{active.title}</h3>
              <div className={styles.body}>
                {active.title.startsWith("Reference:") ? (
                  <pre>{active.body}</pre>
                ) : (
                  active.body
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((block, i) =>
                      /^### /.test(block) ? (
                        <h4 key={i}>{block.replace(/^### /, "")}</h4>
                      ) : (
                        <p key={i}>{block}</p>
                      ),
                    )
                )}
              </div>
              <nav className={styles.chapterNav} aria-label="Handbook chapters">
                <button
                  disabled={matches.indexOf(active) === 0}
                  onClick={() =>
                    setSelected(matches[matches.indexOf(active) - 1].id)
                  }
                >
                  Previous chapter
                </button>
                <span>
                  {matches.indexOf(active) + 1} of {matches.length}
                </span>
                <button
                  disabled={matches.indexOf(active) === matches.length - 1}
                  onClick={() =>
                    setSelected(matches[matches.indexOf(active) + 1].id)
                  }
                >
                  Next chapter
                </button>
              </nav>
            </article>
          ) : (
            <p>No matching chapters.</p>
          )}
        </>
      )}
    </section>
  );
}
