"use client";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
const EtfScreener = dynamic(() => import("./EtfScreener"));
const MarketSummary = dynamic(() => import("./MarketSummary"));
const MarketInsiderActivity = dynamic(() => import("./MarketInsiderActivity"));
const MarketTrackers = dynamic(() => import("./MarketTrackers"));
const MarketMood = dynamic(() => import("./MarketMood"));
const GlobalEarningsCalendar = dynamic(
  () => import("./GlobalEarningsCalendar"),
);
const AlternativeIndexes = dynamic(() => import("./AlternativeIndexes"));
import StockScreener from "./StockScreener";
import layout from "./OptionsMarketOverview.module.css";
import { useProduct } from "./Session";
import OptionsMarketOverview from "./OptionsMarketOverview";

/** Market observations are independent of the currently researched ticker. */
export default function OptionsMarketPage() {
  const { demo } = useProduct();
  const [view, setView] = useState("options");
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <section className={layout.page} aria-labelledby="market-options-title">
      <header className={layout.pageHeader}>
        <h1 id="market-options-title">Explore the market</h1>
        <p>
          Screen stocks, inspect market-wide options, or open one categorized
          tracker, sentiment snapshot or alternative index.
        </p>
        <p>
          <Link href={`${prefix}/research`}>
            Research a ticker and its contracts ↗
          </Link>
        </p>
      </header>
      {demo ? (
        <p role="status">
          Market-wide observations are not included in this design preview.
        </p>
      ) : (
        <>
          <label className={layout.mobileViewChoice}>
            Market view
            <select
              aria-label="Market research view"
              value={view}
              onChange={(event) => setView(event.target.value)}
            >
              <option value="options">Market options</option>
              <option value="stocks">Stock screener</option>
              <option value="trackers">Market trackers</option>
              <option value="mood">Mood &amp; breadth</option>
              <option value="indexes">Alternative indexes</option>
              <option value="earnings">Earnings calendar</option>
              <option value="insiders">Insider activity</option>
              <option value="summary">Market summary</option>
              <option value="etfs">ETF screener</option>
            </select>
          </label>
          <div
            className={layout.viewSwitch}
            role="group"
            aria-label="Market research views"
          >
            <button
              aria-pressed={view === "options"}
              onClick={() => setView("options")}
            >
              Market options
            </button>
            <button
              aria-pressed={view === "stocks"}
              onClick={() => setView("stocks")}
            >
              Stock screener
            </button>
            <button
              aria-pressed={view === "trackers"}
              onClick={() => setView("trackers")}
            >
              Market trackers
            </button>
            <button
              aria-pressed={view === "mood"}
              onClick={() => setView("mood")}
            >
              Mood & breadth
            </button>
            <button
              aria-pressed={view === "indexes"}
              onClick={() => setView("indexes")}
            >
              Alternative indexes
            </button>
            <button
              aria-pressed={view === "earnings"}
              onClick={() => setView("earnings")}
            >
              Earnings calendar
            </button>
            <button
              aria-pressed={view === "insiders"}
              onClick={() => setView("insiders")}
            >
              Insider activity
            </button>
            <button
              aria-pressed={view === "summary"}
              onClick={() => setView("summary")}
            >
              Market summary
            </button>
            <button
              aria-pressed={view === "etfs"}
              onClick={() => setView("etfs")}
            >
              ETF screener
            </button>
          </div>
          {view === "etfs" ? (
            <EtfScreener />
          ) : view === "summary" ? (
            <MarketSummary />
          ) : view === "insiders" ? (
            <MarketInsiderActivity />
          ) : view === "earnings" ? (
            <GlobalEarningsCalendar />
          ) : view === "mood" ? (
            <MarketMood />
          ) : view === "indexes" ? (
            <AlternativeIndexes />
          ) : view === "trackers" ? (
            <MarketTrackers />
          ) : view === "options" ? (
            <OptionsMarketOverview standalone />
          ) : (
            <StockScreener />
          )}
        </>
      )}
    </section>
  );
}
