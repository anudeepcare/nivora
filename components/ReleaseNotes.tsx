"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { releases, latestPublished } from "@/lib/releases";
import { DocumentBack, ContextLink } from "./ContextLink";
import styles from "./ReleaseNotes.module.css";
export default function ReleaseNotes() {
  return (
    <main className={styles.page}>
      <header>
        <Link href="/" className="legal-brand">
          AURYN
        </Link>
        <DocumentBack />
      </header>
      <span className="eyebrow">PRODUCT UPDATES</span>
      <h1>What’s new</h1>
      <p>
        New tools, thoughtful improvements and the details behind the numbers.
      </p>
      {releases.map((r) => (
        <article key={r.version}>
          <div className={styles.meta}>
            <span>{r.version}</span>
            <time dateTime={r.date}>{r.date}</time>
            <span>
              {r.status === "candidate"
                ? "Release candidate · not published"
                : "Published"}
            </span>
          </div>
          <h2>{r.title}</h2>
          {Object.entries(r.groups).map(([title, items]) => (
            <section key={title}>
              <h3>{title}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </article>
      ))}
      <ContextLink page="contact">Share feedback →</ContextLink>
    </main>
  );
}
export function ReleaseNotice() {
  const release = latestPublished();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (release)
      try {
        setShow(localStorage.getItem("auryn-release-seen") !== release.version);
      } catch {}
  }, [release]);
  if (!release || !show) return null;
  return (
    <aside className={styles.notice}>
      <ContextLink page="changelog">What’s new · {release.title}</ContextLink>
      <button
        aria-label="Dismiss release update"
        onClick={() => {
          setShow(false);
          try {
            localStorage.setItem("auryn-release-seen", release.version);
          } catch {}
        }}
      >
        ×
      </button>
    </aside>
  );
}
