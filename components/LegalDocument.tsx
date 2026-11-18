"use client";
import { ContextLink, DocumentBack } from "./ContextLink";
import { PrivacyChoices } from "./AnalyticsConsent";
import { useState } from "react";
import PublicHomeLink from "./PublicHomeLink";
import styles from "./LegalDocument.module.css";
import {
  documents,
  legalConfiguration,
  type DocumentId,
} from "@/lib/legal-content";
export default function LegalDocument({ id }: { id: DocumentId }) {
  const [query, setQuery] = useState(""),
    d = documents[id],
    sections = d.sections.filter((s) =>
      (s.title + " " + s.text)
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
    );
  return (
    <main
      className={`legal-document atlas-document ${styles.document}`}
      data-document={id}
    >
      <header>
        <PublicHomeLink className="legal-brand">
          <img src="/icon.svg" width="28" height="28" alt="" /> AURYN
        </PublicHomeLink>
        <div className={styles.documentActions}>
          <ContextLink page="contact">Contact support</ContextLink>
          <DocumentBack />
        </div>
      </header>
      <div className="document-layout">
        <nav aria-label="Help and legal documents">
          {(Object.keys(documents) as DocumentId[]).map((k) => (
            <ContextLink
              key={k}
              page={k}
              aria-current={k === id ? "page" : undefined}
            >
              {k === "risk"
                ? "Risk disclosure"
                : k[0].toUpperCase() + k.slice(1)}
            </ContextLink>
          ))}
        </nav>
        <article
          className="document-reading"
          data-document-version={legalConfiguration.version}
        >
          <span className="document-eyebrow">AURYN · HELP & TRUST</span>
          <h1>{d.title}</h1>
          <p className="legal-intro">{d.intro}</p>
          <p className="document-updated">
            Updated {legalConfiguration.updated}
          </p>
          {id === "help" && (
            <div className={styles.helpContact}>
              <div>
                <strong>Need a hand?</strong>
                <p>
                  For account, billing or technical issues, send a support
                  request.
                </p>
              </div>
              <ContextLink page="contact">Contact support ↗</ContextLink>
            </div>
          )}
          {id === "help" && (
            <label className="help-search">
              Find a topic
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try Pace, valuation or portfolio"
              />
            </label>
          )}
          {id === "help" && query && (
            <div className="help-search-result" role="status">
              <span>
                {sections.length} matching{" "}
                {sections.length === 1 ? "topic" : "topics"}
              </span>
              <button type="button" onClick={() => setQuery("")}>
                Clear search
              </button>
            </div>
          )}
          {id === "methodology" && (
            <section
              className={styles.methodologyIntro}
              aria-label="Method at a glance"
            >
              <h2>Business. Price. Pace.</h2>
              <p>
                {
                  d.sections.find((s) => s.title === "Three separate questions")
                    ?.text
                }
              </p>
              <p>
                Model conditions support research, not orders or personalized
                advice. Open a topic below for the exact rules, assumptions and
                limitations.
              </p>
            </section>
          )}
          <div className="document-sections">
            {sections
              .filter(
                (s) =>
                  id !== "methodology" ||
                  s.title !== "Three separate questions",
              )
              .map((s) =>
                id === "methodology" || id === "help" ? (
                  <details
                    key={s.title}
                    className={
                      id === "help"
                        ? styles.helpTopic
                        : styles.methodologyDetails
                    }
                    open={id === "help" && !!query.trim() ? true : undefined}
                  >
                    <summary>{s.title}</summary>
                    <p>{s.text}</p>
                  </details>
                ) : (
                  <section key={s.title}>
                    <h2>{s.title}</h2>
                    <p>{s.text}</p>
                  </section>
                ),
              )}
            {!sections.length && (
              <p>No matching topic. Try a shorter search.</p>
            )}
          </div>
        </article>
      </div>
      <footer>
        <p>{legalConfiguration.operator}</p>
        <a href={`mailto:${legalConfiguration.contact}`}>
          {legalConfiguration.contact}
        </a>
        <PrivacyChoices compact />
        <span>© {new Date().getFullYear()} AURYN. All rights reserved.</span>
      </footer>
    </main>
  );
}
