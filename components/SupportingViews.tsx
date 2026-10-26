"use client";
import DisplayPreferences from "./DisplayPreferences";
import ResearchPreferenceControls from "./ResearchPreferences";
import PwaDiagnostics from "./PwaDiagnostics";
import { useAccess } from "./Access";
import { settingsReturnHref } from "@/lib/settings-navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  FlaskConical,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useProduct, useResource } from "./Session";
import { PageHeading, Notice, Empty, SecurityLogo, Help } from "./Ui";
import { ResearchHome } from "./Workspace";
import { api, authClient, signOutAndRedirect } from "@/lib/client";
import { amount, percent, dateLabel, symbolInput } from "@/lib/format";
import { perspective } from "@/lib/analysis";
import type { Research } from "@/lib/types";
export function Settings() {
  const { workspace, demo } = useProduct();
  const { access } = useAccess();
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const [backHref, setBackHref] = useState(`${prefix}/overview`);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [section, setSection] = useState<"appearance" | "research" | "account">(
    "appearance",
  );
  const [account, setAccount] = useState<{
    email: string;
    providers: string[];
  } | null>(null);
  useEffect(() => {
    setBackHref(
      settingsReturnHref(
        new URLSearchParams(window.location.search).get("from"),
        prefix,
      ),
    );
  }, [prefix]);
  useEffect(() => {
    if (demo && demo.routePrefix !== "") return;
    let active = true;
    authClient()
      .auth.getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setMessage("Account details could not be loaded. Please try again.");
          return;
        }
        if (data.user)
          setAccount({
            email: data.user.email || "",
            providers: [
              ...new Set((data.user.identities || []).map((x) => x.provider)),
            ],
          });
      })
      .catch(() => {
        if (active)
          setMessage("Account details could not be loaded. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [demo]);
  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (demo && demo.routePrefix !== "") {
      setMessage("Account changes are disabled in the preview.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await authClient().auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setMessage("Password updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Password update failed.");
    } finally {
      setBusy(false);
    }
  }
  const email =
    account?.email ||
    workspace?.email ||
    (demo ? "Design preview" : "Loading account…");
  return (
    <section className="settings-page account-studio">
      <div className="settings-page-toolbar">
        <Link
          href={backHref}
          scroll={false}
          className="settings-back"
          aria-label="Back to previous screen"
        >
          <ArrowLeft size={18} /> Back
        </Link>
        <button
          type="button"
          className="settings-signout"
          disabled={(!!demo && demo.routePrefix !== "") || busy || signingOut}
          onClick={async () => {
            if (demo && demo.routePrefix !== "") return;
            setSigningOut(true);
            setMessage("");
            try {
              await signOutAndRedirect();
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Could not sign out. Please try again.",
              );
              setSigningOut(false);
            }
          }}
        >
          <LogOut size={17} /> {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
      <PageHeading
        title="Settings"
        subtitle="Your account, your preferences, your AURYN."
      />
      {message && (
        <div className="settings-feedback" role="status">
          <Notice>{message}</Notice>
        </div>
      )}
      <div className="settings-studio-layout">
        <aside className="settings-studio-nav">
          <div className="settings-account-summary">
            <span className="settings-profile-avatar" aria-hidden="true">
              {email[0]?.toUpperCase() || "A"}
            </span>
            <div>
              <strong>Your account</strong>
              <p>{email}</p>
            </div>
          </div>
          <nav aria-label="Settings categories">
            {(
              [
                ["appearance", "Display & reading"],
                ["research", "Research preferences"],
                ["account", "Account & security"],
              ] as const
            ).map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={section === id}
                aria-controls={`settings-page-${id}`}
                onClick={() => setSection(id)}
              >
                {label}
                <ChevronRight size={16} />
              </button>
            ))}
          </nav>
          <nav className="settings-shortcuts" aria-label="Account and support">
            <Link href={`${prefix}/plans`}>
              <span>
                Plans & billing
                <small>
                  {access.owner
                    ? "Owner access"
                    : access.plan === "pro"
                      ? "Pro membership"
                      : "Free membership"}
                </small>
              </span>
              <ChevronRight size={16} />
            </Link>
            {access.owner && !prefix && (
              <Link href="/owner">
                Admin controls
                <ChevronRight size={16} />
              </Link>
            )}
            <Link href={`${prefix}/alerts`}>
              Alerts
              <ChevronRight size={16} />
            </Link>
            <Link href="/help">
              Help & support
              <ChevronRight size={16} />
            </Link>
          </nav>
          <div className="settings-studio-note">
            <ShieldCheck size={19} />
            <p>
              Your account stays yours. Appearance preferences are saved on this
              device.
            </p>
          </div>
        </aside>
        <div className="settings-studio-content">
          <section
            id="settings-page-appearance"
            className="panel settings-appearance"
            hidden={section !== "appearance"}
          >
            <DisplayPreferences />
          </section>
          <section
            id="settings-page-research"
            className="panel settings-research-panel"
            hidden={section !== "research"}
          >
            <span className="eyebrow">Your perspective</span>
            <h2>Research your way.</h2>
            <p>
              Choose the context and level of detail that help you read the
              evidence.
            </p>
            <ResearchPreferenceControls />
          </section>
          <section
            id="settings-page-account"
            className="panel settings-account"
            aria-labelledby="account-title"
            hidden={section !== "account"}
          >
            <header className="settings-profile">
              <span className="settings-profile-avatar" aria-hidden="true">
                {email[0]?.toUpperCase() || "A"}
              </span>
              <div>
                <span className="eyebrow">Your account</span>
                <h2 id="account-title">Account & security</h2>
                <p>{email}</p>
              </div>
            </header>
            {!!account?.providers.length && (
              <div
                className="account-identities"
                aria-label="Connected sign-in methods"
              >
                {account.providers.map((provider) => (
                  <span key={provider}>
                    {provider === "google"
                      ? "Google"
                      : provider === "x" || provider === "twitter"
                        ? "X"
                        : provider === "email"
                          ? "Email"
                          : provider}
                  </span>
                ))}
              </div>
            )}
            <div className="settings-security">
              <h3>Password</h3>
              <p>Choose a strong password you don’t use elsewhere.</p>
              <details className="settings-password">
                <summary>Set or change password</summary>
                <form className="password-form" onSubmit={update}>
                  <label>
                    New password
                    <input
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                  <button
                    className="button primary"
                    disabled={busy || (!!demo && demo.routePrefix !== "")}
                  >
                    {busy ? "Saving…" : "Update password"}
                  </button>
                </form>
              </details>
            </div>
          </section>
          <nav className="settings-page-links" aria-label="Help and legal">
            <Link href="/help">
              Help & support <ArrowUpRight size={14} />
            </Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/risk">Investment risks</Link>
          </nav>
        </div>
      </div>
    </section>
  );
}

export function Compare({ initialSymbols = "" }: { initialSymbols?: string }) {
  const { demo } = useProduct(),
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "",
    [draft, setDraft] = useState(initialSymbols),
    [symbols, setSymbols] = useState(initialSymbols),
    [rows, setRows] = useState<Research[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!symbols) {
      setRows([]);
      return;
    }
    let active = true;
    const abort = new AbortController();
    setRows([]);
    setLoading(true);
    setError("");
    Promise.all(
      symbols
        .split(",")
        .map((s) =>
          demo
            ? Promise.resolve(demo.research[s])
            : api<Research>(
                `research/${encodeURIComponent(s.replace("/", "-"))}`,
                undefined,
                abort.signal,
              ),
        ),
    )
      .then((values) => {
        if (active) setRows(values.filter(Boolean));
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      abort.abort();
    };
  }, [symbols, demo]);
  const savedPreview = useMemo(
      () => (demo ? { documents: [] } : undefined),
      [demo],
    ),
    saved = useResource<{
      documents: { key: string; body: { name: string; symbols: string[] } }[];
    }>("documents?kind=comparison", savedPreview);
  async function saveComparison() {
    try {
      if (demo) throw Error("Sign in to save a comparison.");
      await api("documents", {
        kind: "comparison",
        key:
          "comparison-" +
          rows
            .map((r) => r.company.symbol)
            .join("-")
            .slice(0, 60),
        body: {
          name: rows.map((r) => r.company.symbol).join(" / "),
          symbols: rows.map((r) => r.company.symbol),
        },
      });
      saved.refresh();
      setError("Comparison saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const list = [
        ...new Set(draft.split(/[ ,]+/).filter(Boolean).map(symbolInput)),
      ];
      if (list.length < 2 || list.length > 4)
        throw Error("Choose two to four companies.");
      setSymbols(list.join(","));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the symbols");
    }
  }
  const values = rows.map((r) => ({ r, p: perspective(r) }));
  return (
    <section>
      <PageHeading
        title="Compare the businesses."
        subtitle="Put the financial picture side by side. Periods and currencies remain visible."
      />
      <div className="source-line">
        {saved.data?.documents.map((d) => (
          <button
            className="text-button"
            key={d.key}
            onClick={() => {
              setDraft(d.body.symbols.join(","));
              setSymbols(d.body.symbols.join(","));
            }}
          >
            {d.body.name}
          </button>
        ))}
        {rows.length >= 2 && (
          <button className="text-button" onClick={saveComparison}>
            Save comparison
          </button>
        )}
      </div>
      <form className="compare-search" onSubmit={submit}>
        <input
          aria-label="Companies to compare"
          placeholder="MSFT, AAPL — up to four tickers"
          value={draft}
          onChange={(e) => setDraft(e.target.value.toUpperCase())}
        />
        <button className="button primary" disabled={loading}>
          {loading ? "Loading evidence…" : "Compare companies"}
        </button>
      </form>
      {error && <Notice error>{error}</Notice>}
      {values.length ? (
        <div className="table-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Reported metric</th>
                {values.map(({ r }) => (
                  <th key={r.company.symbol}>
                    <Link
                      href={`${prefix}/research/${encodeURIComponent(r.company.symbol.replace("/", "-"))}`}
                    >
                      <SecurityLogo symbol={r.company.symbol} />
                      {r.company.symbol}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                "Company",
                "Reporting period",
                "Reporting currency",
                "Revenue",
                "Revenue growth",
                "Net income",
                "Free cash flow",
                "Operating margin",
                "Price trend",
              ].map((label, i) => (
                <tr key={label}>
                  <th>{label}</th>
                  {values.map(({ r, p }) => (
                    <td key={r.company.symbol}>
                      {
                        [
                          r.company.name,
                          `${p.periodBasis} · ${dateLabel(p.last?.end)}`,
                          p.last?.currency || "—",
                          amount(p.last?.revenue, p.last?.currency, true),
                          percent(p.growth),
                          amount(p.last?.netIncome, p.last?.currency, true),
                          amount(p.last?.fcf, p.last?.currency, true),
                          percent(p.last?.margin),
                          p.tech.trend,
                        ][i]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="footnote">
            Different fiscal year ends and currencies can limit comparability.
            Missing observations remain unavailable. No combined ranking is
            inferred.
          </p>
        </div>
      ) : (
        <Empty title="Make the trade-offs visible">
          Choose two to four companies to compare their reported economics.
        </Empty>
      )}
    </section>
  );
}
export function HelpPage() {
  return (
    <article className="help-article">
      <PageHeading
        title="Know what you’re looking at."
        subtitle="Plain-language methodology and data boundaries."
      />
      {[
        [
          "Business economics",
          "AURYN separates reported financial results from a long-term investment thesis. Positive revenue or cash flow alone does not prove a moat. Company disclosures, competition and financing need their own evidence.",
        ],
        [
          "Valuation scenarios",
          "Cash-flow scenarios show how growth, dilution and required return affect estimated value. They are assumption-driven sensitivity analyses. Specialized businesses, ADRs and incomplete share records require further reconciliation.",
        ],
        [
          "Monthly accumulation",
          "The monthly-v5 price policy measures pullbacks from the previous 12 completed monthly closes, with spread gates and at least 12 prior completed months; 12–23 months are explicitly limited history. Deeper cycle-relative pullbacks can produce 2×, 3× or 4× conditions; large positive extensions can produce a pause and light/strong trim review. Weekly v1 remains a separate policy. A multiplier is not leverage, a profit prediction or an instruction to trade. The forming month is separate.",
        ],
        [
          "Price history and technicals",
          "Quotes and chart bars have separate observation timestamps. Filing links and calculation details remain available where supported. Chart ranges do not change the business assessment. Fibonacci prices are references based on displayed anchors, not confirmed support.",
        ],
        [
          "Live and extended-session prices",
          "Research streams available trades and checks quotes every minute when streaming is unavailable. Portfolio defaults to five-minute checks; Live adds streaming with a two-minute fallback, while Hourly and Manual reduce requests. Updates pause in hidden pages. Premarket and after-hours observations appear when available; closed markets retain the latest observation. Crypto can update continuously. A refresh checks for new data; it does not create a new trade or change an observation timestamp. Delays, coverage and connection limits can apply.",
        ],
        [
          "Portfolio accounting",
          "The current view tracks recorded positions and unrealized profit or loss. It does not calculate a transaction-aware performance series. Older usable USD prices remain included and visibly labelled; never-priced investments are excluded, with incomplete coverage disclosed. Managed balances and margin debt are shown separately.",
        ],
        [
          "AI research",
          "AI can summarize and challenge supplied evidence. A source citation is not a guarantee that the interpretation is correct. Reports require configured access and explicit generation; they do not place orders.",
        ],
        [
          "Sources and access",
          "Company statements use available financial data and SEC company facts. Period, currency and source details stay attached to the evidence. Availability varies by listing and reporting history. Commercial display rights must be confirmed with market-data providers before selling access.",
        ],
      ].map(([title, text]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </section>
      ))}
      <PwaDiagnostics />
    </article>
  );
}
