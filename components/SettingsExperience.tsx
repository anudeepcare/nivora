"use client";
import { useWorkspacePreferences } from "./WorkspacePreferences";
import { useResearchPreferences } from "./ResearchPreferences";

export default function SettingsExperience() {
  const { preferences, setPreferences, disabled, error } =
    useResearchPreferences();
  const selected =
    preferences.horizon === "swing"
      ? "swing"
      : preferences.detail === "advanced"
        ? "deep"
        : "glance";
  return (
    <section className="workspace-setting-group settings-experience">
      <header>
        <span>
          <small>RESEARCH EXPERIENCE</small>
          <strong>Default research view</strong>
        </span>
      </header>
      <div
        className="settings-choice-cards"
        role="group"
        aria-label="Research experience"
      >
        {(
          [
            [
              "glance",
              "30-second glance",
              "Decision, change, price assumptions, Pace, and risk first.",
            ],
            [
              "deep",
              "Deep research",
              "Open with the complete evidence record and source detail.",
            ],
            [
              "swing",
              "Swing context",
              "Emphasize price behavior, catalysts, and shorter review windows.",
            ],
          ] as const
        ).map(([id, title, detail]) => (
          <button
            type="button"
            key={id}
            disabled={disabled}
            aria-pressed={selected === id}
            onClick={() =>
              setPreferences({
                detail: id === "deep" ? "advanced" : "essential",
                horizon: id === "swing" ? "swing" : "long",
              })
            }
          >
            <i aria-hidden="true">{selected === id ? "✓" : ""}</i>
            <b>{title}</b>
            <p>{detail}</p>
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

export function SettingsSignalPolicies({
  section = "all",
}: { section?: "all" | "signals" | "policy" | "notifications" } = {}) {
  const { preferences, save, saving, ready, localOnly, error } =
    useWorkspacePreferences();
  const signalIds = [
    "congressional",
    "insiders",
    "institutions",
    "options",
    "technicals",
  ];
  return (
    <>
      {(section === "all" || section === "signals") && (
        <section
          id="settings-signals"
          className="workspace-setting-group settings-signals"
        >
          <header>
            <span>
              <small>DATA &amp; SIGNALS</small>
              <strong>Research panels</strong>
            </span>
          </header>
          <p className="settings-feature-status">
            Choose visible panels. Your data coverage and permissions stay
            unchanged.
          </p>
          {[
            [
              "Congressional transactions",
              "House and Senate disclosures with filing-delay context.",
            ],
            [
              "Insider transactions",
              "Form 4 activity with role, plan, and 10b5-1 context.",
            ],
            [
              "Institutional ownership",
              "13F changes and concentration by reporting period.",
            ],
            [
              "Options exposure",
              "Available provider analytics; full option chains require separate entitlement.",
            ],
            [
              "Technical indicators",
              "Trend, momentum, volatility, volume, and reference levels.",
            ],
          ].map(([label, detail], index) => (
            <label className="settings-policy-row" key={label}>
              <span>
                <b>
                  {label}
                  <span
                    className="settings-info"
                    tabIndex={0}
                    title={detail}
                    aria-label={detail}
                  >
                    i
                  </span>
                </b>
                <small>{detail}</small>
              </span>
              <input
                type="checkbox"
                disabled={saving || !ready || localOnly}
                aria-label={label}
                checked={!preferences.hiddenSignals.includes(signalIds[index])}
                onChange={(e) =>
                  void save({
                    hiddenSignals: e.target.checked
                      ? preferences.hiddenSignals.filter(
                          (id) => id !== signalIds[index],
                        )
                      : [...preferences.hiddenSignals, signalIds[index]],
                  })
                }
              />
            </label>
          ))}
          {localOnly && (
            <p className="settings-feature-status">
              Sign in to save signal visibility.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
        </section>
      )}
      {(section === "all" || section === "notifications") && (
        <section
          id="settings-notifications"
          className="workspace-setting-group settings-notifications"
        >
          <header>
            <span>
              <small>NOTIFICATIONS</small>
              <strong>In-app alerts</strong>
            </span>
          </header>
          <p className="settings-feature-status">
            Choose a company and condition, then create a rule. Events appear in
            Alerts after a successful check. No email or push delivery.
          </p>
          <div className="button-row" aria-label="Set up in-app alerts">
            <a className="button" href="alerts?type=monthly-zone">
              Pace zone
            </a>
            <a className="button" href="alerts?type=earnings-soon">
              Earnings
            </a>
            <a className="button" href="alerts?type=new-filing">
              Filings
            </a>
          </div>
        </section>
      )}
      {(section === "all" || section === "policy") && (
        <section
          id="settings-policy"
          className="workspace-setting-group settings-policy"
        >
          <header>
            <span>
              <small>DECISION POLICY</small>
              <strong>Portfolio guardrails</strong>
            </span>
          </header>
          <p className="settings-feature-status">
            Saved review limits, not trade restrictions. Cash reserve is checked
            for cash-funded additions; maximum loss is checked only for modeled
            option strategies with defined loss.
          </p>
          <label className="settings-policy-row">
            <span>
              <b>Single-position attention threshold</b>
              <small>
                Your review threshold, not an allocation recommendation.
              </small>
            </span>
            <select
              aria-label="Single-position attention threshold"
              value={preferences.concentrationLimit ?? ""}
              disabled={saving || !ready || localOnly}
              onChange={(event) =>
                void save({
                  concentrationLimit: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
            >
              <option value="">Off</option>
              {[10, 15, 20, 25, 30, 40, 50].map((value) => (
                <option key={value} value={value}>
                  {value}% of priced investments
                </option>
              ))}
            </select>
          </label>
          {(
            [
              [
                "maxLossPercent",
                "Maximum loss per idea",
                "Percentage of priced USD portfolio value, including recorded cash.",
              ],
              [
                "cashReservePercent",
                "Cash reserve",
                "Protect this percentage of the same portfolio base in cash-funded addition reviews.",
              ],
            ] as const
          ).map(([key, label, detail]) => (
            <label className="settings-policy-row" key={key}>
              <span>
                <b>
                  {label}
                  <span
                    className="settings-info"
                    tabIndex={0}
                    title={detail}
                    aria-label={detail}
                  >
                    i
                  </span>
                </b>
                <small>{detail}</small>
              </span>
              <select
                aria-label={label}
                value={preferences[key] ?? ""}
                disabled={saving || !ready || localOnly}
                onChange={(event) =>
                  void save({
                    [key]:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  })
                }
              >
                <option value="">Off</option>
                {(key === "maxLossPercent"
                  ? [0.25, 0.5, 1, 2, 3, 5, 10]
                  : [0, 5, 10, 15, 20, 25, 50]
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}%
                  </option>
                ))}
                {preferences[key] != null &&
                  !(
                    key === "maxLossPercent"
                      ? [0.25, 0.5, 1, 2, 3, 5, 10]
                      : [0, 5, 10, 15, 20, 25, 50]
                  ).includes(preferences[key]!) && (
                    <option value={preferences[key]!}>
                      {preferences[key]}%
                    </option>
                  )}
              </select>
            </label>
          ))}
        </section>
      )}
    </>
  );
}
