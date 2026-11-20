"use client";
import { useId, useRef, useState, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { documents, legalConfiguration } from "@/lib/legal-content";

type AuthDocument = "terms" | "privacy" | "risk";

export default function AuthLegalLinks() {
  const [active, setActive] = useState<AuthDocument | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLAnchorElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const title = useId();
  const preview =
    (id: AuthDocument) => (event: MouseEvent<HTMLAnchorElement>) => {
      const target = dialog.current;
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        !target?.showModal
      )
        return;
      flushSync(() => setActive(id));
      try {
        target.showModal();
      } catch {
        setActive(null);
        // Keep the canonical page as a fallback when modals are unavailable.
        return;
      }
      event.preventDefault();
      opener.current = event.currentTarget;
      if (content.current) content.current.scrollTop = 0;
    };
  const document = active ? documents[active] : null;

  return (
    <div>
      By continuing, you agree to the{" "}
      <a href="/terms" onClick={preview("terms")}>
        Terms
      </a>{" "}
      and acknowledge the{" "}
      <a href="/privacy" onClick={preview("privacy")}>
        Privacy Policy
      </a>
      .<br />
      <small>
        <a href="/risk" onClick={preview("risk")}>
          Investing involves risk.
        </a>
      </small>
      <dialog
        className="mp-auth-legal-dialog"
        aria-labelledby={title}
        ref={dialog}
        onClose={() => {
          setActive(null);
          opener.current?.focus({ preventScroll: true });
          opener.current = null;
        }}
      >
        <header>
          <h2 id={title}>{document?.title ?? "Legal information"}</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close legal information"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div
          ref={content}
          className="mp-auth-legal-body"
          tabIndex={0}
          role="region"
          aria-label="Document text"
        >
          {document && (
            <>
              <p>{document.intro}</p>
              <p>Updated {legalConfiguration.updated}</p>
              {document.sections.map((section) => (
                <section key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.text}</p>
                </section>
              ))}
              <a href={`/${active}`} target="_blank" rel="noopener noreferrer">
                Open full page (new tab)
              </a>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
