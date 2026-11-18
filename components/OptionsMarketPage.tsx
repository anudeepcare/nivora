"use client";
import Link from "next/link";
import { useState } from "react";
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
          Find an instrument across the returned stock and ETF options coverage.
        </p>
        <p>
          <Link href={`${prefix}/research`}>
            Research a ticker and its contracts ↗
          </Link>
        </p>
      </header>
      {demo ? (
        <p role="status">
          Market-wide options observations are not included in this design
          preview.
        </p>
      ) : (
        <>
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
          </div>
          {view === "options" ? (
            <OptionsMarketOverview standalone />
          ) : (
            <StockScreener />
          )}
        </>
      )}
    </section>
  );
}
