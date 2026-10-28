"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Plus, RefreshCw, Trash2, Check } from "lucide-react";
import { api } from "@/lib/client";
import { useProduct, useResource } from "./Session";
import { PageHeading, Notice, Empty } from "./Ui";
import { dateLabel } from "@/lib/format";
type Rule = {
  key: string;
  body: {
    symbol: string;
    type: string;
    name: string;
    threshold: number;
    enabled: boolean;
  };
};
type Event = {
  id: string;
  symbol: string;
  title: string;
  detail: string;
  created_at: string;
  read_at: string | null;
};
export default function AlertCenter() {
  const { demo, workspace } = useProduct(),
    prefix = demo && demo.routePrefix !== "" ? "/preview" : "",
    previewRules = useMemo(
      () => (demo ? { documents: [] as Rule[] } : undefined),
      [demo],
    ),
    previewEvents = useMemo(
      () => (demo ? { events: [] as Event[] } : undefined),
      [demo],
    );
  const rules = useResource<{ documents: Rule[] }>(
      "documents?kind=alert",
      previewRules,
    ),
    events = useResource<{ events: Event[] }>("alerts", previewEvents);
  const [symbol, setSymbol] = useState(""),
    [type, setType] = useState("new-filing"),
    [threshold, setThreshold] = useState("2"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      if (demo)
        throw Error(
          "This preview does not create alerts. Sign in to monitor your companies.",
        );
      await fn();
      rules.refresh();
      events.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    await action(() =>
      api("documents", {
        kind: "alert",
        key: crypto.randomUUID(),
        body: {
          symbol: symbol.trim().toUpperCase(),
          type,
          threshold: type === "new-filing" ? null : Number(threshold),
          enabled: true,
          name: "",
        },
      }),
    );
  }
  return (
    <section className="alerts-studio">
      <PageHeading
        title="Alerts"
        subtitle="Your levels, monthly zones and new company filings. One focused history."
        action={
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              action(async () => {
                const r = await api<{
                  checked: number;
                  created: number;
                  errors: string[];
                }>("alerts", { op: "check" });
                setMessage(
                  `Checked ${r.checked} rules · ${r.created} new alerts${r.errors.length ? ` · ${r.errors.join(" ")}` : ""}`,
                );
              })
            }
          >
            <RefreshCw size={16} />
            Check now
          </button>
        }
      />
      {(message || rules.error || events.error) && (
        <Notice>{message || rules.error || events.error}</Notice>
      )}
      <form onSubmit={add} className="alert-builder panel">
        <label>
          Company
          <input
            required
            list="saved-alert-symbols"
            value={symbol}
            placeholder="Ticker"
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
          <datalist id="saved-alert-symbols">
            {workspace?.watchlist.map((w) => (
              <option key={w.symbol}>{w.symbol}</option>
            ))}
          </datalist>
        </label>
        <label>
          Notify me about
          <select value={type} onChange={(e) => {setType(e.target.value);setThreshold(e.target.value==="sbc-above"?"10":e.target.value==="current-below"?"1":e.target.value==="margin-below"?"0":"2");}}>
            <option value="interest-below">Interest coverage falls below</option>
            <option value="sbc-above">Stock pay / revenue rises above</option>
            <option value="current-below">Current ratio falls below</option>
            <option value="margin-below">Operating margin falls below</option>
            <option value="earnings-soon">Earnings approaching</option>
            <option value="new-filing">New company filing</option>
            <option value="monthly-zone">Monthly accumulation zone</option>
            <option value="price-below">Price below my level</option>
            <option value="price-above">Price above my level</option>
          </select>
        </label>
        {type !== "new-filing" && (
          <label>
            {type === "monthly-zone"
              ? "Zone (0 = pause)"
              : type === "earnings-soon"
                ? "Days before earnings"
                : type==='sbc-above'||type==='margin-below'?'Threshold · %':type==='interest-below'||type==='current-below'?'Threshold · ×':"Price · USD"}
            <input
              type="number"
              step={
                type === "monthly-zone" || type === "earnings-soon"
                  ? "1"
                  : ".01"
              }
              min={
                type === "margin-below" ? "-1000" : type === "monthly-zone"
                  ? "0"
                  : type === "earnings-soon"
                    ? "1"
                    : ".01"
              }
              max={
                type === "monthly-zone"
                  ? "4"
                  : type === "earnings-soon"
                    ? "30"
                    : undefined
              }
              required
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </label>
        )}
        <button className="button primary" disabled={busy}>
          <Plus size={16} />
          Create alert
        </button>
      </form>
      <p className="footnote">
        Financial alerts establish a baseline on the first check, then report later safe-to-breached crossings. They do not alert merely because the first observed value is already weak. Missing data does not reset the baseline. Checks use available source timestamps. Scheduled checks require the
        included monitoring workflow to be configured. No email or push messages
        are sent.
      </p>
      <div className="two-col support">
        <section>
          <h2>Your rules</h2>
          {rules.data?.documents.length ? (
            rules.data.documents.map((r) => (
              <div className="compact-record" key={r.key}>
                <div>
                  <b>{r.body.symbol}</b>
                  <p>
                    {r.body.type.replaceAll("-", " ")}
                    {r.body.threshold != null ? ` · ${r.body.threshold}` : ""}
                  </p>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Remove ${r.body.symbol} alert`}
                  disabled={busy}
                  onClick={() =>
                    action(() =>
                      api("documents", {
                        op: "delete",
                        kind: "alert",
                        key: r.key,
                      }),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <Empty title="Follow what matters" icon={Bell}>
              Choose a company and a specific condition above.
            </Empty>
          )}
        </section>
        <section>
          <h2>Alert history</h2>
          {events.data?.events.length ? (
            events.data.events.map((e) => (
              <article className="compact-record" key={e.id}>
                <div>
                  <Link
                    href={`${prefix}/research/${encodeURIComponent(e.symbol.replace("/", "-"))}`}
                  >
                    <b>{e.title}</b>
                  </Link>
                  <p>{e.detail}</p>
                  <small>
                    {dateLabel(e.created_at)}
                    {e.read_at ? " · Read" : ""}
                  </small>
                </div>
                {!e.read_at && (
                  <button
                    className="icon-button"
                    aria-label="Mark alert read"
                    onClick={() =>
                      action(() => api("alerts", { op: "read", id: e.id }))
                    }
                  >
                    <Check size={17} />
                  </button>
                )}
              </article>
            ))
          ) : (
            <Empty title="Nothing triggered yet">
              New events appear here after a successful check. Missing data will
              not trigger an invented alert.
            </Empty>
          )}
        </section>
      </div>
    </section>
  );
}
