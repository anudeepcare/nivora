"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Search,
  ChartNoAxesCombined,
  Bookmark,
  PieChart,
  ShieldCheck,
} from "lucide-react";
import DetailDialog from "./DetailDialog";
import s from "./ProductGuide.module.css";

const journeys = [
  {
    href: "/research",
    icon: ChartNoAxesCombined,
    title: "Understand a company",
    text: "Start with the decision. Compare the business, price and risks.",
  },
  {
    href: "/watchlist",
    icon: Bookmark,
    title: "Follow your ideas",
    text: "Keep companies together and return when the evidence changes.",
  },
  {
    href: "/portfolio",
    icon: PieChart,
    title: "Review what you own",
    text: "See holdings, cash, concentration and the next questions to ask.",
  },
];

/** User guide only. The service's contractual policy text stays separately versioned. */
export default function ProductGuide({
  topics,
}: {
  topics: { title: string; text: string }[];
}) {
  const [query, setQuery] = useState("");
  const filtered = topics.filter((topic) =>
    `${topic.title} ${topic.text}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div className={s.guide}>
      <section aria-labelledby="guide-start-heading">
        <div className={s.heading}>
          <span>
            <BookOpen size={18} aria-hidden="true" /> THE AURYN GUIDE
          </span>
          <h2 id="guide-start-heading">Find your next step.</h2>
          <p>
            One workspace. A clearer path from information to your own decision.
          </p>
        </div>
        <nav className={s.journeys} aria-label="Start using Auryn">
          {journeys.map((item) => (
            <Link href={item.href} key={item.href}>
              <item.icon size={22} aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span>
                Open workspace <ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </nav>
      </section>
      <section className={s.topics} aria-labelledby="guide-topics-heading">
        <div className={s.topicHeader}>
          <h2 id="guide-topics-heading">A little context. When you need it.</h2>
          <label>
            <span>Find a topic</span>
            <span className={s.search}>
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Pace, prices, portfolio…"
              />
            </span>
          </label>
        </div>
        {query && (
          <div className={s.feedback}>
            <p role="status">
              {filtered.length} matching{" "}
              {filtered.length === 1 ? "topic" : "topics"}
            </p>
            <button type="button" onClick={() => setQuery("")}>
              Clear search
            </button>
          </div>
        )}
        <div className={s.topicGrid}>
          {filtered.map((topic) => (
            <article key={topic.title}>
              <h3>{topic.title}</h3>
              <DetailDialog title={topic.title} trigger="Read explanation">
                <p>{topic.text}</p>
              </DetailDialog>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <p className={s.empty}>
            No matching topic. Try a shorter search or{" "}
            <Link href="/contact">contact support</Link>.
          </p>
        )}
      </section>
      <aside className={s.trust}>
        <ShieldCheck size={24} aria-hidden="true" />
        <div>
          <h2>Understand the evidence.</h2>
          <p>
            Observation dates, missing coverage and model assumptions matter. A
            missing value is not zero, and an unavailable Pace reading is not a
            sell signal.
          </p>
          <div>
            <Link href="/methodology">
              How Auryn works <ArrowUpRight size={14} />
            </Link>
            <Link href="/reliability">
              Data and coverage <ArrowUpRight size={14} />
            </Link>
            <Link href="/risk">
              Investment risks <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
