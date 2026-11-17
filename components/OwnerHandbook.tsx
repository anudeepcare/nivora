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
                  {!chapter.reference && topicGuides[chapter.id]
                    ? topicGuides[chapter.id][0]
                    : chapter.title.replace(/^\d+\.\s*/, "")}
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
                    {guide?.[0] ?? active.title.replace(/^\d+\.\s*/, "")}
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
                  <details
                    key={active.id}
                    className={styles.fullDetail}
                    open={active.reference || !!query.trim()}
                  >
                    <summary>Full explanation & technical details</summary>
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
                  </details>
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
