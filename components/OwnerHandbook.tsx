"use client";
import {
  useEffect,
  useState,
  useMemo,
  useDeferredValue,
  useRef,
  Fragment,
} from "react";
import { api } from "@/lib/client";
import {
  handbookChapters,
  findHandbookChapters,
  handbookBlocks,
} from "@/lib/handbook-reader";
import styles from "./OwnerHandbook.module.css";
function Inline({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        .map((part, i) =>
          part.startsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : part.startsWith("`") ? (
            <code key={i}>{part.slice(1, -1)}</code>
          ) : (
            <Fragment key={i}>{part}</Fragment>
          ),
        )}
    </>
  );
}
export default function OwnerHandbook() {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [references, setReferences] = useState(false);
  const [retry, setRetry] = useState(0);
  const deferredQuery = useDeferredValue(query);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    api<{ content: string }>("owner/handbook", undefined, controller.signal)
      .then((x) => setContent(x.content))
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [retry]);
  const chapters = useMemo(() => handbookChapters(content), [content]);
  const matches = useMemo(
    () => findHandbookChapters(chapters, deferredQuery, references),
    [chapters, deferredQuery, references],
  );
  const readerHeading = useRef<HTMLHeadingElement>(null);
  const moveToHeading = useRef(false);
  const active = matches.find((x) => x.id === selected) ?? matches[0];
  function chooseChapter(id: number) {
    if (id === active?.id) return;
    moveToHeading.current = true;
    setSelected(id);
  }
  useEffect(() => {
    if (moveToHeading.current && readerHeading.current) {
      moveToHeading.current = false;
      readerHeading.current.focus({ preventScroll: true });
      readerHeading.current.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    }
  }, [active?.id]);
  const index = active ? matches.indexOf(active) : 0;
  const blocks = useMemo(
    () => handbookBlocks(active?.body ?? ""),
    [active?.body],
  );
  const minutes = active
    ? Math.max(1, Math.ceil(active.body.split(/\s+/).length / 220))
    : 0;
  function download() {
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "AURYN-owner-handbook.md";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className={styles.root} id="admin-handbook">
      <header className={styles.cover}>
        <div>
          <span className={styles.kicker}>AURYN · Owner guide</span>
          <h2>
            Know the product.
            <br />
            Explain it simply.
          </h2>
          <p>Daily answers up front. Every calculation one step deeper.</p>
        </div>
        <button disabled={!content} onClick={download}>
          Download full reference ↓
        </button>
      </header>
      {error ? (
        <p role="alert">
          {error} <button onClick={() => setRetry((x) => x + 1)}>Retry</button>
        </p>
      ) : !content ? (
        <p role="status">Loading owner guide…</p>
      ) : (
        <>
          <div className={styles.tools}>
            <label>
              Find a metric or topic
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Pace, targets, gamma…"
              />
            </label>
            <label className={styles.referenceToggle}>
              <input
                type="checkbox"
                checked={references}
                onChange={(e) => setReferences(e.target.checked)}
              />{" "}
              Technical reference
            </label>
          </div>
          <div className={styles.layout}>
            <nav className={styles.topics} aria-label="Guide topics">
              <span>{matches.length} topics</span>
              {matches.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  aria-current={chapter.id === active?.id ? "page" : undefined}
                  onClick={() => chooseChapter(chapter.id)}
                >
                  {chapter.title.replace(/^\d+\.\s*/, "")}
                </button>
              ))}
            </nav>
            <div className={styles.reader}>
              <label className={styles.mobileTopics}>
                Chapter
                <select
                  aria-label="Chapter"
                  value={active?.id ?? ""}
                  onChange={(e) => chooseChapter(Number(e.target.value))}
                >
                  {matches.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </option>
                  ))}
                </select>
              </label>
              {active ? (
                <article aria-live="polite">
                  <div className={styles.readerMeta}>
                    <span>
                      {active.reference
                        ? "Technical reference"
                        : "Product guide"}
                    </span>
                    <small>
                      {minutes} min read · {index + 1} of {matches.length}
                    </small>
                  </div>
                  <h3 ref={readerHeading} tabIndex={-1}>
                    {active.title.replace(/^\d+\.\s*/, "")}
                  </h3>
                  <div className={styles.body}>
                    {active.reference ? (
                      <pre>{active.body}</pre>
                    ) : (
                      blocks.map((block, i) =>
                        block.kind === "heading" ? (
                          <h4 key={i}>
                            <Inline text={block.text} />
                          </h4>
                        ) : block.kind === "code" ? (
                          <pre key={i}>{block.text}</pre>
                        ) : block.kind === "list" ? (
                          block.ordered ? (
                            <ol key={i}>
                              {block.items.map((item, j) => (
                                <li key={j}>
                                  <Inline text={item} />
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <ul key={i}>
                              {block.items.map((item, j) => (
                                <li key={j}>
                                  <Inline text={item} />
                                </li>
                              ))}
                            </ul>
                          )
                        ) : block.kind === "table" ? (
                          <div key={i} className={styles.table}>
                            <table>
                              <thead>
                                <tr>
                                  {block.header.map((cell, j) => (
                                    <th key={j} scope="col">
                                      <Inline text={cell} />
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {block.rows.map((row, j) => (
                                  <tr key={j}>
                                    {row.map((cell, k) => (
                                      <td key={k}>
                                        <Inline text={cell} />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p key={i}>
                            <Inline text={block.text} />
                          </p>
                        ),
                      )
                    )}
                  </div>
                  <nav
                    className={styles.chapterNav}
                    aria-label="Handbook chapters"
                  >
                    <button
                      disabled={index === 0}
                      onClick={() => chooseChapter(matches[index - 1].id)}
                    >
                      Previous chapter
                    </button>
                    <span>
                      {index + 1} / {matches.length}
                    </span>
                    <button
                      disabled={index === matches.length - 1}
                      onClick={() => chooseChapter(matches[index + 1].id)}
                    >
                      Next chapter
                    </button>
                  </nav>
                </article>
              ) : (
                <div className={styles.empty}>
                  <h3>No matching topics</h3>
                  <p>
                    Try a shorter phrase or include the technical reference.
                  </p>
                  <button onClick={() => setQuery("")}>Clear search</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
