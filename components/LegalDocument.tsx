"use client";
import { ContextLink, DocumentBack } from "./ContextLink";
import { PrivacyChoices } from "./AnalyticsConsent";
import ProductGuide from "./ProductGuide";
import Link from "next/link";
import styles from "./LegalDocument.module.css";
import {
  documents,
  legalConfiguration,
  type DocumentId,
} from "@/lib/legal-content";
export default function LegalDocument({ id }: { id: DocumentId }) {
  const d = documents[id];
  return (
    <main className={`legal-document atlas-document ${styles.document}`}>
      <header>
        <Link href="/" className="legal-brand">
          <img src="/icon.svg" width="28" height="28" alt="" /> AURYN
        </Link>
        <DocumentBack />
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
          <ContextLink page="contact" className="document-contact-link">
            Contact AURYN →
          </ContextLink>
        </nav>
        <article
          className="document-reading"
          data-guide={id === "help" || undefined}
          data-document-version={legalConfiguration.version}
        >
          <span className="document-eyebrow">AURYN · HELP & TRUST</span>
          <h1>{id === "help" ? "Your Auryn field guide" : d.title}</h1>
          <p className="legal-intro">{d.intro}</p>
          <p className="document-updated">
            Updated {legalConfiguration.updated}
          </p>
          {id === "help" ? (
            <ProductGuide topics={d.sections} />
          ) : (
            <div className="document-sections">
              {d.sections.map((section) => (
                <section key={section.title}>
                  <h2>{section.title}</h2>
                  <p>{section.text}</p>
                </section>
              ))}
            </div>
          )}
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
