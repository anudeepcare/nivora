"use client";
import { PrivacyChoices } from "./AnalyticsConsent";
import { useState } from "react";
import Link from "next/link";
import {
  documents,
  legalConfiguration,
  type DocumentId,
} from "@/lib/legal-content";
export default function LegalDocument({ id }: { id: DocumentId }) {
  const [query, setQuery] = useState(""),
    d = documents[id],
    sections = d.sections.filter((s) =>
      (s.title + " " + s.text).toLowerCase().includes(query.toLowerCase()),
    );
  return (
    <main className="legal-document atlas-document">
      <header>
        <Link href="/" className="legal-brand">
          <img src="/icon.svg" width="28" height="28" alt="" /> AURYN
        </Link>
        <Link href="/">Back to home →</Link>
      </header>
      <div className="document-layout">
        <nav aria-label="Help and legal documents">
          {(Object.keys(documents) as DocumentId[]).map((k) => (
            <Link
              key={k}
              href={`/${k}`}
              aria-current={id === k ? "page" : undefined}
            >
              {k === "risk"
                ? "Risk disclosure"
                : k[0].toUpperCase() + k.slice(1)}
            </Link>
          ))}
          <Link href="/contact" className="document-contact-link">
            Contact AURYN →
          </Link>
        </nav>
        <article className="document-reading">
          <span className="document-eyebrow">AURYN · HELP & TRUST</span>
          <h1>{d.title}</h1>
          <p className="legal-intro">{d.intro}</p>
          <p className="document-updated">
            Updated {legalConfiguration.updated} · {legalConfiguration.version}
          </p>
          {id === "help" && (
            <label className="help-search">
              Find a topic
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try DCA, valuation or portfolio"
              />
            </label>
          )}
          <div className="document-sections">
            {sections.map((s, i) => (
              <section key={s.title}>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </section>
            ))}
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
        <PrivacyChoices />
        <span>© {new Date().getFullYear()} AURYN. All rights reserved.</span>
      </footer>
    </main>
  );
}
