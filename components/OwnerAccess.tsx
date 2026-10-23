"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useAccess } from "./Access";
import {
  featureNames,
  defaultAccessConfig,
  type AccessConfig,
  type Feature,
  type Rule,
} from "@/lib/access-policy";
import { dateLabel } from "@/lib/format";
type Grant = {
  user_id: string;
  email: string;
  expires_at: string;
  revoked_at: string | null;
  cohort: string;
};
type Data = {
  config: AccessConfig;
  grants: Grant[];
  audit: { action: string; created_at: string; target: string | null }[];
  usage: number;
  enabled: boolean;
};
export default function OwnerAccess() {
  const { access, refresh } = useAccess();
  const [data, setData] = useState<Data | null>(null),
    [config, setConfig] = useState(defaultAccessConfig),
    [email, setEmail] = useState(""),
    [expiry, setExpiry] = useState(""),
    [cohort, setCohort] = useState("friends"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [panel, setPanel] = useState("people");
  const load = async () => {
    const d = await api<Data>("owner/access");
    setData(d);
    setConfig(d.config);
  };
  useEffect(() => {
    if (access.owner) void load().catch((e) => setMessage(e.message));
  }, [access.owner]);
  async function checkBilling() {
    setBusy(true);
    setMessage("");
    try {
      const r = await api<{ message: string }>("billing", { action: "check" });
      setMessage(r.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Billing check failed.");
    } finally {
      setBusy(false);
    }
  }
  async function save(body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      await api("owner/access", body);
      await load();
      setMessage("Access updated. Payment subscriptions were not changed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }
  if (!access.owner)
    return (
      <section className="membership-state">
        <h1>Owner controls</h1>
        <p>This area is available only to the configured workspace owner.</p>
      </section>
    );
  return (
    <section className="owner-access">
      <header className="owner-heading">
        <span className="eyebrow">Your workspace</span>
        <h1>Admin controls</h1>
        <p>People, product access and payments. Just for you.</p>
      </header>
      <nav className="admin-section-nav" aria-label="Admin sections">
        {[
          ["people", "People"],
          ["features", "Features"],
          ["payments", "Payments"],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={panel === id}
            aria-controls={`admin-${id}`}
            onClick={() => setPanel(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <section className="admin-preview-row" aria-label="Plan preview">
        <div>
          <strong>Preview access</strong>
          <p>Test permissions without changing your subscription.</p>
        </div>
        <label>
          View as
          <select
            value={access.preview ?? "owner"}
            onChange={(e) => {
              try {
                if (e.target.value === "owner")
                  sessionStorage.removeItem("auryn-owner-preview");
                else
                  sessionStorage.setItem("auryn-owner-preview", e.target.value);
                refresh();
              } catch {
                setMessage("Preview could not be changed.");
              }
            }}
          >
            <option value="owner">Owner · Full access</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
        </label>
      </section>
      {message && (
        <p className="membership-feedback" role="status">
          {message}
        </p>
      )}
      {!data ? (
        <button
          className="button"
          onClick={() => void load().catch((e) => setMessage(e.message))}
        >
          Load controls
        </button>
      ) : (
        <>
          <section
            id="admin-features"
            hidden={panel !== "features"}
            className="membership-panel"
          >
            <header>
              <div>
                <h2>Feature access</h2>
                <p>
                  {data.enabled
                    ? "Free/Pro controls are enabled."
                    : "Controls are configured but not activated. Set AURYN_ACCESS_ENABLED=true after applying the migration."}
                </p>
              </div>

            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save({ action: "settings", config });
              }}
            >
              <div className="owner-field-grid">
                <div className="admin-plan-defaults">
                  <strong>Free: 100 companies / month</strong>
                  <p>
                    Pro: unlimited company research. Every new account starts on
                    Free; invitations only grant complimentary Pro.
                  </p>
                </div>
                {(["freeWatchlist", "proWatchlist", "proAi"] as const).map(
                  (k) => (
                    <label key={k}>
                      {
                        {
                          freeResearch: "Free research / month",
                          proResearch: "Pro research / month",
                          freeWatchlist: "Free watchlist",
                          proWatchlist: "Pro watchlist",
                          proAi: "Pro AI / month",
                        }[k]
                      }
                      <input
                        type="number"
                        min={0}
                        max={1000}
                        required
                        value={config[k]}
                        onChange={(e) =>
                          setConfig({ ...config, [k]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ),
                )}
              </div>
              <h3>Who can use each feature</h3>
              <div className="owner-feature-grid">
                {Object.entries(featureNames).map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <select
                      value={config.rules[key as Feature] ?? "pro"}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          rules: {
                            ...config.rules,
                            [key]: e.target.value as Rule,
                          },
                        })
                      }
                    >
                      <option value="free">Everyone</option>
                      <option value="pro">Pro</option>
                      <option value="beta">Complimentary members</option>
                      <option value="off">Off</option>
                    </select>
                  </label>
                ))}
              </div>
              <button className="button primary" disabled={busy}>
                {busy ? "Saving…" : "Save access rules"}
              </button>
            </form>
          </section>
          <section
            id="admin-people"
            hidden={panel !== "people"}
            className="membership-panel"
          >
            <h2>Give Pro access</h2>
            <p>
              Use their existing account email. No card needed. They can
              subscribe anytime without losing access.
            </p>
            <div
              className="admin-duration-row"
              aria-label="Quick access duration"
            >
              <span>Quick duration</span>
              {[7, 30, 90].map((days) => (
                <button
                  type="button"
                  className="button"
                  key={days}
                  disabled={busy}
                  onClick={() => {
                    const d = new Date(Date.now() + days * 86400000);
                    setExpiry(
                      new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16),
                    );
                  }}
                >
                  {days} days
                </button>
              ))}
            </div>
            <form
              className="owner-grant-form"
              onSubmit={(e) => {
                e.preventDefault();
                void save({
                  action: "grant",
                  email,
                  expiresAt: expiry,
                  cohort,
                });
              }}
            >
              <label>
                Account email
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Access ends · your local time
                <input
                  type="datetime-local"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </label>
              <label>
                Group
                <input
                  maxLength={40}
                  required
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                />
              </label>
              <button className="button primary" disabled={busy}>
                Grant complimentary Pro
              </button>
            </form>
            <div className="owner-grants">
              {data.grants.length ? (
                data.grants.map((g) => (
                  <article key={g.user_id}>
                    <div>
                      <strong>{g.email}</strong>
                      <small>
                        {g.cohort} ·{" "}
                        {g.revoked_at
                          ? "Revoked"
                          : Date.parse(g.expires_at) < Date.now()
                            ? "Expired"
                            : `Until ${dateLabel(g.expires_at)}`}
                      </small>
                    </div>
                    <button
                      className="button"
                      disabled={busy || !!g.revoked_at}
                      onClick={() =>
                        void save({ action: "revoke", userId: g.user_id })
                      }
                    >
                      Revoke
                    </button>
                  </article>
                ))
              ) : (
                <p>No complimentary grants yet.</p>
              )}
            </div>
            <details>
              <summary>End group access</summary>
              <p>
                Only complimentary grants are revoked. Paid subscriptions are
                untouched.
              </p>
              <label>
                Group name
                <input
                  value={cohort}
                  onChange={(e) => setCohort(e.target.value)}
                  maxLength={40}
                />
              </label>
              <button
                className="button"
                disabled={busy || !cohort.trim()}
                onClick={() => {
                  if (
                    window.confirm(
                      `Revoke complimentary access for group “${cohort}”?`,
                    )
                  )
                    void save({ action: "revoke-cohort", cohort });
                }}
              >
                Revoke this group
              </button>
            </details>
          </section>
          <section
            id="admin-payments"
            hidden={panel !== "payments"}
            className="membership-panel"
          >
            <span className="eyebrow">Stripe billing</span>
            <h2>Payments, clearly.</h2>
            <p>
              Check the connected environment and monthly price without creating
              a charge. Customers manage payment methods, invoices and
              cancellation through Stripe.
            </p>
            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={() => void checkBilling()}
            >
              {busy ? "Checking…" : "Check Stripe connection"}
            </button>
            <a
              className="button"
              href="https://dashboard.stripe.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Stripe ↗
            </a>
            <div className="admin-plan-defaults">
              <strong>Free · 100 companies/month</strong>
              <p>Pro · $2.99/month · Unlimited company research</p>
            </div>
          </section>
          <details className="membership-panel admin-activity">
            <summary>Recent activity</summary>
            <p>
              {data.usage} recorded research/AI usage entries this UTC month.
            </p>
            {data.audit.map((a, i) => (
              <div className="owner-audit-row" key={i}>
                <span>{a.action}</span>
                <time>{dateLabel(a.created_at)}</time>
              </div>
            ))}
          </details>
        </>
      )}
    </section>
  );
}
