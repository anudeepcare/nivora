"use client";
import { usePathname, useRouter } from "next/navigation";
import { authDestination, authErrorMessage } from "@/lib/auth-navigation";
import {
  themePreference as parseThemePreference,
  resolvedTheme,
} from "@/lib/theme-preference";
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
  /** Empty for authenticated synthetic-data beta; undefined for localhost preview. */
  routePrefix?: "";
  research: Record<string, Research>;
  workspace: Workspace;
};
type Store = {
  demo?: DemoData;
  owner: string;
  displayName?: string;
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
  const pathname = usePathname();
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(!demo),
    [error, setError] = useState("");
  useEffect(() => {
    if (demo) return;
    let alive = true;
    let authEventSeen = false;
    try {
      const client = authClient();
      client.auth
        .getSession()
        .then(({ data, error }) => {
          if (!alive || authEventSeen) return;
          if (error) setError("Your account session could not be loaded.");
          setSession(data.session);
          setLoading(false);
        })
        .catch(() => {
          if (alive && !authEventSeen) {
            setError("Your session could not be loaded. Please sign in again.");
            setLoading(false);
          }
        });
      const { data } = client.auth.onAuthStateChange((event, next) => {
        authEventSeen = true;
        if (event === "PASSWORD_RECOVERY") setRecovering(true);
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
  }, [demo, router]);
  useEffect(() => {
    if (demo) return;
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", restored);
    return () => window.removeEventListener("pageshow", restored);
  }, [demo]);
  const destination =
    !demo && !loading ? authDestination(pathname, !!session, recovering) : null;
  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);
  if (loading || destination)
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
      displayName={
        typeof session?.user.user_metadata?.full_name === "string"
          ? session.user.user_metadata.full_name
              .trim()
              .split(/\s+/)[0]
              .slice(0, 25)
          : undefined
      }
    >
      {children}
    </StoreProvider>
  );
}
function StoreProvider({
  children,
  owner,
  demo,
  displayName,
}: {
  children: React.ReactNode;
  owner: string;
  demo?: DemoData;
  displayName?: string;
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
      setThemePreference(parseThemePreference(saved));
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
      const value = resolvedTheme(themePreference, media.matches);
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
      displayName,
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
      displayName,
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
  const router = useRouter();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(initialError),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState<"login" | "signup" | "reset">("login"),
    [notice, setNotice] = useState(""),
    [resendPending, setResendPending] = useState(false),
    [resendUntil, setResendUntil] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
    const message = authErrorMessage(params.get("auth_error"));
    if (message) setError(message);
  }, []);
  const [socialProviders, setSocialProviders] = useState<{
    google: boolean | null;
    x: boolean | null;
  }>({ google: null, x: null });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/providers", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (v && !controller.signal.aborted)
          setSocialProviders({
            google: typeof v.google === "boolean" ? v.google : null,
            x: typeof v.x === "boolean" ? v.x : null,
          });
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!resendUntil) return;
    const timer = setTimeout(
      () => setResendUntil(0),
      Math.max(0, resendUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [resendUntil]);
  async function resendConfirmation() {
    if (resendPending || resendUntil > Date.now() || !email.trim()) return;
    setResendPending(true);
    setError("");
    try {
      const r = await authClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (r.error) throw r.error;
      setNotice(
        "Confirmation requested. Check your inbox and spam folder, then return to sign in.",
      );
      setResendUntil(Date.now() + 60000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Confirmation could not be requested.",
      );
    } finally {
      setResendPending(false);
    }
  }
  async function social(provider: "google" | "x") {
    if (busy) return;
    if (socialProviders[provider] === false) {
      setError(
        `${provider === "google" ? "Google" : "X"} sign-in has not been enabled yet. Please use email.`,
      );
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error } = await authClient().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch {
      setError(
        "This sign-in option is unavailable right now. Please use email or try again later.",
      );
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const auth = authClient().auth;
      const result =
        mode === "login"
          ? await auth.signInWithPassword({ email: email.trim(), password })
          : mode === "signup"
            ? await auth.signUp({
                email: email.trim(),
                password,
                options: {
                  emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
              })
            : await auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
              });
      if (result.error) throw result.error;
      if (
        mode === "login" ||
        ("data" in result && "session" in result.data && result.data.session)
      )
        router.replace("/overview");
      else
        setNotice(
          mode === "signup"
            ? `Confirm your email to finish creating your account. Check the inbox and spam folder for ${email.trim()}. After confirming, sign in to choose your plan.`
            : "Check your email for the password reset link.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="entry-page">
      <section className="entry-art" aria-label="About AURYN">
        <a href="/" className="entry-art-brand">
          <Logo />
        </a>
        <div className="entry-landscape" aria-hidden="true">
          <svg viewBox="0 0 680 480" fill="none">
            {Array.from({ length: 24 }, (_, row) => (
              <path
                key={row}
                d={Array.from({ length: 49 }, (_, i) => {
                  const x = i * 14,
                    y =
                      125 +
                      row * 10 -
                      70 *
                        Math.exp(-((x - 310) ** 2) / 17000) *
                        Math.sin(row / 8) +
                      45 * Math.sin(x / 125 + row / 13);
                  return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(" ")}
                stroke="#6294e3"
                strokeWidth=".7"
                opacity={0.3 + row / 60}
              />
            ))}
            {Array.from({ length: 35 }, (_, col) => (
              <path
                key={col}
                d={Array.from({ length: 24 }, (_, row) => {
                  const x = col * 20,
                    y =
                      125 +
                      row * 10 -
                      70 *
                        Math.exp(-((x - 310) ** 2) / 17000) *
                        Math.sin(row / 8) +
                      45 * Math.sin(x / 125 + row / 13);
                  return `${row ? "L" : "M"}${x} ${y.toFixed(1)}`;
                }).join(" ")}
                stroke="#6294e3"
                strokeWidth=".6"
                opacity=".4"
              />
            ))}
            <path
              d="M65 280L160 245L270 260L375 170L475 205L610 120"
              stroke="#2269dd"
              strokeWidth="2"
            />
            {[
              [160, 245, "Business"],
              [375, 170, "Value"],
              [610, 120, "Timing"],
            ].map(([x, y, label]) => (
              <g key={label}>
                <circle cx={x} cy={y} r="5" fill="#2469e5" />
                <text
                  x={Number(x) - 22}
                  y={Number(y) - 18}
                  fill="#28578a"
                  fontSize="13"
                >
                  {label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="entry-art-copy">
          <span>A deeper understanding.</span>
          <h2>A clearer perspective.</h2>
          <p>
            Business, value and timing.
            <br />
            One thoughtful research workspace.
          </p>
        </div>
        <small>
          Research to inform your judgment. Investing involves risk.
        </small>
      </section>
      <section className="entry-form">
        <a className="auth-back" href="/">
          ← Explore AURYN
        </a>
        <Logo />

        <h1>
          {mode === "login"
            ? "Welcome to AURYN."
            : mode === "signup"
              ? "Make room for conviction."
              : "Reset your password."}
        </h1>
        <p>
          {mode === "signup"
            ? "Create one place for your research, watchlist and portfolio."
            : mode === "reset"
              ? "We’ll email a secure link to restore access to your workspace."
              : "Your research. A clearer perspective."}
        </p>
        {mode !== "reset" && (
          <div className="entry-mode" aria-label="Account access">
            {(["login", "signup"] as const).map((value) => (
              <button
                key={value}
                type="button"
                disabled={busy}
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setError("");
                  setNotice("");
                }}
              >
                {value === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        )}
        {mode !== "reset" &&
          (socialProviders.google === false || socialProviders.x === false) && (
            <p className="auth-provider-note" role="status">
              {socialProviders.google === false && socialProviders.x === false
                ? "Social sign-in is not enabled yet. Continue securely with email below."
                : `${socialProviders.google === false ? "Google" : "X"} sign-in is not enabled yet. Use an available option below.`}
            </p>
          )}
        {mode !== "reset" && (
          <div
            className="auth-social"
            aria-label="Continue with a social account"
          >
            <button
              type="button"
              disabled={busy || socialProviders.google === false}
              onClick={() => social("google")}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.36Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.4 13.91a6 6 0 0 1 0-3.82V7.5H3.06a10 10 0 0 0 0 9l3.34-2.59Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.97c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.34 2.59A5.97 5.97 0 0 1 12 5.97Z"
                />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              disabled={busy || socialProviders.x === false}
              onClick={() => social("x")}
            >
              <span aria-hidden="true">𝕏</span>Continue with X
            </button>
            <div className="auth-divider">
              <span>or use email</span>
            </div>
          </div>
        )}
        <form onSubmit={submit} aria-busy={busy}>
          <label>
            Email address
            <input
              type="email"
              name="email"
              id="auryn-signin-email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
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
                name="password"
                id="auryn-signin-password"
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
          {mode === "signup" && notice && (
            <button
              type="button"
              className="button"
              disabled={resendPending || !!resendUntil}
              onClick={() => void resendConfirmation()}
            >
              {resendPending
                ? "Requesting…"
                : resendUntil
                  ? "Resend available in one minute"
                  : "Resend confirmation email"}
            </button>
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
        <small>
          By continuing, you agree to our <a href="/terms">Terms</a> and
          acknowledge our <a href="/privacy">Privacy Policy</a>. Investing
          involves risk.
        </small>
        <nav className="login-legal" aria-label="Help and legal">
          <a href="/help">Help</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/risk">Risks</a>
        </nav>
      </section>
    </main>
  );
}
