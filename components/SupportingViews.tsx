"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  FlaskConical,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useProduct, useResource } from "./Session";
import { PageHeading, Notice, Empty, SecurityLogo } from "./Ui";
import { ResearchHome } from "./Workspace";
import { api, authClient } from "@/lib/client";
import { amount, percent, dateLabel, symbolInput } from "@/lib/format";
import { perspective } from "@/lib/analysis";
import type { Research } from "@/lib/types";
export function Settings() {
  const {
      themePreference,
      setTheme,
      textSize,
      setTextSize,
      reduceMotion,
      setReduceMotion,
      workspace,
      demo,
    } = useProduct(),
    prefix = demo ? "/preview" : "",
    [message, setMessage] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (demo) {
      setMessage("Account changes are disabled in this preview.");
      return;
    }
    setBusy(true);
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
  return (
    <section>
      <PageHeading
        title="Make AURYN yours."
        subtitle="Appearance and account settings, without the clutter."
      />
      <section className="panel preferences">
        <div className="setting-row">
          <div>
            <strong>Appearance</strong>
            <p>Choose your theme or follow your device.</p>
          </div>
          <div className="segmented" aria-label="Appearance">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                aria-pressed={themePreference === t}
                onClick={() => setTheme(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <strong>Text size</strong>
            <p>Comfortable, readable type across your workspace.</p>
          </div>
          <div className="segmented" aria-label="Text size">
            {(["standard", "large"] as const).map((t) => (
              <button
                key={t}
                aria-pressed={textSize === t}
                onClick={() => setTextSize(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div>
            <strong>Reduce motion</strong>
            <p>Your device’s accessibility preference is always respected.</p>
          </div>
          <button
            className="button"
            aria-pressed={reduceMotion}
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            {reduceMotion ? "On" : "Use device setting"}
          </button>
        </div>
      </section>
      <section className="panel support">
        <h2>Your tools</h2>
        <div className="settings-links">
          {[
            ["compare", "Compare companies"],
            ["discover", "Discover"],
            ["alerts", "Price alerts"],
            ["research-lab", "Research validation"],
            ["trading", "Paper trading"],
            ["help", "Sources & methodology"],
          ].map(([path, label]) => (
            <Link key={path} href={`${prefix}/${path}`}>
              {label}
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
      <section className="panel support">
        <div className="setting-row">
          <div>
            <strong>Your account</strong>
            <p>
              {workspace?.email ||
                (demo ? "Design preview" : "Loading account…")}
            </p>
          </div>
          <button
            className="button"
            disabled={!!demo}
            onClick={async () => {
              try {
                const { error } = await authClient().auth.signOut();
                if (error) throw error;
              } catch {
                setMessage("Sign out failed. Please try again.");
              }
            }}
          >
            Sign out
          </button>
        </div>
      </section>
      <section className="panel support">
        <h2>Update password</h2>
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
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
        {message && <Notice>{message}</Notice>}
      </section>
    </section>
  );
}
export function Compare({ initialSymbols = "" }: { initialSymbols?: string }) {
  const { demo } = useProduct(),
    prefix = demo ? "/preview" : "",
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
    setLoading(true);
    setError("");
    Promise.all(
      symbols
        .split(",")
        .map((s) =>
          demo
            ? Promise.resolve(demo.research[s])
            : api<Research>(
                `research/${encodeURIComponent(s)}`,
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
                      href={`${prefix}/research/${encodeURIComponent(r.company.symbol)}`}
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
                "Annual period",
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
                          dateLabel(p.last?.end),
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
          "The monthly-v1 price policy uses 24 consecutive monthly closing observations. Increasing discounts to the closing high and average can produce 2×, 3× or 4× zones; stretched prices can produce a pause. A multiplier is not leverage, a profit prediction or an instruction to trade. The forming month is separate.",
        ],
        [
          "Price history and technicals",
          "The source is Twelve Data. Quotes and chart bars have different timestamps. Chart ranges do not change the business assessment. Fibonacci prices are references based on displayed anchors, not confirmed support.",
        ],
        [
          "Portfolio accounting",
          "The current view tracks recorded positions and unrealized profit or loss. It does not calculate a transaction-aware performance series. Missing or stale prices are excluded from known value, and total profit is withheld when coverage is incomplete.",
        ],
        [
          "AI research",
          "AI can summarize and challenge supplied evidence. A source citation is not a guarantee that the interpretation is correct. Reports require configured access and explicit generation; they do not place orders.",
        ],
        [
          "Sources and access",
          "Company statements come from SEC company facts where supported. Data availability varies by listing, taxonomy and reporting history. Commercial display rights must be confirmed with market-data providers before selling access.",
        ],
      ].map(([title, text]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </section>
      ))}
    </article>
  );
}
