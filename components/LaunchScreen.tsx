"use client";
import { createContext, useContext, useEffect, useState } from "react";
import styles from "./LaunchScreen.module.css";

const LaunchStartedAt = createContext<number | null>(null);

/** One in-memory clock across startup gates; a later sign-in gets a fresh sequence. */
export function LaunchSequence({ children }: { children: React.ReactNode }) {
  const [startedAt] = useState(() => Date.now());
  return (
    <LaunchStartedAt.Provider value={startedAt}>
      {children}
    </LaunchStartedAt.Provider>
  );
}

/** Shared by authentication, access and saved-workspace gates. No minimum delay. */
export default function LaunchScreen({
  error,
  onRetry,
  onSignOut,
}: {
  error?: string;
  onRetry?: () => void;
  onSignOut?: () => void;
} = {}) {
  const startedAt = useContext(LaunchStartedAt);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const remaining =
      startedAt === null
        ? 10000
        : Math.max(0, 10000 - (Date.now() - startedAt));
    const timer = window.setTimeout(() => setSlow(true), remaining);
    return () => window.clearTimeout(timer);
  }, [startedAt]);
  return (
    <section className={styles.launch} aria-label="Workspace launch">
      <div className={styles.content}>
        <div className={styles.mark} aria-hidden="true">
          <img src="/icon.svg" width="44" height="47" alt="" />
        </div>
        <div role={error ? "alert" : "status"} aria-busy={!error}>
          <h1>
            {error
              ? "Your workspace could not be opened"
              : "Opening your workspace"}
          </h1>
        </div>
        <div className={styles.recovery}>
          {error ? (
            <p>{error}</p>
          ) : slow ? (
            <p role="status">
              Taking longer than usual. Check your connection, or reload to try
              again.
            </p>
          ) : null}
          {(error || slow) && (
            <div className={styles.actions}>
              <button
                type="button"
                onClick={onRetry || (() => window.location.reload())}
              >
                {error ? "Try again" : "Reload"}
              </button>
              {onSignOut && (
                <button type="button" onClick={onSignOut}>
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Local shape while a secondary workspace chunk loads; never replaces cached data. */
export function PageSkeleton({ page = "workspace" }: { page?: string }) {
  const table = page === "portfolio" || page === "watchlist";
  return (
    <section
      className={styles.skeleton}
      role="status"
      aria-busy="true"
      aria-label={`Opening ${page}`}
    >
      <span className={styles.skeletonHeading} aria-hidden="true" />
      <span className={styles.skeletonLine} aria-hidden="true" />
      <div className={table ? styles.table : styles.chart} aria-hidden="true">
        {Array.from({ length: table ? 5 : 3 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <p>Opening {page}…</p>
    </section>
  );
}
