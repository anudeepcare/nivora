"use client";
import dynamic from "next/dynamic";
const MarketInsights = dynamic(() => import("./MarketInsights"));
import { useResource } from "./Session";
import type { MarketSummary as Summary } from "@/lib/market-summary";
import MarketSummaryMarkdown from "./MarketSummaryMarkdown";
import s from "./GlobalEarningsCalendar.module.css";
export default function MarketSummary() {
  const resource = useResource<Summary>("market-summary", undefined, 300000),
    data = resource.data;
  return (
    <section className={s.root} aria-label="Market summary">
      <header>
        <h2>Market summary</h2>
        <p>
          AI-generated session commentary, not independently verified facts or
          investment advice. Check the generation date and linked reporting
          before relying on it.
        </p>
      </header>
      <div className={s.controls}>
        <button disabled={resource.loading} onClick={resource.refresh}>
          {resource.loading ? "Loading…" : "Check for updates"}
        </button>
      </div>
      {resource.error ? <p role="status">{resource.error}</p> : null}
      {data ? (
        <>
          <p className={s.note}>
            Generated: {data.generatedAt ?? "Not supplied"}. Received:{" "}
            {data.receivedAt}. Server snapshots are cached for 15 minutes; this
            loaded view can be older. A new receipt does not mean a new
            narrative.
          </p>
          {data.headline ? (
            <p>{data.headline}</p>
          ) : (
            <p>No headline has been generated in this response.</p>
          )}
          {data.expandedContent ? (
            <details>
              <summary>Read the session analysis</summary>
              <MarketSummaryMarkdown text={data.expandedContent} />
            </details>
          ) : (
            <p>Expanded analysis is not available.</p>
          )}
          <details>
            <summary>Source and coverage</summary>
            <p className={s.note}>
              SentiSense market-summary API, available on all provider tiers
              with a key. The documented response has no preview flag; complete
              market coverage is not implied. Usually regenerated around session
              boundaries, not continuously. Response served: {data.servedAt}.
              Citations are third-party sources, not instructions or endorsed
              conclusions.
            </p>
          </details>
        </>
      ) : !resource.loading && !resource.error ? (
        <p role="status">Market summary unavailable.</p>
      ) : null}
      <MarketInsights />
    </section>
  );
}
