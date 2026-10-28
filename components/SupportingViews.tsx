"use client";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { SUPPORT_EMAIL } from "@/lib/site-metadata";
import { PrivacyChoices } from "./AnalyticsConsent";
import PaceGuidance from "./PaceGuidance";
import Search from "./Search";
import PaceHelp from "./PaceHelp";
import { loadComparison, comparisonCompatibility } from "@/lib/comparison";
import { researchEdge } from "@/lib/edge-research";

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
    <section className="settings-page workspace-settings">
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
        subtitle="A comfortable workspace. An account that stays yours."
      />
      {message && (
        <div className="settings-feedback" role="status">
          <Notice>{message}</Notice>
        </div>
      )}
      <div className="workspace-account-row">
        <span className="settings-profile-avatar" aria-hidden="true">
          {email[0]?.toUpperCase() || "A"}
        </span>
        <div>
          <strong>{email}</strong>
          <p>
            {access.owner
              ? "Owner access"
              : access.plan === "pro"
                ? "Pro membership"
                : "Free membership"}
          </p>
        </div>
        <Link className="text-link" href={`${prefix}/plans`}>
          Manage plan <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="workspace-settings-groups">
        <details className="workspace-setting-group">
          <summary>
            <span>
              <strong>Display & reading</strong>
              <small>Theme, text and accessibility</small>
            </span>
            <ChevronRight size={19} />
          </summary>
          <div className="workspace-setting-body">
            <DisplayPreferences />
          </div>
        </details>
        <details className="workspace-setting-group">
          <summary>
            <span>
              <strong>Research preferences</strong>
              <small>Your style and investment horizon</small>
            </span>
            <ChevronRight size={19} />
          </summary>
          <div className="workspace-setting-body">
            <ResearchPreferenceControls />
          </div>
        </details>
        <details className="workspace-setting-group">
          <summary>
            <span>
              <strong>Account & security</strong>
              <small>Sign-in methods and password</small>
            </span>
            <ChevronRight size={19} />
          </summary>
          <div className="workspace-setting-body">
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
              <p>
                Use at least 8 characters and a password you don’t use
                elsewhere.
              </p>
              <button
                className="button primary"
                disabled={busy || (!!demo && demo.routePrefix !== "")}
              >
                {busy ? "Saving…" : "Update password"}
              </button>
            </form>
          </div>
        </details>
      </div>
      <nav
        className="workspace-settings-shortcuts"
        aria-label="Account and support"
      >
        <Link href={`${prefix}/alerts`}>
          <Bell size={18} />
          <span>Price alerts</span>
          <ChevronRight size={17} />
        </Link>
        <Link href="/help">
          <ShieldCheck size={18} />
          <span>Help & support</span>
          <ChevronRight size={17} />
        </Link>
        <a href={`mailto:${SUPPORT_EMAIL}`}>
          <ShieldCheck size={18} />
          <span>{SUPPORT_EMAIL}</span>
          <ChevronRight size={17} />
        </a>
        <PrivacyChoices />
        {access.owner && (
          <Link href={`${prefix}/owner`}>
            <ShieldCheck size={18} />
            <span>Admin controls</span>
            <ChevronRight size={17} />
          </Link>
        )}
      </nav>
    </section>
  );
}

export function Compare({ initialSymbols = "" }: { initialSymbols?: string }) {
  const { demo, workspace } = useProduct(),
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "",
    [draft, setDraft] = useState(initialSymbols),
    [symbols, setSymbols] = useState(initialSymbols),
    [rows, setRows] = useState<Research[]>([]),
    [success, setSuccess] = useState(""),
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
    loadComparison(symbols.split(","), (s) =>
      demo
        ? Promise.resolve(demo.research[s])
        : api<Research>(
            `research/${encodeURIComponent(s.replace("/", "-"))}`,
            undefined,
            abort.signal,
          ),
    )
      .then(({ rows, issues }) => {
        if (active) {
          setRows(rows);
          setError(issues.join(" "));
        }
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
      setSuccess("Comparison saved.");
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
      setSuccess("");
      setSymbols(list.join(","));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the symbols");
    }
  }
  const values = rows.map((r) => ({
    r,
    p: perspective(r),
    edge: researchEdge(
      r,
      !!workspace?.positions.some(
        (p) => sameProviderSymbol(p.symbol, r.company.symbol) && p.quantity > 0,
      ),
      demo ? Date.parse(r.retrievedAt) : Date.now(),
    ),
  }));
  const compatibility = comparisonCompatibility(
    values.map(({ p }) => ({
      currency: p.last?.currency,
      end: p.last?.end,
      basis: p.periodBasis,
    })),
  );
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
      <div className="compare-picker">
        <Search
          onSelect={(symbol) =>
            setDraft((current) =>
              [...new Set([...current.split(/[ ,]+/).filter(Boolean), symbol])]
                .slice(0, 4)
                .join(", "),
            )
          }
        />
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
      {success && <Notice>{success}</Notice>}
      {compatibility.length > 0 && (
        <p className="context-note">{compatibility.join(" ")}</p>
      )}
      <PaceHelp trigger="Understand AURYN Pace" />
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
                "AURYN View",
                "AURYN Pace",
              ].map((label, i) => (
                <tr key={label}>
                  <th>{label}</th>
                  {values.map(({ r, p, edge }) => (
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
                          `${edge.decision.contextLabel}: ${edge.pacePresentation.actionLabel} · ${edge.reason} New purchase: ${edge.decision.actionLabels.entry}. Holding: ${edge.decision.actionLabels.holding}.`,
                          <div key="pace">
                            <PaceGuidance
                              view={edge.pacePresentation}
                              readings={edge.pacePeriods}
                              compact
                            />
                          </div>,
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
