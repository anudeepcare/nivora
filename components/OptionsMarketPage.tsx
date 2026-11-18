"use client";
import Link from "next/link";
import { useProduct } from "./Session";
import OptionsMarketOverview from "./OptionsMarketOverview";

/** Market observations are independent of the currently researched ticker. */
export default function OptionsMarketPage() {
  const { demo } = useProduct();
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  return (
    <section aria-labelledby="market-options-title">
      <header>
        <h1 id="market-options-title">Market options</h1>
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
        <OptionsMarketOverview />
      )}
    </section>
  );
}
