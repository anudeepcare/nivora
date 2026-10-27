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
import { PublicSample } from "./PublicLanding";
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
    // Match the server render; the boot script already applies saved appearance.
    [themePreference, setThemePreference] = useState<
      "light" | "dark" | "system"
    >("light"),
    [textSize, setTextSizeState] = useState<"standard" | "large">("standard"),
    [reduceMotion, setReduceMotionState] = useState(false),
    [preferencesReady, setPreferencesReady] = useState(false);
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
    setPreferencesReady(true);
  }, []);
  useEffect(() => {
    if (!preferencesReady) return;
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
  }, [preferencesReady, themePreference]);
  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.dataset.textSize = textSize;
  }, [preferencesReady, textSize]);
  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.dataset.motion = reduceMotion
      ? "reduce"
      : "system";
  }, [preferencesReady, reduceMotion]);
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
    if (demo) return;
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
  }, [key, cache, demo, revision, ttl]);
  const refresh = () => {
    if (key) cache.delete(key);
    setRevision((r) => r + 1);
  };
  if (demo)
    return {
      key,
      data: preview ?? null,
      loading: false,
      error:
        key && preview === undefined
          ? "This preview does not contain that data."
          : "",
      refresh,
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
    const requestedMode = params.get("mode");
    if (requestedMode === "signup" || requestedMode === "reset")
      setMode(requestedMode);
    const message = authErrorMessage(params.get("auth_error"));
    if (message) setError(message);
  }, []);
  const [socialProviders, setSocialProviders] = useState<{
    google: boolean | null;
    x: boolean | null;
  }>({ google: null, x: null });
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    if (busy) return;
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
                  data: { full_name: name.trim() },
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
    <main className="mp-auth ap-auth" data-auth-mode={mode}>
      <aside className="mp-auth-story" aria-label="About AURYN">
        <a className="mp-brand" href="/" aria-label="Auryn home">
          <span className="mp-brand-mark" aria-hidden="true">
            <img src="/icon.svg" alt="" width="34" height="36" />
          </span>
          <span>AURYN</span>
        </a>
        <div className="mp-auth-story-copy">
          <span className="mp-overline">INVEST WITH UNDERSTANDING</span>
          <h2>
            Know the stock.
            <br />
            <em>Know your next move.</em>
          </h2>
          <p>Business first. A clear decision. Your pace for gradual buying.</p>
        </div>
        <PublicSample compact />
        <div className="mp-auth-story-footer">
          <span>A clearer case. A considered pace.</span>
          <span>Research supports your judgment. Investing involves risk.</span>
        </div>
      </aside>
      <section className="mp-auth-main" aria-label="Account access">
        <div className="mp-auth-mobile-brand">
          <a className="mp-brand" href="/" aria-label="Auryn home">
            <span className="mp-brand-mark" aria-hidden="true">
              <img src="/icon.svg" alt="" width="29" height="31" />
            </span>
            <span>AURYN</span>
          </a>
        </div>
        <a className="mp-auth-home" href="/">
          ← Back to Auryn
        </a>
        <div
          className={`mp-auth-panel ${mode === "reset" ? "mp-reset-panel" : ""}`}
        >
          <div className="mp-auth-heading">
            <span className="mp-overline">
              {mode === "reset"
                ? "RESET PASSWORD"
                : mode === "signup"
                  ? "WELCOME TO AURYN"
                  : "YOUR WORKSPACE AWAITS"}
            </span>
            <h1>
              {mode === "login"
                ? "Welcome back."
                : mode === "signup"
                  ? "Start with clarity."
                  : "A fresh start."}
            </h1>
            <p>
              {mode === "signup"
                ? "Understand the business. Plan gradual buying with AURYN Pace."
                : mode === "reset"
                  ? "We’ll email a secure link to restore access to your workspace."
                  : "Your business research, buy and sell guidance, and AURYN Pace."}
            </p>
          </div>
          {mode !== "reset" && (
            <>
              <div
                className="mp-social-options"
                aria-label="Continue with a social account"
              >
                <button
                  type="button"
                  className="mp-social-button"
                  aria-label="Continue with Google"
                  disabled={busy || socialProviders.google === false}
                  onClick={() => social("google")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5ZM12 22c2.7 0 5-1 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.7A10 10 0 0 0 12 22ZM6.4 13.8a6 6 0 0 1 0-3.6V7.5H3a10 10 0 0 0 0 9l3.4-2.7ZM12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.7C7.2 7.8 9.4 6 12 6Z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
                <button
                  type="button"
                  className="mp-social-button mp-social-x"
                  aria-label="Continue with X"
                  disabled={busy || socialProviders.x === false}
                  onClick={() => social("x")}
                >
                  <span aria-hidden="true">𝕏</span>
                  <span className="mp-social-x-label">Continue with X</span>
                </button>
              </div>
              {(socialProviders.google === false ||
                socialProviders.x === false) && (
                <p className="mp-provider-note" role="status">
                  {socialProviders.google === false &&
                  socialProviders.x === false
                    ? "Social sign-in is not enabled yet. Continue securely with email below."
                    : `${socialProviders.google === false ? "Google" : "X"} sign-in is not enabled yet. Use an available option below.`}
                </p>
              )}
              <div className="mp-form-divider">
                <span>or continue with email</span>
              </div>
            </>
          )}
          <form className="mp-auth-form" onSubmit={submit} aria-busy={busy}>
            {mode === "signup" && (
              <div className="mp-form-field">
                <label htmlFor="auryn-signup-name">
                  Full name{" "}
                  <span className="mp-field-optional">(optional)</span>
                </label>
                <input
                  id="auryn-signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className="mp-form-field">
              <label htmlFor="auryn-signin-email">Email address</label>
              <input
                type="email"
                name="email"
                id="auryn-signin-email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode !== "reset" && (
              <div className="mp-form-field">
                <div className="mp-field-label">
                  <label htmlFor="auryn-signin-password">Password</label>
                  {mode === "login" && (
                    <button
                      className="mp-inline-link"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setMode("reset");
                        setError("");
                        setNotice("");
                        setShowPassword(false);
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="mp-password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="auryn-signin-password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    minLength={8}
                    required
                    placeholder={
                      mode === "signup"
                        ? "Create a password"
                        : "Enter your password"
                    }
                    aria-describedby={
                      mode === "signup" ? "auryn-password-hint" : undefined
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={!!showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg
                      className="mp-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                      {showPassword && <path d="m3 3 18 18" />}
                    </svg>
                  </button>
                </div>
                {mode === "signup" && (
                  <small id="auryn-password-hint">At least 8 characters.</small>
                )}
              </div>
            )}
            {error && (
              <p role="alert" className="mp-form-message error">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="mp-form-message success">
                {notice}
              </p>
            )}
            {mode === "signup" && notice && (
              <button
                type="button"
                className="mp-button mp-button-secondary mp-resend-button"
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
            <button
              type="submit"
              className="mp-button mp-button-primary mp-form-submit"
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Send reset link"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className="mp-switch-auth">
            {mode === "reset"
              ? "Remember your password?"
              : mode === "signup"
                ? "Already have an account?"
                : "New to Auryn?"}
            <button
              type="button"
              className="mp-inline-link"
              disabled={busy}
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setNotice("");
                setShowPassword(false);
              }}
            >
              {mode === "login" ? "Create an account" : "Back to sign in"}
            </button>
          </p>
          <div className="mp-auth-disclaimer">
            <svg
              className="mp-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="5" y="10" width="14" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
            </svg>
            <span>
              By continuing, you agree to our <a href="/terms">Terms</a> and
              acknowledge our <a href="/privacy">Privacy Policy</a>.<br />
              <small>
                Research supports your judgment.{" "}
                <a href="/risk">Investing involves risk.</a>
              </small>
            </span>
          </div>
        </div>
        <div className="mp-auth-help">
          Need a hand?{" "}
          <a href="/help">
            Visit the help center <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  );
}
