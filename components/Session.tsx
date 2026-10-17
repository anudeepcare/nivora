"use client";
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
export type DemoData = {
  research: Record<string, Research>;
  workspace: Workspace;
};
type Store = {
  demo?: DemoData;
  owner: string;
  workspace: Workspace | null;
  workspaceError: string;
  reloadWorkspace: () => Promise<void>;
  mutate: (body: unknown) => Promise<void>;
  cache: Map<string, { at: number; value: unknown }>;
  theme: "light" | "dark";
  setTheme: (v: "light" | "dark") => void;
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
  const cache = useRef(
    new Map<string, { at: number; value: unknown }>(),
  ).current;
  const [workspace, setWorkspace] = useState<Workspace | null>(
      demo?.workspace ?? null,
    ),
    [workspaceError, setWorkspaceError] = useState(""),
    [theme, setThemeState] = useState<"light" | "dark">("dark");
  const alive = useRef(true);
  const reloadWorkspace = useCallback(async () => {
    if (demo) return;
    try {
      const value = await api<Workspace>("workspace");
      if (alive.current) {
        setWorkspace(value);
        setWorkspaceError("");
      }
    } catch (e) {
      if (alive.current)
        setWorkspaceError(
          e instanceof Error ? e.message : "Saved investments unavailable",
        );
    }
  }, [demo]);
  useEffect(() => {
    alive.current = true;
    void reloadWorkspace();
    return () => {
      alive.current = false;
      cache.clear();
    };
  }, [reloadWorkspace, cache]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("auryn-product-theme");
      const value = saved === "light" ? "light" : "dark";
      document.documentElement.dataset.theme = value;
      setThemeState(value);
    } catch {}
  }, []);
  const setTheme = useCallback((value: "light" | "dark") => {
    setThemeState(value);
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem("auryn-product-theme", value);
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
      workspace,
      workspaceError,
      reloadWorkspace,
      mutate,
      cache,
      theme,
      setTheme,
    }),
    [
      demo,
      owner,
      workspace,
      workspaceError,
      reloadWorkspace,
      mutate,
      cache,
      theme,
      setTheme,
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
    }>({ key: null, data: null, loading: false, error: "" });
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
    const controller = new AbortController();
    setState((s) => ({
      key,
      data: s.key === key ? s.data : null,
      loading: true,
      error: "",
    }));
    api<T>(key, undefined, controller.signal)
      .then((data) => {
        if (!active) return;
        cache.set(key, { at: Date.now(), value: data });
        if (cache.size > 80) cache.delete(cache.keys().next().value!);
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
      controller.abort();
    };
  }, [key, cache, demo, preview, revision, ttl]);
  const refresh = () => {
    if (key) cache.delete(key);
    setRevision((r) => r + 1);
  };
  return {
    ...(state.key === key
      ? state
      : { key, data: null, loading: !!key, error: "" }),
    refresh,
  };
}
function Login({ initialError }: { initialError: string }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(initialError),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<"login" | "signup" | "reset">("login"),
    [notice, setNotice] = useState("");
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
    <main className="login-page">
      <section className="login-card">
        <Logo />
        <span className="eyebrow">YOUR INVESTMENT WORKSPACE</span>
        <h1>
          {mode === "login"
            ? "Welcome back."
            : mode === "signup"
              ? "Make room for clarity."
              : "Reset your password."}
        </h1>
        <p>Understand the business. Put the price in perspective.</p>
        <form onSubmit={submit}>
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
      </section>
    </main>
  );
}
