"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Research } from "@/lib/types";
import {
  cleanEstimateSnapshot,
  compareEstimateSnapshots,
  estimateSnapshot,
  type EstimateSnapshot,
} from "@/lib/estimate-revisions";
import { amount, dateLabel } from "@/lib/format";
import { api, authClient } from "@/lib/client";
import { useProduct } from "./Session";
import styles from "./EstimateRevisions.module.css";
export default function EstimateRevisions({
  research,
}: {
  research: Research;
}) {
  const { owner, demo } = useProduct();
  return (
    <RevisionRecord
      key={`${owner}:${research.company.symbol}:${!!demo}`}
      research={research}
      owner={owner}
      demo={!!demo || !!research.demo}
    />
  );
}
function RevisionRecord({
  research: r,
  owner,
  demo,
}: {
  research: Research;
  owner: string;
  demo: boolean;
}) {
  const current = useMemo(() => estimateSnapshot(r), [r]);
  const [baseline, setBaseline] = useState<EstimateSnapshot | null>(null),
    [status, setStatus] = useState<"loading" | "ready" | "error">("loading"),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  const alive = useRef(true),
    saveRequest = useRef<AbortController | null>(null);
  const key = `estimates-${r.company.symbol}`;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      saveRequest.current?.abort();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");
    setBaseline(null);
    if (demo) {
      setStatus("ready");
      return () => controller.abort();
    }
    api<{ documents: { key: string; body: { estimateSnapshot?: unknown } }[] }>(
      "documents?kind=view",
      undefined,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(result.documents))
          throw Error("Saved estimates returned an invalid response.");
        const found = result.documents.find((doc) => doc.key === key);
        if (!found && result.documents.length >= 200)
          throw Error(
            "The saved-document list is incomplete. Your baseline cannot be safely loaded.",
          );
        if (found) {
          const parsed = cleanEstimateSnapshot(found.body.estimateSnapshot);
          if (parsed.symbol !== r.company.symbol)
            throw Error("Saved baseline belongs to a different symbol.");
          setBaseline(parsed);
        }
        setStatus("ready");
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setStatus("error");
          setError(
            e instanceof Error ? e.message : "Could not load saved baseline.",
          );
        }
      });
    return () => controller.abort();
  }, [demo, key, r.company.symbol, retry]);
  async function save() {
    if (demo || busy || status !== "ready" || !current) return;
    setBusy(true);
    setError("");
    setMessage("");
    const controller = new AbortController();
    saveRequest.current = controller;
    try {
      const { data, error: authError } = await authClient().auth.getSession();
      if (authError || data.session?.user.id !== owner)
        throw Error("Your account changed. Reload before saving.");
      if (controller.signal.aborted) return;
      const snapshot = { ...current, savedAt: new Date().toISOString() };
      await api(
        "documents",
        {
          kind: "view",
          key,
          body: {
            name: `${r.company.symbol} estimate baseline`,
            symbols: [r.company.symbol],
            estimateSnapshot: snapshot,
          },
        },
        controller.signal,
      );
      if (alive.current && !controller.signal.aborted) {
        setBaseline(snapshot);
        setMessage(
          baseline
            ? "Baseline replaced with the current estimates."
            : "Baseline saved. Return after the estimate dataset changes to compare.",
        );
      }
    } catch (e) {
      if (alive.current && !controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Could not save baseline.");
    } finally {
      if (alive.current && !controller.signal.aborted) setBusy(false);
    }
  }
  const comparisons =
    current && baseline ? compareEstimateSnapshots(current, baseline) : [];
  return (
    <section className={styles.root} aria-label="Saved estimate comparison">
      <header>
        <div>
          <h4>Change since your saved baseline</h4>
          <p>
            A private comparison of two observations, not a complete market
            revision history.
          </p>
        </div>
        <button
          type="button"
          className="button"
          onClick={save}
          disabled={demo || status !== "ready" || busy || !current}
        >
          {busy ? "Saving…" : baseline ? "Replace baseline" : "Save baseline"}
        </button>
      </header>
      {demo ? (
        <p>
          Preview only. Estimate baselines are not loaded or saved in this demo.
        </p>
      ) : status === "loading" ? (
        <p role="status">Loading your saved baseline…</p>
      ) : null}
      {error && (
        <div role="alert">
          <p>{error}</p>
          {status === "error" && (
            <button
              className="button"
              type="button"
              onClick={() => setRetry((x) => x + 1)}
            >
              Retry loading baseline
            </button>
          )}
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {!demo && status === "ready" && !baseline && (
        <p>
          No baseline saved. Save the current annual estimates to compare with a
          future observation.
        </p>
      )}
      {!current && (
        <p>
          Current dated annual estimates are unavailable; saving and comparison
          are disabled.
        </p>
      )}
      {baseline && (
        <>
          <p>
            Saved {dateLabel(baseline.savedAt)} · baseline dataset{" "}
            {dateLabel(baseline.observedAt)} · current dataset{" "}
            {dateLabel(current?.observedAt)} · source{" "}
            {baseline.source ?? "not supplied"}.
          </p>
          {!!comparisons.length && (
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Fiscal period</th>
                    <th>EPS: saved → current</th>
                    <th>Revenue: saved → current</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c) => (
                    <tr key={`${c.row.period}-${c.row.date}-${c.row.currency}`}>
                      <th scope="row">
                        {c.row.period}
                        <small>
                          {dateLabel(c.row.date)} · {c.row.currency}
                        </small>
                      </th>
                      <td>
                        {amount(c.baseline?.eps, c.row.currency)} →{" "}
                        {amount(c.row.eps, c.row.currency)}
                        <small>{c.epsReason ?? c.epsChange}</small>
                        {c.row.epsBasis && (
                          <small>Current basis: {c.row.epsBasis}</small>
                        )}
                      </td>
                      <td>
                        {amount(c.baseline?.revenue, c.row.currency, true)} →{" "}
                        {amount(c.row.revenue, c.row.currency, true)}
                        <small>{c.revenueReason ?? c.revenueChange}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className={styles.note}>
            Only matching fiscal periods, end dates, currencies and sources are
            compared. EPS changes also require the same known accounting basis.
            Replacing the baseline replaces this one saved comparison point.
          </p>
        </>
      )}
    </section>
  );
}
