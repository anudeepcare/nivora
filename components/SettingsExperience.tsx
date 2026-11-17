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
          <strong>How much should Auryn show first?</strong>
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

export function SettingsSignalPolicies() {
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
      <section className="workspace-setting-group">
        <header>
          <span>
            <small>DATA &amp; SIGNALS</small>
            <strong>Choose what belongs in your decision stream</strong>
          </span>
        </header>
        <p className="settings-feature-status">
          Choose which evidence panels appear in research. Saved to your
          account; this does not change data coverage or permissions.
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
              <b>{label}</b>
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
      <section className="workspace-setting-group">
        <header>
          <span>
            <small>NOTIFICATIONS</small>
            <strong>Interruptions require a reason</strong>
          </span>
        </header>
        <p className="settings-feature-status">
          These notification policies are not active. Use Price alerts below for
          the existing alert controls.
        </p>
        {[
          "Material thesis change",
          "Pace confirmation",
          "Earnings preparation",
          "Congressional or insider filing",
          "Estimate revision",
        ].map((label) => (
          <div className="settings-policy-row" key={label}>
            <span>
              <b>{label}</b>
              <small>
                Source-linked and deduplicated delivery is not configured.
              </small>
            </span>
            <button type="button" disabled>
              Not available
            </button>
          </div>
        ))}
      </section>
      <section className="workspace-setting-group">
        <header>
          <span>
            <small>DECISION POLICY</small>
            <strong>Additional portfolio guardrails</strong>
          </span>
        </header>
        <p className="settings-feature-status">
          Saved review limits, not trade restrictions. Cash reserve is checked
          for cash-funded additions; maximum loss is checked only for modeled
          option strategies with defined loss.
        </p>
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
              <b>{label}</b>
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
                  <option value={preferences[key]!}>{preferences[key]}%</option>
                )}
            </select>
          </label>
        ))}
      </section>
    </>
  );
}
