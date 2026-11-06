"use client";
import { useEffect, useState } from "react";
import { Cloud, Play, Pause, RefreshCw, Save } from "lucide-react";
import { api } from "@/lib/client";
import type { OptionContract } from "@/lib/options-analysis";
import type { BoardPreset, BoardSnapshot } from "@/lib/exposure-board";
import { useProduct, useResource } from "./Session";
import ExposureBoard from "./ExposureBoard";
import s from "./MarketWorkspace.module.css";
type Capture = BoardSnapshot & {
  sourceAsOf?: string;
  quoteAsOf?: string;
  window?: string;
  frequency?: string;
  ivTerm?: { expiry: string; iv: number; observed: string }[];
};
type AccountData = {
  snapshots: Capture[];
  historyError?: string;
  views?: { body: { marketViews?: BoardPreset[] }; updated_at: string } | null;
};
export default function MarketWorkspace(props: {
  contracts: OptionContract[];
  spot: number;
  symbol: string;
  complete: boolean;
  expiry: string;
  onContracts: () => void;
}) {
  const { owner } = useProduct();
  return <AccountBoard key={owner + ":" + props.symbol} {...props} />;
}
function AccountBoard(props: {
  contracts: OptionContract[];
  spot: number;
  symbol: string;
  complete: boolean;
  expiry: string;
  onContracts: () => void;
}) {
  const { demo } = useProduct();
  const resource = useResource<AccountData>(
    demo ? null : `market-workspace/${encodeURIComponent(props.symbol)}`,
    demo ? { snapshots: [] } : undefined,
  );
  const [index, setIndex] = useState(-1),
    [playing, setPlaying] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [presets, setPresets] = useState<BoardPreset[]>([]),
    [accountPresets, setAccountPresets] = useState<BoardPreset[] | undefined>();
  const snapshots = resource.data?.snapshots ?? [];
  useEffect(() => {
    if (!playing || snapshots.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => Math.min(i + 1, snapshots.length - 1)),
      1500,
    );
    return () => clearInterval(timer);
  }, [playing, snapshots.length]);
  useEffect(() => {
    if (playing && index >= snapshots.length - 1) setPlaying(false);
  }, [index, playing, snapshots.length]);
  const selected = index >= 0 ? snapshots[index] : undefined;
  async function action(fn: () => Promise<void>) {
    if (demo) {
      setMessage(
        "Sign in to use account history. Device snapshots remain available below.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Account operation failed.");
    } finally {
      setBusy(false);
    }
  }
  const path = `market-workspace/${encodeURIComponent(props.symbol)}`;
  const accountTools = (
      <section className={s.account} aria-label="Account market history">
        <h4>
          <Cloud size={18} /> Account checkpoints{" "}
          <small> · {snapshots.length} checkpoints</small>
        </h4>
        <p>
          Saved checkpoints replay the observations captured in your account.
        </p>
        <div className={s.actions}>
          <button
            type="button"
            disabled={busy || !!demo}
            onClick={() =>
              void action(async () => {
                await api(path, {
                  op: "capture",
                  expiry: props.expiry || null,
                });
                await resource.refresh();
                setIndex(-1);
                setMessage(
                  "Account checkpoint saved from server-loaded market data. Identical sources reuse the existing record.",
                );
              })
            }
          >
            <Save size={16} /> Capture to account
          </button>
          <button
            type="button"
            disabled={busy || !!demo}
            onClick={() => resource.refresh()}
          >
            <RefreshCw size={16} /> Reload account history
          </button>
          <button
            type="button"
            disabled={busy || !resource.data || !!demo}
            onClick={() =>
              void action(async () => {
                await api(path, {
                  op: "views",
                  presets,
                  expectedUpdatedAt: resource.data?.views?.updated_at ?? null,
                });
                await resource.refresh();
                setMessage("Views saved to your account.");
              })
            }
          >
            Save views to account
          </button>
          <button
            type="button"
            disabled={!resource.data?.views || busy}
            onClick={() => {
              setAccountPresets(resource.data?.views?.body.marketViews ?? []);
              setMessage("Account views loaded into this device.");
            }}
          >
            Load account views
          </button>
        </div>
        {(resource.error || resource.data?.historyError) && (
          <p role="status">{resource.error || resource.data?.historyError}</p>
        )}
        <label>
          Replay checkpoint
          <select
            value={index}
            onChange={(e) => {
              setIndex(Number(e.target.value));
              setPlaying(false);
            }}
          >
            <option value={-1}>Latest loaded / device view</option>
            {snapshots.map((x, i) => (
              <option key={x.id} value={i}>
                {new Date(x.savedAt).toLocaleString()} · source{" "}
                {x.sourceAsOf ?? "dated in cells"}
              </option>
            ))}
          </select>
        </label>
        {snapshots.length > 1 && (
          <div className={s.actions}>
            <button
              type="button"
              onClick={() => {
                if (index < 0 || index === snapshots.length - 1) setIndex(0);
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
              {playing ? "Pause" : "Play recorded checkpoints"}
            </button>
            <input
              type="range"
              aria-label="Recorded checkpoint timeline"
              min={0}
              max={snapshots.length - 1}
              value={Math.max(0, index)}
              onChange={(e) => {
                setIndex(Number(e.target.value));
                setPlaying(false);
              }}
            />
          </div>
        )}
        {selected && (
          <p>
            <b>Recorded {new Date(selected.savedAt).toLocaleString()}</b> ·
            underlying source {selected.quoteAsOf ?? "dated in record"} ·{" "}
            {selected.frequency} · {selected.window}
          </p>
        )}
      </section>
  );
  return (
    <div className={s.workspace}>
      <ExposureBoard
        {...props}
        accountTools={accountTools}
        externalSnapshot={selected}
        onExitReplay={() => {
          setIndex(-1);
          setPlaying(false);
        }}
        accountPresets={accountPresets}
        onPresetsChanged={setPresets}
        onCreateAlert={(cell, type) =>
          void action(async () => {
            await api("documents", {
              kind: "alert",
              key: crypto.randomUUID(),
              body: {
                name: `${props.symbol} ${cell.strike} exposure`,
                symbol: props.symbol,
                type,
                threshold: type === "exposure-change" ? 20 : cell.strike,
                referenceStrike: cell.strike,
                expiry: cell.expiry,
                exposureRole: "fixed",
                marginPercent: 0.5,
                enabled: true,
              },
            });
            setMessage(
              "Exposure rule saved. It is evaluated during supported alert checks, not continuously between checks.",
            );
          })
        }
      />

      {message && (
        <p className={s.feedback} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
