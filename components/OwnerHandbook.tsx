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
  type HandbookChapter,
} from "@/lib/handbook-reader";
import styles from "./OwnerHandbook.module.css";
const topicGuides = [
  [
    "Start here",
    "Find a company, review its business and valuation, then use Pace for price context.",
    "Pace guides contribution timing.|Business evidence explains company quality.|Valuation explores what assumptions imply.",
  ],
  [
    "Home & discovery",
    "Your daily view of companies, price zones and upcoming earnings.",
    "Start with your followed companies.|Open a company for the full picture.|Use the calendar to plan your next review.",
  ],
  [
    "Research overview",
    "One company, one price reference and a clear place to begin.",
    "Read Pace first.|Compare bear, base and bull scenarios.|Open a specialist tab for deeper evidence.",
  ],
  [
    "Pace price zones",
    "P0–P4 show progressively deeper accumulation conditions.",
    "P0 pauses; P1 watches or holds.|P2 starts small; P3 adds gradually; P4 is the deepest stage.|Expand Price zones & history for this stock’s conditional price bands.",
  ],
  [
    "Weekly & monthly",
    "A developing reading can change before the period closes.",
    "Monthly and weekly use different periods.|Confirmed means the period has closed.|Use the current reading rather than an old deeper zone.",
  ],
  [
    "Actions explained",
    "The action combines price conditions with business checks.",
    "A healthy business can still be outside an accumulation zone.|Deeper zones do not override your position limit.|Review changed evidence before adding.",
  ],
  [
    "Case & ownership",
    "See who owns the company and the evidence behind its investment case.",
    "Compare institutional and insider ownership.|Read the business strengths and concerns.|Use reported transactions as context, not instructions.",
  ],
  [
    "Business metrics",
    "Follow the money: sales, profit, cash and balance-sheet strength.",
    "Switch metrics on the history chart.|Compare profitability and reinvestment.|Expand definitions when a measure is unfamiliar.",
  ],
  [
    "Research styles",
    "Different lenses highlight different business characteristics.",
    "Choose a style that fits your question.|Inspect the underlying metrics.|A score is a summary, not a complete investment case.",
  ],
  [
    "Valuation models",
    "Compare conditional bear, base and bull prices with the current price.",
    "Select a supplied fiscal year.|Check the model’s EPS and multiple assumptions.|Wall Street consensus remains a separate published opinion.",
  ],
  [
    "Technical indicators",
    "See trend and momentum alongside the longer-term picture.",
    "Compare moving averages.|Use RSI as momentum context.|A technical reading does not replace business research.",
  ],
  [
    "Targets & estimates",
    "Published targets, annual forecasts and model scenarios answer different questions.",
    "Targets are analyst opinions.|Annual estimates show expected business results.|Scenarios combine those inputs with explicit assumptions.",
  ],
  [
    "News & earnings",
    "Review the latest result and the next scheduled report.",
    "Compare actual EPS with its estimate.|Check revenue and margin changes.|Open the source for the full announcement.",
  ],
  [
    "Options basics",
    "Start with expiration and strike, then inspect the contract.",
    "Calls and puts have different payoffs.|Check premium, spread and expiration.|Use Practice before committing capital.",
  ],
  [
    "Exposure map",
    "A compact map of measured options concentrations.",
    "Rows are strikes; columns are expirations.|Select a cell for its measured inputs.|A concentration is context, not a guaranteed price level.",
  ],
  [
    "Advanced options",
    "Explore sensitivity, activity and modeled levels in one workspace.",
    "Gamma flip estimates where modeled exposure changes sign.|Vanna explores sensitivity to volatility.|Trade activity describes supplied observations, not every trade in the market.",
  ],
  [
    "Practice trading",
    "Try option positions with simulated cash.",
    "Entries use the supplied ask; marks use the bid.|Check the 100-share contract multiplier.|Practice never places a real broker order.",
  ],
  [
    "Portfolio & watchlist",
    "Keep your holdings and ideas together.",
    "Record holdings to see position context.|Follow companies to personalize Home.|Review concentration before increasing a position.",
  ],
  [
    "Research & planning",
    "Go deeper without crowding the everyday workflow.",
    "Compare companies on the same measures.|Keep assumptions explicit.|Use advanced tools only when they answer your question.",
  ],
  [
    "Owner operations",
    "Check the product’s health and help users find a clear answer.",
    "Start with the affected company and screen.|Check the data observation before interpreting a mismatch.|Keep account operations separate from research.",
  ],
  [
    "Quick answers",
    "Explain the product in everyday language.",
    "Pace is a contribution guide.|Scenarios are conditional outcomes.|Missing data is not zero.",
  ],
  [
    "Calculation reference",
    "The complete implementation detail is available when you need it.",
    "Open the technical reference for formulas.|Use the same period and price when comparing values.|Keep technical explanations out of the everyday workflow.",
  ],
];
const chapterLocation = (id: number) => `#handbook-chapter-${id + 1}`;
export function handbookChapterFromHash(hash: string): number | null {
  if (hash === "#admin-handbook") return 0;
  const match = /^#handbook-chapter-([1-9]\d{0,3})$/.exec(hash);
  return match ? Number(match[1]) - 1 : null;
}
const chapterTitle = (chapter: HandbookChapter) =>
  (!chapter.reference && topicGuides[chapter.id]?.[0]) ||
  chapter.title.replace(/^\d+\.\s*/, "");

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
  const matches = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const byContent = new Set(
      findHandbookChapters(chapters, q, references).map(
        (chapter) => chapter.id,
      ),
    );
    return chapters.filter(
      (chapter) =>
        byContent.has(chapter.id) ||
        (!chapter.reference &&
          topicGuides[chapter.id]?.join(" ").toLowerCase().includes(q)),
    );
  }, [chapters, deferredQuery, references]);
  const readerHeading = useRef<HTMLHeadingElement>(null);
  const moveToHeading = useRef<number | null>(null);
  const active = matches.find((x) => x.id === selected) ?? matches[0];
  function focusChapter() {
    if (!readerHeading.current) return;
    readerHeading.current.focus({ preventScroll: true });
    readerHeading.current.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }
  function chooseChapter(id: number, focusReader = true) {
    const hash = chapterLocation(id);
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    moveToHeading.current = focusReader && id !== active?.id ? id : null;
    setSelected(id);
    if (focusReader && id === active?.id) focusChapter();
  }
  useEffect(() => {
    function syncBookmark(event?: HashChangeEvent) {
      const hash = window.location.hash;
      const id =
        handbookChapterFromHash(hash) ??
        (!hash && event ? chapters[0]?.id : null);
      if (id == null) return;
      const chapter = chapters.find((item) => item.id === id);
      if (!chapter) return;
      moveToHeading.current = id;
      setQuery("");
      setSelected(chapter.id);
      if (chapter.reference) setReferences(true);
      if (readerHeading.current?.id === chapterLocation(id).slice(1)) {
        moveToHeading.current = null;
        focusChapter();
      }
    }
    syncBookmark();
    window.addEventListener("hashchange", syncBookmark);
    return () => window.removeEventListener("hashchange", syncBookmark);
  }, [chapters]);
  const activeId = active?.id;
  useEffect(() => {
    if (
      activeId != null &&
      moveToHeading.current === activeId &&
      readerHeading.current
    ) {
      moveToHeading.current = null;
      focusChapter();
    }
  }, [activeId]);
  const index = active ? matches.indexOf(active) : 0;
  const blocks = useMemo(
    () => handbookBlocks(active?.body ?? ""),
    [active?.body],
  );
  const guide =
    active && !active.reference ? topicGuides[active.id] : undefined;
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
    <section className={styles.root} aria-labelledby="owner-handbook-title">
      <header className={styles.cover}>
        <div>
          <h2 id="owner-handbook-title">Owner handbook</h2>
          <p>Read the product guide or look up the underlying calculations.</p>
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
            <label className={styles.chapterControl}>
              Chapter
              <select
                aria-label="Chapter"
                disabled={!matches.length}
                value={active?.id ?? ""}
                onChange={(e) => chooseChapter(Number(e.target.value), false)}
              >
                {!matches.length && (
                  <option value="">No matching chapters</option>
                )}
                {matches.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapterTitle(chapter)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.layout}>
            <nav className={styles.topics} aria-label="Handbook contents">
              <h3>
                Contents <small>{matches.length}</small>
              </h3>
              <ol>
                {matches.map((chapter) => (
                  <li key={chapter.id}>
                    <a
                      href={chapterLocation(chapter.id)}
                      aria-current={
                        active?.id === chapter.id ? "location" : undefined
                      }
                      onClick={(event) => {
                        if (
                          event.defaultPrevented ||
                          event.button !== 0 ||
                          event.ctrlKey ||
                          event.metaKey ||
                          event.shiftKey ||
                          event.altKey
                        )
                          return;
                        event.preventDefault();
                        chooseChapter(chapter.id);
                      }}
                    >
                      <span aria-hidden="true">{chapter.id + 1}</span>
                      {chapterTitle(chapter)}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className={styles.reader}>
              {active ? (
                <article aria-labelledby={chapterLocation(active.id).slice(1)}>
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
                  <h3
                    id={chapterLocation(active.id).slice(1)}
                    ref={readerHeading}
                    tabIndex={-1}
                  >
                    {chapterTitle(active)}
                  </h3>
                  {guide && (
                    <div className={styles.intro}>
                      <p>{guide[1]}</p>
                      <ul>
                        {guide[2].split("|").map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className={styles.body} key={active.id}>
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
                          <div
                            key={i}
                            className={styles.table}
                            role="region"
                            tabIndex={0}
                            aria-label={block.header.join(" · ")}
                          >
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
                    aria-label="Previous or next handbook chapter"
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
                <div className={styles.empty} role="status">
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
