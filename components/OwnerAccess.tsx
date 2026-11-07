"use client";
import { useEffect, useState, useRef } from "react";
import {
  Users,
  SlidersHorizontal,
  CreditCard,
  Mail,
  BookOpen,
  Plus,
  X,
} from "lucide-react";
import styles from "./OwnerAccess.module.css";
import SupportInbox from "./SupportInbox";
import OwnerHandbook from "./OwnerHandbook";
import OwnerEvidenceTools from "./OwnerEvidenceTools";
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
  const grantDialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<Data | null>(null),
    [config, setConfig] = useState(defaultAccessConfig),
    [email, setEmail] = useState(""),
    [expiry, setExpiry] = useState(""),
    [cohort, setCohort] = useState("friends"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [panel, setPanel] = useState("people"),
    [duration, setDuration] = useState<number | null>(null),
    [memberSearch, setMemberSearch] = useState(""),
    [memberFilter, setMemberFilter] = useState("active");
  const load = async () => {
    const d = await api<Data>("owner/access");
    setData(d);
    setConfig(d.config);
    return d;
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
      const result = await api<{ saved: boolean; grant?: Grant }>(
        "owner/access",
        body,
      );
      await load();
      await refresh();
      if (result.grant) grantDialog.current?.close();
      setMessage(
        result.grant
          ? `Pro access saved for ${result.grant.email} until ${new Date(result.grant.expires_at).toLocaleString()}.`
          : "Access updated. Payment subscriptions were not changed.",
      );
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
    <section className={styles.root}>
      <header className={styles.heading}>
        <div>
          <h1>Admin controls</h1>
          {data && (
            <p>
              {
                data.grants.filter(
                  (g) => !g.revoked_at && Date.parse(g.expires_at) > Date.now(),
                ).length
              }{" "}
              active members ·{" "}
              {
                data.grants.filter(
                  (g) =>
                    !g.revoked_at &&
                    Date.parse(g.expires_at) > Date.now() &&
                    Date.parse(g.expires_at) <= Date.now() + 7 * 86400000,
                ).length
              }{" "}
              expiring this week
            </p>
          )}
        </div>
        <label className={styles.preview}>
          Preview access
          <select
            aria-label="Preview access"
            value={access.preview ?? "owner"}
            onChange={(e) => {
              try {
                if (e.target.value === "owner")
                  sessionStorage.removeItem("auryn-owner-preview");
                else
                  sessionStorage.setItem("auryn-owner-preview", e.target.value);
                void refresh();
              } catch {
                setMessage("Preview could not be changed.");
              }
            }}
          >
            <option value="owner">Owner</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
          </select>
        </label>
      </header>
      <nav className="admin-section-nav" aria-label="Admin sections">
        {[
          ["people", "People"],
          ["features", "Features"],
          ["payments", "Payments"],
          ["support", "Support"],
          ["handbook", "Owner handbook"],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            aria-pressed={panel === id}
            aria-controls={`admin-${id}`}
            onClick={() => {
              setPanel(id);
              setMessage("");
            }}
          >
            {id === "people" ? (
              <Users size={17} aria-hidden="true" />
            ) : id === "features" ? (
              <SlidersHorizontal size={17} aria-hidden="true" />
            ) : id === "payments" ? (
              <CreditCard size={17} aria-hidden="true" />
            ) : id === "handbook" ? (
              <BookOpen size={17} aria-hidden="true" />
            ) : (
              <Mail size={17} aria-hidden="true" />
            )}
            {label}
          </button>
        ))}
      </nav>
      {panel === "handbook" && (
        <>
          <OwnerEvidenceTools />
          <OwnerHandbook />
        </>
      )}
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
            <header className={styles.sectionHeading}>
              <div>
                <h2>Members</h2>
                <p>Complimentary Pro access</p>
              </div>
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  setEmail("");
                  setExpiry("");
                  setDuration(null);
                  setMessage("");
                  grantDialog.current?.showModal();
                }}
              >
                <Plus size={16} aria-hidden="true" />
                Grant access
              </button>
            </header>

            <div className="admin-member-tools">
              <label>
                Find a member
                <input
                  type="search"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search email"
                />
              </label>
              <label>
                Status
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                  <option value="all">All members</option>
                </select>
              </label>
            </div>
            {!data.grants.some(
              (g) =>
                g.email.toLowerCase().includes(memberSearch.toLowerCase()) &&
                (memberFilter === "all" ||
                  (g.revoked_at
                    ? "revoked"
                    : Date.parse(g.expires_at) <= Date.now()
                      ? "expired"
                      : "active") === memberFilter),
            ) && <p>No members match this filter.</p>}
            <div className={styles.tableWrap}>
              <table className={styles.members}>
                <caption className="sr-only">
                  Complimentary member access
                </caption>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Group</th>
                    <th>Access</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.grants.length ? (
                    data.grants
                      .filter(
                        (g) =>
                          g.email
                            .toLowerCase()
                            .includes(memberSearch.toLowerCase()) &&
                          (memberFilter === "all" ||
                            (g.revoked_at
                              ? "revoked"
                              : Date.parse(g.expires_at) <= Date.now()
                                ? "expired"
                                : "active") === memberFilter),
                      )
                      .map((g) => (
                        <tr key={g.user_id}>
                          <td data-label="Member">
                            <strong>{g.email}</strong>
                          </td>
                          <td data-label="Group">{g.cohort}</td>
                          <td data-label="Access">
                            <small>
                              {g.revoked_at
                                ? "Revoked"
                                : Date.parse(g.expires_at) < Date.now()
                                  ? "Expired"
                                  : `Until ${new Date(g.expires_at).toLocaleString()} · ${Math.max(0, Math.ceil((Date.parse(g.expires_at) - Date.now()) / 86400000))} days left`}
                            </small>
                          </td>
                          <td
                            data-label="Actions"
                            className="admin-member-actions"
                          >
                            <button
                              type="button"
                              className="button"
                              disabled={busy}
                              onClick={() => {
                                setEmail(g.email);
                                setCohort(g.cohort);
                                setExpiry(
                                  new Date(
                                    Math.max(
                                      Date.now(),
                                      Date.parse(g.expires_at),
                                    ) +
                                      30 * 86400000 -
                                      new Date().getTimezoneOffset() * 60000,
                                  )
                                    .toISOString()
                                    .slice(0, 16),
                                );
                                setDuration(null);
                                setMessage(
                                  `Review the new date for ${g.email}, then give access to save.`,
                                );
                                grantDialog.current?.showModal();
                              }}
                            >
                              Extend 30 days
                            </button>
                            <button
                              className="button"
                              disabled={busy || !!g.revoked_at}
                              onClick={() =>
                                void save({
                                  action: "revoke",
                                  userId: g.user_id,
                                })
                              }
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={4}>No complimentary grants yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <details className={styles.danger}>
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
            <h2>Payments</h2>
            <p>
              Check your billing connection. Manage invoices and subscriptions
              in Stripe.
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
          <details
            hidden={panel !== "people"}
            className="membership-panel admin-activity"
          >
            <summary>Recent activity</summary>
            <p>
              {data.usage} recorded research/AI usage entries this UTC month.
            </p>
            {data.audit.map((a, i) => (
              <div className="owner-audit-row" key={i}>
                <span>
                  {(
                    {
                      grant: "Pro access granted",
                      revoke: "Complimentary access revoked",
                      settings: "Feature settings updated",
                      "revoke-cohort": "Group access ended",
                    } as Record<string, string>
                  )[a.action] ?? a.action}
                  {a.target
                    ? ` · ${data.grants.find((g) => g.user_id === a.target)?.email ?? a.target}`
                    : ""}
                </span>
                <time>{new Date(a.created_at).toLocaleString()}</time>
              </div>
            ))}
          </details>
        </>
      )}
      <dialog
        ref={grantDialog}
        className={styles.dialog}
        aria-labelledby="grant-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <header className={styles.dialogHeading}>
          <h2 id="grant-title">Grant Pro access</h2>
          <button
            type="button"
            aria-label="Close grant access"
            disabled={busy}
            onClick={() => grantDialog.current?.close()}
          >
            <X size={20} />
          </button>
        </header>

        <p>Use an existing account email and choose an end date.</p>
        <div className="admin-duration-row" aria-label="Quick access duration">
          <span>Quick duration</span>
          {[7, 30, 90].map((days) => (
            <button
              type="button"
              className="button"
              key={days}
              aria-pressed={duration === days}
              disabled={busy}
              onClick={() => {
                setDuration(days);
                setMessage("");
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
              expiresAt: new Date(expiry).toISOString(),
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
              placeholder="name@example.com"
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
              onChange={(e) => {
                setExpiry(e.target.value);
                setDuration(null);
              }}
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
          {expiry && (
            <p className="admin-expiry-summary">
              Access will end {new Date(expiry).toLocaleString()}. Review the
              date before saving.
            </p>
          )}
          <button className="button primary" disabled={busy}>
            Grant complimentary Pro
          </button>
        </form>

        {message && <p role="status">{message}</p>}
      </dialog>
      {panel === "support" && (
        <section id="admin-support">
          <SupportInbox />
        </section>
      )}
    </section>
  );
}
