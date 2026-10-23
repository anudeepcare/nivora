"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { api, signOutAndRedirect } from "@/lib/client";
import { clearAccountCache } from "@/lib/account-cache";
import {
  resolveAccess,
  featureNames,
  type Access,
  type Feature,
} from "@/lib/access-policy";
import { ProductSession, type DemoData } from "./Session";
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
  const path = usePathname();
  const [access, setAccess] = useState<AccessView | null>(null),
    [error, setError] = useState(""),
    [sample, setSample] = useState<DemoData | null>(null),
    [revision, setRevision] = useState(0),
    [visit, setVisit] = useState<{ path: string; error: string } | null>(null);
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
        if (a.sampleOnly) {
          const { demoData } = await import("@/tests/fixtures/demo");
          if (alive) setSample({ ...demoData, routePrefix: "" });
        }
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
  useEffect(() => {
    if (
      !access?.sampleOnly ||
      !access.admitted ||
      !/^\/research\/[^/]+/.test(path)
    )
      return;
    let active = true;
    const symbol = decodeURIComponent(path.slice("/research/".length));
    api("access/visit", { symbol })
      .then(() => {
        if (active) setVisit({ path, error: "" });
      })
      .catch((e) => {
        if (active) setVisit({ path, error: e.message });
      });
    return () => {
      active = false;
    };
  }, [path, access?.sampleOnly, access?.admitted, access?.plan, revision]);
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
  if (!access.admitted)
    return (
      <main className="membership-state">
        <span className="eyebrow">Private beta</span>
        <h1>Your account is ready.</h1>
        <p>An invitation is needed before opening this private test.</p>
        <button className="button" onClick={refresh}>
          Check invitation
        </button>
        <button className="button" onClick={() => void signOutAndRedirect()}>
          Sign out
        </button>
      </main>
    );
  const preview = access.preview;
  const context = { access, refresh };
  let content = children;
  if (access.sampleOnly) {
    if (!sample)
      return (
        <main className="membership-state" role="status">
          Opening sample workspace…
        </main>
      );
    if (/^\/research\/[^/]+/.test(path) && visit?.path !== path)
      return (
        <main className="membership-state" role="status">
          Checking your research allowance…
        </main>
      );
    if (visit?.path === path && visit.error)
      content = (
        <main className="membership-state">
          <h1>Research allowance</h1>
          <p role="alert">{visit.error}</p>
          <Link href="/settings">Plan & access →</Link>
        </main>
      );
    content = <ProductSession demo={sample}>{content}</ProductSession>;
  }
  return (
    <Context.Provider value={context}>
      <div
        style={{ display: "contents" }}
        key={JSON.stringify([access.plan, access.sampleOnly, access.features])}
      >
        {content}
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
  return access.features[feature]
    ? children
    : (fallback ?? (
        <section className="feature-lock">
          <span className="plan-pill">Pro</span>
          <h3>{featureNames[feature]}</h3>
          <p>This section is not included in your current access.</p>
          <Link href="/settings">View plan & access →</Link>
        </section>
      ));
}

export function AccessNotice() {
  const { access } = useAccess();
  return access.sampleOnly || access.preview ? (
    <p className="membership-status" role="status">
      {access.sampleOnly
        ? "SAMPLE DATA · Private beta · Not live prices or your real holdings"
        : `OWNER PREVIEW · ${access.preview?.toUpperCase()} · Billing unchanged`}
    </p>
  ) : null;
}
