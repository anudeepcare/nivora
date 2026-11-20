"use client";
import plaidDiscovery from "./PlaidDiscovery.module.css";
import EvidenceDetails from "./EvidenceDetails";
import ComparisonCharts from "./ComparisonCharts";
import ContributionCompare from "./ContributionCompare";
import decisionStyles from "./DecisionLists.module.css";
import compareStyles from "./CompareReference.module.css";
import { APP_VERSION } from "@/lib/releases";
import settingsStyles from "./SettingsPage.module.css";
import helpStyles from "./HelpPage.module.css";
import { SettingsSignalPolicies } from "./SettingsExperience";
import { sameProviderSymbol } from "@/lib/provider-symbol";
import { SUPPORT_EMAIL } from "@/lib/site-metadata";
import { ContextLink } from "./ContextLink";
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
    <section
      data-plaid-page="settings"
      className={`settings-page workspace-settings ${settingsStyles.page}`}
    >
      <div className="settings-page-toolbar">
        <Link
          href={backHref}
          scroll={false}
          className="settings-back"
          aria-label="Back to previous screen"
        >
          <ArrowLeft size={18} /> Back
        </Link>
      </div>
      <p className="settings-eyebrow">YOUR WORKSPACE</p>
      <PageHeading
        title="Settings"
        subtitle="Your research, display, and portfolio preferences."
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
          <strong title={email}>{email}</strong>
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
      <nav className="settings-section-links" aria-label="Settings sections">
        <a href="#settings-signals">Signals</a>
        <a href="#settings-appearance">Appearance</a>
        <a href="#settings-research">Research</a>
        <a href="#settings-policy">Guardrails</a>
        <a href="#settings-account">Account</a>
        <a href="#settings-notifications">Alerts</a>
      </nav>
      <div className="workspace-settings-groups">
        <SettingsSignalPolicies section="signals" />
        <section id="settings-appearance" className="workspace-setting-group">
          <header>
            <span>
              <small>APPEARANCE</small>
              <strong>Accent and reading comfort</strong>
            </span>
          </header>
          <div className="workspace-setting-body">
            <DisplayPreferences />
          </div>
        </section>
        <section id="settings-research" className="workspace-setting-group">
          <header>
            <span>
              <small>RESEARCH</small>
              <strong>Reading and workspace defaults</strong>
            </span>
          </header>
          <div className="workspace-setting-body">
            <ResearchPreferenceControls showConcentration={false} />
          </div>
        </section>
        <SettingsSignalPolicies section="policy" />
        <SettingsSignalPolicies section="notifications" />
        <section id="settings-account" className="workspace-setting-group">
          <header>
            <span>
              <small>ACCOUNT</small>
              <strong>Sign-in & security</strong>
            </span>
          </header>
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
            <details className="settings-password-change">
              <summary>Change password</summary>
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
            </details>
          </div>
        </section>
      </div>
      <nav
        className="workspace-settings-shortcuts"
        aria-label="Account and support"
      >
        <ContextLink page="help">
          <ShieldCheck size={18} />
          <span>Help & support</span>
          <ChevronRight size={17} />
        </ContextLink>
        <ContextLink page="changelog">
          <Bell size={18} />
          <span>What’s new · {APP_VERSION}</span>
          <ChevronRight size={17} />
        </ContextLink>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          title={`Opens your email app to ${SUPPORT_EMAIL}`}
        >
          <ShieldCheck size={18} />
          <span>
            Email support{" "}
            <small className="settings-email-hint">Opens your email app</small>
          </span>
          <ChevronRight size={17} />
        </a>
        <div className="settings-analytics-shortcut">
          <PrivacyChoices />
        </div>
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
    [loading, setLoading] = useState(false),
    [editing, setEditing] = useState(!initialSymbols),
    [referenceSymbol, setReferenceSymbol] = useState(
      initialSymbols.split(",")[0] ?? "",
    );
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
      setEditing(false);
      setReferenceSymbol(list[0]);
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
    <section
      className={`${decisionStyles.compare} ${compareStyles.page} ${plaidDiscovery.compare}`}
    >
      <header className={compareStyles.heading} data-plaid-tone="purple">
        <div>
          <span className={compareStyles.eyebrow}>CONTRIBUTION COMPARISON</span>
          <h1>
            {values.length === 3
              ? "Three companies."
              : values.length === 2
                ? "Two companies."
                : values.length === 4
                  ? "Four companies."
                  : "Your companies."}{" "}
            One next dollar.
          </h1>
          <p>
            Compare business evidence, expectations, Pace and portfolio capacity
            on the same scale.
          </p>
        </div>
        <button
          className="button primary"
          type="button"
          aria-expanded={editing}
          onClick={() => setEditing(!editing)}
        >
          + Change companies
        </button>
      </header>
      <div className={compareStyles.editor} hidden={!editing}>
        <div className="source-line">
          {saved.data?.documents.map((d) => (
            <button
              className="text-button"
              key={d.key}
              onClick={() => {
                setDraft(d.body.symbols.join(","));
                setSymbols(d.body.symbols.join(","));
                setReferenceSymbol(d.body.symbols[0] ?? "");
                setEditing(false);
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
        <details className={decisionStyles.lookup}>
          <summary>Find companies by name</summary>
          <div className="compare-picker">
            <Search
              onSelect={(symbol) =>
                setDraft((current) =>
                  [
                    ...new Set([
                      ...current.split(/[ ,]+/).filter(Boolean),
                      symbol,
                    ]),
                  ]
                    .slice(0, 4)
                    .join(", "),
                )
              }
            />
          </div>
        </details>
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
      </div>
      {error && <Notice error>{error}</Notice>}
      {success && <Notice>{success}</Notice>}
      {compatibility.length > 0 && (
        <p className="context-note">{compatibility.join(" ")}</p>
      )}
      {values.length > 0 && (
        <>
          <section
            className={`${decisionStyles.command} ${compareStyles.command}`}
            aria-label="Decision comparison"
            style={{
              gridTemplateColumns: `minmax(220px, 1.65fr) repeat(${values.length}, minmax(160px, 1fr))`,
            }}
          >
            <div className={decisionStyles.commandLabel}>
              <span>DECISION</span>
              <strong>Decision context</strong>
              <p>
                Each company retains its own context. No automatic winner or
                allocation is inferred.
              </p>
            </div>
            {values.map(({ r, edge }) => (
              <div
                key={r.company.symbol}
                data-reference={
                  r.company.symbol === referenceSymbol || undefined
                }
              >
                <Link
                  href={`${prefix}/research/${encodeURIComponent(r.company.symbol.replace("/", "-"))}`}
                >
                  <SecurityLogo symbol={r.company.symbol} />
                  {r.company.symbol}
                </Link>
                <strong>
                  {edge.pacePresentation.actionLabel || "Unavailable"}
                </strong>
                <b>{edge.pacePresentation.code || "Pace unavailable"}</b>
                <small>{edge.decision.contextLabel}</small>
              </div>
            ))}
          </section>
        </>
      )}

      {values.length ? (
        <div
          className={`table-scroll ${compareStyles.matrix}`}
          role="region"
          aria-label="Company comparison, scroll for more metrics and columns"
          tabIndex={0}
        >
          <table className="compare-table">
            <colgroup>
              <col
                style={{ width: `${(1.65 / (values.length + 1.65)) * 100}%` }}
              />
              {values.map(({ r }) => (
                <col
                  key={r.company.symbol}
                  style={{ width: `${100 / (values.length + 1.65)}%` }}
                />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th>MEASUREMENT</th>
                {values.map(({ r, p }) => (
                  <th
                    key={r.company.symbol}
                    data-reference={
                      r.company.symbol === referenceSymbol || undefined
                    }
                  >
                    <Link
                      href={`${prefix}/research/${encodeURIComponent(r.company.symbol.replace("/", "-"))}`}
                    >
                      <SecurityLogo symbol={r.company.symbol} />
                      {r.company.symbol}
                    </Link>
                    <button
                      className={compareStyles.referenceButton}
                      type="button"
                      aria-pressed={r.company.symbol === referenceSymbol}
                      onClick={() => setReferenceSymbol(r.company.symbol)}
                    >
                      Use as reference
                    </button>
                    <small className={decisionStyles.basisDate}>
                      {p.periodBasis} · {dateLabel(p.last?.end)}
                    </small>
                    <details className={decisionStyles.basis}>
                      <summary>Accounting basis</summary>
                      <dl>
                        <div>
                          <dt>Company</dt>
                          <dd>{r.company.name}</dd>
                        </div>
                        <div>
                          <dt>Reporting period</dt>
                          <dd>
                            {p.periodBasis} · {dateLabel(p.last?.end)}
                          </dd>
                        </div>
                        <div>
                          <dt>Reporting currency</dt>
                          <dd>{p.last?.currency || "Unavailable"}</dd>
                        </div>
                      </dl>
                    </details>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                "Revenue",
                "Revenue growth",
                "Net income",
                "Free cash flow",
                "Operating margin",
                "Free cash flow margin",
                "Price trend",
                "AURYN View",
                "AURYN Pace",
              ].map((label, i) => (
                <tr key={label}>
                  <th>{label}</th>
                  {values.map(({ r, p, edge }) => (
                    <td
                      key={r.company.symbol}
                      data-reference={
                        r.company.symbol === referenceSymbol || undefined
                      }
                    >
                      {
                        [
                          p.last?.revenue == null
                            ? "Unavailable"
                            : amount(p.last.revenue, p.last.currency, true),
                          p.growth == null ? "Unavailable" : percent(p.growth),
                          p.last?.netIncome == null
                            ? "Unavailable"
                            : amount(p.last.netIncome, p.last.currency, true),
                          p.last?.fcf == null
                            ? "Unavailable"
                            : amount(p.last.fcf, p.last.currency, true),
                          p.last?.margin == null
                            ? "Unavailable"
                            : percent(p.last.margin),
                          p.last?.fcfMargin == null
                            ? "Unavailable"
                            : percent(p.last.fcfMargin),
                          p.tech.trend || "Unavailable",
                          <div key="view">
                            <strong>{edge.decision.contextLabel}</strong>
                            <small className="block">
                              {edge.pacePresentation.actionLabel}
                            </small>
                            <EvidenceDetails
                              reason={edge.reason}
                              entry={edge.decision.actionLabels.entry}
                              holding={edge.decision.actionLabels.holding}
                            />
                          </div>,
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
            Highlighted column is a comparison reference, not a ranking.
            Different fiscal year ends and currencies can limit comparability.
            Missing observations remain unavailable. No combined ranking is
            inferred.
          </p>
        </div>
      ) : (
        <Empty title="Compare growth, margins and valuation">
          Choose two to four companies to compare their reported economics.
        </Empty>
      )}
      {values.length >= 2 && (
        <details className={compareStyles.contribution}>
          <summary>Test your next addition</summary>
          <p>
            Apply the same amount to each company independently. No suggested
            allocation is generated.
          </p>
          <ContributionCompare
            defaultOpen
            symbols={values.map(({ r }) => r.company.symbol)}
            prefix={prefix}
          />
        </details>
      )}
      {values.length > 0 && (
        <div className={compareStyles.tools}>
          <PaceHelp trigger="Understand AURYN Pace" />
          <details className={decisionStyles.details}>
            <summary>Price and financial charts</summary>
            <ComparisonCharts research={values.map(({ r }) => r)} />
          </details>
        </div>
      )}
    </section>
  );
}
export function HelpPage() {
  const topics = [
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
      "Monthly Pace uses price history to assess pullbacks and extensions. For eligible U.S. equities, calibrated readings also use daily trend, volatility and momentum, subject to the model’s release date and sufficient data. Older or ineligible readings can use an earlier policy. The forming month is provisional; completed months and weekly readings are shown separately. A multiplier is not leverage, a return forecast or a trade instruction.",
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
      "Holdings show recorded positions and unrealized gains or losses, with missing prices disclosed. Managed balances and margin debt are shown separately. After confirming a complete USD ledger, the account history view can compare account value and net contributions with SPY and QQQ using the same dated deposits and withdrawals. Only supported U.S.-listed instruments are covered. Benchmarks are hypothetical balances, not percentage returns.",
    ],
    [
      "AI research",
      "AI can summarize and challenge supplied evidence. A source citation is not a guarantee that the interpretation is correct. Reports require configured access and explicit generation; they do not place orders.",
    ],
    [
      "Sources and access",
      "Company statements use available financial data and SEC company facts. Period, currency and source details stay attached to the evidence. Availability varies by listing and reporting history. Commercial display rights must be confirmed with market-data providers before selling access.",
    ],
  ];
  return (
    <article className={`help-article ${helpStyles.page}`}>
      <PageHeading
        title="Methodology & data"
        subtitle="Understand the numbers. Know their limits."
      />
      <div className={helpStyles.layout}>
        <nav className={helpStyles.topics} aria-label="Methodology topics">
          {topics.map(([title], index) => (
            <a key={title} href={`#methodology-${index}`}>
              {title}
            </a>
          ))}
        </nav>
        <div className={helpStyles.reader}>
          {topics.map(([title, text], index) => (
            <section key={title} id={`methodology-${index}`}>
              <span className={helpStyles.number} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
          <PwaDiagnostics />
        </div>
      </div>
    </article>
  );
}
