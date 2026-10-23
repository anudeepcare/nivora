"use client";
import Link from "next/link";
import { useState } from "react";
import { useAccess } from "./Access";
import { featureNames } from "@/lib/access-policy";
import { dateLabel } from "@/lib/format";
export default function PlanPanel() {
  const { access, refresh } = useAccess();
  const [message, setMessage] = useState("");
  return (
    <section className="membership-panel">
      <header>
        <div>
          <span className="eyebrow">Plan & access</span>
          <h2>
            {access.owner
              ? "Your owner workspace"
              : access.plan === "pro"
                ? "AURYN Pro"
                : "AURYN Free"}
          </h2>
          <p>
            {access.source === "complimentary"
              ? `Complimentary access until ${dateLabel(access.grantUntil)}.`
              : access.sampleOnly
                ? "Private beta with clearly labelled sample data."
                : access.enabled
                  ? "Your research, with clear limits."
                  : "Personal mode. Free/Pro restrictions are not activated yet."}
          </p>
        </div>
        <span className="plan-pill">
          {access.source === "owner"
            ? "Owner"
            : access.plan === "pro"
              ? "Pro"
              : "Free"}
        </span>
      </header>
      <div className="membership-metrics">
        <div>
          <span>Monthly company research</span>
          <strong>
            {access.owner && !access.preview
              ? "Owner access"
              : `${access.researchUsed === -1 ? "—" : (access.researchUsed ?? 0)} / ${access.limits.research}`}
          </strong>
          <small>Distinct tickers · resets each UTC calendar month</small>
        </div>
        <div>
          <span>Watchlist limit</span>
          <strong>{access.limits.watchlist} companies</strong>
          <small>Downgrading keeps existing saved records.</small>
        </div>
      </div>
      <details>
        <summary>Included in your access</summary>
        <ul>
          {Object.entries(featureNames).map(([key, label]) => (
            <li key={key}>
              <span>{label}</span>
              <b>
                {access.features[key as keyof typeof featureNames]
                  ? "Included"
                  : "Pro / unavailable"}
              </b>
            </li>
          ))}
        </ul>
      </details>
      <div className="membership-billing">
        <strong>Pro launch price · $2.99/month planned</strong>
        <p>
          Billing is not connected. No real or test payment can be collected
          from this build.
        </p>
        <button className="button" disabled>
          Subscriptions not available yet
        </button>
        <button
          className="button"
          onClick={() => {
            refresh();
            setMessage("Checking access…");
          }}
        >
          Refresh access
        </button>
      </div>
      {access.owner && (
        <div className="membership-owner-links">
          <Link href="/owner">Owner controls →</Link>
          <label>
            Preview plan
            <select
              value={access.preview ?? "owner"}
              onChange={(e) => {
                try {
                  e.target.value === "owner"
                    ? sessionStorage.removeItem("auryn-owner-preview")
                    : sessionStorage.setItem(
                        "auryn-owner-preview",
                        e.target.value,
                      );
                  window.dispatchEvent(new Event("auryn-access-refresh"));
                } catch {
                  setMessage("Preview could not be changed.");
                }
              }}
            >
              <option value="owner">Owner view</option>
              <option value="free">Free view</option>
              <option value="pro">Pro view</option>
            </select>
          </label>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
