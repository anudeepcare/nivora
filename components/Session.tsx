"use client";
import {themePreference as parseThemePreference,resolvedTheme} from "@/lib/theme-preference";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { api, authClient } from "@/lib/client";
import type { Research, Workspace } from "@/lib/types";
import { Logo } from "./Ui";
import { readResource, resourceSnapshot } from "@/lib/resource-cache";
import { accountCache, clearAccountCache } from "@/lib/account-cache";
export type DemoData = {
  research: Record<string, Research>;
  workspace: Workspace;
};
type Store = {
  demo?: DemoData;
  owner: string;
  marketProvider: "hybrid" | "eodhd" | "twelve" | "none" | "unknown";
  workspace: Workspace | null;
  workspaceError: string;
  reloadWorkspace: () => Promise<void>;
  mutate: (body: unknown) => Promise<void>;
  cache: Map<string, { at: number; value: unknown }>;
  theme: "light" | "dark";
  setTheme: (v: "light" | "dark" | "system") => void;
  themePreference: "light" | "dark" | "system";
  textSize: "standard" | "large";
  setTextSize: (v: "standard" | "large") => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
};
const Context = createContext<Store | null>(null);
export const useProduct = () => {
  const s = useContext(Context);
  if (!s) throw Error("Product context missing");
  return s;
};
export function ProductSession({
  children,
  demo,
}: {
  children: React.ReactNode;
  demo?: DemoData;
}) {
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(!demo),
    [error, setError] = useState("");
  useEffect(() => {
    if (demo) return;
    let alive = true;
    try {
      const client = authClient();
      client.auth
        .getSession()
        .then(({ data, error }) => {
          if (!alive) return;
          if (error) setError("Your account session could not be loaded.");
          setSession(data.session);
          setLoading(false);
        })
        .catch(() => {
          if (alive) {
            setError("Your session could not be loaded. Please sign in again.");
            setLoading(false);
          }
        });
      const { data } = client.auth.onAuthStateChange((_event, next) => {
        if (!next) clearAccountCache();
        if (alive) {
          setSession(next);
          setLoading(false);
        }
      });
      return () => {
        alive = false;
        data.subscription.unsubscribe();
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Account unavailable");
      setLoading(false);
    }
  }, [demo]);
  if (loading)
    return (
      <main className="session-state">
        <Logo />
        <span className="spinner" />
        <p>Opening your workspace…</p>
      </main>
    );
  if (!demo && !session) return <Login initialError={error} />;
  return (
    <StoreProvider
      key={demo ? "preview" : session!.user.id}
      owner={session?.user.id || "preview"}
      demo={demo}
    >
      {children}
    </StoreProvider>
  );
}
function StoreProvider({
  children,
  owner,
  demo,
}: {
  children: React.ReactNode;
  owner: string;
  demo?: DemoData;
}) {
  const cache = useMemo(
    () =>
      demo
        ? new Map<string, { at: number; value: unknown }>()
        : accountCache(owner),
    [owner, demo],
  );
  const [marketProvider, setMarketProvider] = useState<
    "hybrid" | "eodhd" | "twelve" | "none" | "unknown"
  >(
    () =>
      (
        cache.get("provider-status")?.value as
          | { marketProvider: Store["marketProvider"] }
          | undefined
      )?.marketProvider ?? "unknown",
  );
  useEffect(() => {
    if (demo) return;
    let active = true;
    readResource(cache, "provider-status", 300000, () =>
      api<{ marketProvider: "hybrid" | "eodhd" | "twelve" | "none" }>(
        "provider-status",
      ),
    )
      .then((x) => {
        if (active) setMarketProvider(x.marketProvider);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [demo, cache]);
  const [workspace, setWorkspace] = useState<Workspace | null>(
      demo?.workspace ??
        (cache.get("workspace")?.value as Workspace | undefined) ??
        null,
    ),
    [workspaceError, setWorkspaceError] = useState(""),
    [theme, setThemeState] = useState<"light" | "dark">("light"),
    [themePreference, setThemePreference] = useState<
      "light" | "dark" | "system"
    >(() => {
      try {
        const v =
          typeof window === "undefined"
            ? null
            : localStorage.getItem("auryn-product-theme");
        return parseThemePreference(v);
      } catch {
        return "light";
      }
    }),
    [textSize, setTextSizeState] = useState<"standard" | "large">("standard"),
    [reduceMotion, setReduceMotionState] = useState(false);
  const alive = useRef(true);
  const reloadWorkspace = useCallback(async () => {
    if (demo) return;
    try {
      const value = await api<Workspace>("workspace");
      if (alive.current) {
        cache.set("workspace", { at: Date.now(), value });
        setWorkspace(value);
        setWorkspaceError("");
      }
    } catch (e) {
      if (alive.current)
        setWorkspaceError(
          e instanceof Error ? e.message : "Saved investments unavailable",
        );
    }
  }, [demo, cache]);
  useEffect(() => {
    alive.current = true;
    void reloadWorkspace();
    return () => {
      alive.current = false;
    };
  }, [reloadWorkspace, cache]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("auryn-product-theme");
      setThemePreference(
        parseThemePreference(saved),
      );
      setTextSizeState(
        localStorage.getItem("auryn-product-text") === "large"
          ? "large"
          : "standard",
      );
      setReduceMotionState(
        localStorage.getItem("auryn-product-motion") === "reduce",
      );
    } catch {}
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const value =
        resolvedTheme(themePreference,media.matches);
      document.documentElement.dataset.theme = value;
      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach((meta) => {
          meta.content = value === "dark" ? "#171b24" : "#f2f4f7";
          meta.removeAttribute("media");
        });
      setThemeState(value);
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [themePreference]);
  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);
  useEffect(() => {
    document.documentElement.dataset.motion = reduceMotion
      ? "reduce"
      : "system";
  }, [reduceMotion]);
  const setTheme = useCallback((value: "light" | "dark" | "system") => {
    setThemePreference(value);
    try {
      localStorage.setItem("auryn-product-theme", value);
    } catch {}
  }, []);
  const setTextSize = useCallback((value: "standard" | "large") => {
    setTextSizeState(value);
    try {
      localStorage.setItem("auryn-product-text", value);
    } catch {}
  }, []);
  const setReduceMotion = useCallback((value: boolean) => {
    setReduceMotionState(value);
    try {
      localStorage.setItem("auryn-product-motion", value ? "reduce" : "system");
    } catch {}
  }, []);
  const mutate = useCallback(
    async (body: unknown) => {
      if (demo)
        throw Error(
          "This design preview is read-only. Your account is unchanged.",
        );
      await api("workspace", body);
      await reloadWorkspace();
    },
    [demo, reloadWorkspace],
  );
  const value = useMemo(
    () => ({
      demo,
      owner,
      marketProvider,
      workspace,
      workspaceError,
      reloadWorkspace,
      mutate,
      cache,
      theme,
      setTheme,
      themePreference,
      textSize,
      setTextSize,
      reduceMotion,
      setReduceMotion,
    }),
    [
      marketProvider,
      demo,
      owner,
      workspace,
      workspaceError,
      reloadWorkspace,
      mutate,
      cache,
      theme,
      setTheme,
      themePreference,
      textSize,
      setTextSize,
      reduceMotion,
      setReduceMotion,
    ],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useResource<T>(key: string | null, preview?: T, ttl = 60_000) {
  const { cache, demo } = useProduct(),
    [revision, setRevision] = useState(0),
    [state, setState] = useState<{
      key: string | null;
      data: T | null;
      loading: boolean;
      error: string;
    }>(() => ({
      key,
      data: demo
        ? (preview ?? null)
        : key
          ? ((cache.get(key)?.value as T) ?? null)
          : null,
      loading: !!key && !demo && !cache.has(key),
      error: "",
    }));
  useEffect(() => {
    if (!key) return;
    if (demo) {
      setState({
        key,
        data: preview ?? null,
        loading: false,
        error:
          preview === undefined
            ? "This preview does not contain that data."
            : "",
      });
      return;
    }
    let active = true;
    const old = cache.get(key);
    if (old && Date.now() - old.at < ttl) {
      setState({ key, data: old.value as T, loading: false, error: "" });
      return;
    }
    setState((s) => ({
      key,
      data: resourceSnapshot<T>(cache, key) ?? (s.key === key ? s.data : null),
      loading: true,
      error: "",
    }));
    readResource<T>(cache, key, ttl, () => api<T>(key))
      .then((data) => {
        if (!active) return;
        setState({ key, data, loading: false, error: "" });
      })
      .catch((e) => {
        if (active)
          setState((s) => ({
            ...s,
            loading: false,
            error: e.message || "Unable to load this view.",
          }));
      });
    return () => {
      active = false;
    };
  }, [key, cache, demo, preview, revision, ttl]);
  const refresh = () => {
    if (key) cache.delete(key);
    setRevision((r) => r + 1);
  };
  return {
    ...(state.key === key
      ? state
      : {
          key,
          data: demo ? (preview ?? null) : resourceSnapshot<T>(cache, key),
          loading: !!key,
          error: "",
        }),
    refresh,
  };
}
// Small view preferences stay in this account's memory, not in URLs or storage.
export function useWorkspaceFilter(view: "watchlist" | "portfolio") {
  const { cache } = useProduct();
  const key = `view:${view}:filter`;
  const [query, update] = useState(
    () => (cache.get(key)?.value as string) || "",
  );
  const setQuery = (value: string) => {
    cache.set(key, { at: Date.now(), value });
    update(value);
  };
  return [query, setQuery] as const;
}
function Login({ initialError }: { initialError: string }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(initialError),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<"login" | "signup" | "reset">("login"),
    [notice, setNotice] = useState("");
  useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('mode');if(requested==='signup')setMode('signup');},[]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const auth = authClient().auth;
      const result =
        mode === "login"
          ? await auth.signInWithPassword({ email, password })
          : mode === "signup"
            ? await auth.signUp({
                email,
                password,
                options: { emailRedirectTo: window.location.origin },
              })
            : await auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/settings`,
              });
      if (result.error) throw result.error;
      if (mode !== "login")
        setNotice(
          mode === "signup"
            ? "Check your email to confirm your account."
            : "Check your email for the password reset link.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page refined-auth">
      <section className="login-introduction" aria-label="About AURYN">
        <span className="eyebrow">Decisions you can defend</span>
        <h2>Business first. <br/>Price second. <br/><em>Timing alongside.</em></h2>
        <p>Company fundamentals, valuation scenarios and price context — connected in one focused research workspace.</p>
        <div className="login-preview" aria-label="AURYN interface preview, no live financial data">
          <header><span className="preview-brand-mark">A</span><div><strong>See the business behind the ticker.</strong><small>Business · Value · Timing</small></div><span className="preview-caption">Interface preview</span></header>
          <div className="preview-journey"><section><i>01</i><div><strong>Understand the business</strong><p>Growth → profit → cash generation</p></div></section><section><i>02</i><div><strong>Put the price in perspective</strong><p>Bear · Base · Bull, with the assumptions visible</p></div></section><section><i>03</i><div><strong>Know what to revisit</strong><p>Funding risks, upcoming reports and price context</p></div></section></div>
          <footer>One workspace. Evidence you can inspect.</footer>
        </div>
        <small>Research to inform your judgment. No promised returns or automatic trade instructions.</small>
      </section>
      <section className="login-card">
        <a className="auth-back" href="/">← Explore AURYN</a>
        <Logo />
        <span className="eyebrow">YOUR INVESTMENT WORKSPACE</span>
        <h1>
          {mode === "login"
            ? "Welcome back."
            : mode === "signup"
              ? "Start your research journey."
              : "Reset your password."}
        </h1>
        <p>{mode === "signup" ? "Create one place for your research, watchlist and portfolio." : mode === "reset" ? "We’ll email a secure link to restore access to your workspace." : "Your companies. Your evidence. Your next decision."}</p>
        <form onSubmit={submit} aria-busy={busy}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {mode !== "reset" && (
            <label>
              Password
              <input
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="success">
              {notice}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>
        </form>
        <div className="login-links">
          <button
            disabled={busy}
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError("");
              setNotice("");
            }}
          >
            {mode === "signup"
              ? "Already have an account?"
              : "Create an account"}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setMode(mode === "reset" ? "login" : "reset");
              setError("");
              setNotice("");
            }}
          >
            {mode === "reset" ? "Back to sign in" : "Forgot password?"}
          </button>
        </div>
        <small>Independent research. Investing involves risk.</small>
        <nav className="login-legal" aria-label="Help and legal"><a href="/help">Help</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/risk">Risks</a></nav>
      </section>
    </main>
  );
}
