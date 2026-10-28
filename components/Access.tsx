"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import Link from "next/link";
import { api, signOutAndRedirect } from "@/lib/client";
import { clearAccountCache } from "@/lib/account-cache";
import {
  resolveAccess,
  featureNames,
  type Access,
  type Feature,
} from "@/lib/access-policy";
const personal = resolveAccess({
  enabled: false,
  owner: false,
  licensed: false,
  now: "2026-01-01T00:00:00Z",
});
export type AccessView = Access & { researchUsed?: number };
const Context = createContext<{ access: AccessView; refresh: () => void }>({
  access: personal,
  refresh: () => {},
});
export const useAccess = () => useContext(Context);
export function AccessBoundary({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<AccessView | null>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const refresh = useCallback(() => {
    clearAccountCache();
    setAccess(null);
    setRevision((r) => r + 1);
  }, []);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const a = await api<AccessView>("access");
        if (!alive) return;
        setError("");
        setAccess((old) => {
          if (old && JSON.stringify(old) !== JSON.stringify(a))
            clearAccountCache();
          return a;
        });
      } catch (e) {
        if (alive) {
          setAccess(null);
          clearAccountCache();
          setError(e instanceof Error ? e.message : "Access unavailable.");
        }
      }
    };
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60000);
    const resume = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("auryn-access-refresh", refresh);
    document.addEventListener("visibilitychange", resume);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("auryn-access-refresh", refresh);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [revision, refresh]);
  if (error && !access)
    return (
      <main className="membership-state">
        <h1>Access could not be checked</h1>
        <p role="alert">{error}</p>
        <button className="button" onClick={refresh}>
          Try again
        </button>
        <button className="button" onClick={() => void signOutAndRedirect()}>
          Sign out
        </button>
      </main>
    );
  if (!access)
    return (
      <main className="membership-state" role="status">
        <span className="spinner" />
        <p>Opening your plan…</p>
      </main>
    );
  const context = { access, refresh };

  return (
    <Context.Provider value={context}>
      <div
        style={{ display: "contents" }}
        key={JSON.stringify([access.plan, access.sampleOnly, access.features])}
      >
        {children}
      </div>
    </Context.Provider>
  );
}
export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { access } = useAccess();
  return access.features[feature] ? (
    children
  ) : fallback !== undefined ? (
    fallback
  ) : (
    <section className="feature-lock">
      <span className="eyebrow">Included with Pro</span>
      <h3>{featureNames[feature]}</h3>
      <p>
        Go deeper with the complete research workspace. Your free Overview and
        news remain available.
      </p>
      <Link href="/plans">Explore Pro →</Link>
    </section>
  );
}

export function AccessNotice() {
  return null;
}
