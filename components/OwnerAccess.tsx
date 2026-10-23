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
    [busy, setBusy] = useState(false);
  const load = async () => {
    const d = await api<Data>("owner/access");
    setData(d);
    setConfig(d.config);
  };
  useEffect(() => {
    if (access.owner) void load().catch((e) => setMessage(e.message));
  }, [access.owner]);
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
        <span className="eyebrow">Private owner console</span>
        <h1>Access, kept simple.</h1>
        <p>
          Control beta invitations and plan features. Real charges remain
          disabled.
        </p>
      </header>
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
          <section className="membership-panel">
            <header>
              <div>
                <h2>Launch & limits</h2>
                <p>
                  {data.enabled
                    ? "Free/Pro controls are enabled."
                    : "Controls are configured but not activated. Set AURYN_ACCESS_ENABLED=true after applying the migration."}
                </p>
              </div>
              <span className="plan-pill">No billing</span>
            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save({ action: "settings", config });
              }}
            >
              <div className="owner-field-grid">
                <label>
                  Who may enter?
                  <select
                    value={config.mode}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mode: e.target.value as AccessConfig["mode"],
                      })
                    }
                  >
                    <option value="private">Owner and invited accounts</option>
                    <option value="beta">
                      All signed-in accounts · sample beta
                    </option>
                  </select>
                </label>
                {(
                  [
                    "freeResearch",
                    "proResearch",
                    "freeWatchlist",
                    "proWatchlist",
                    "proAi",
                  ] as const
                ).map((k) => (
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
                ))}
              </div>
              <h3>Feature access</h3>
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
                      <option value="beta">Invited beta only</option>
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
          <section className="membership-panel">
            <h2>Invite a friend</h2>
            <p>
              They create an account first. Complimentary Pro expires
              automatically; no card is needed.
            </p>
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
                Beta group
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
              <summary>End a beta group</summary>
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
          <section className="membership-panel">
            <h2>Recent activity</h2>
            <p>
              {data.usage} recorded research/AI usage entries this UTC month.
            </p>
            {data.audit.map((a, i) => (
              <div className="owner-audit-row" key={i}>
                <span>{a.action}</span>
                <time>{dateLabel(a.created_at)}</time>
              </div>
            ))}
          </section>
        </>
      )}
    </section>
  );
}
