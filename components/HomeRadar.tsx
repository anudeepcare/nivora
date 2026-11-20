"use client";
import { memo, useEffect, useState } from "react";
import type { Research } from "../lib/types";
import OpportunityMap from "./OpportunityMap";
import { MarketRadar } from "./MarketRadar";
import DailyMarketRadar from "./DailyMarketRadar";

type Props = {
  research: Research[];
  requested: string[];
  asOf: string;
  prefix: string;
  demo: boolean;
};

/** Local to this mounted account view. Never persists private evidence across accounts. */
function HomeRadar(props: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Let the primary Today content paint before analyzing multi-year histories.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), {
        timeout: 500,
      });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  if (!ready)
    return <p role="status">Preparing radar from loaded company evidence…</p>;
  return (
    <>
      {props.demo ? (
        <>
          <MarketRadar research={props.research} asOf={props.asOf} />
          <OpportunityMap
            compact
            research={props.research}
            requested={props.requested}
            prefix={props.prefix}
            demo={props.demo}
          />
        </>
      ) : (
        <DailyMarketRadar
          research={props.research}
          requested={props.requested}
          asOf={props.asOf}
          sampleEvidence={
            <OpportunityMap
              compact
              research={props.research}
              requested={props.requested}
              prefix={props.prefix}
              demo={props.demo}
            />
          }
        />
      )}
    </>
  );
}

// Home receives frequent quote/feed updates and creates new arrays. Retain analysis
// when their actual immutable evidence objects, universe and date did not change.
export default memo(
  HomeRadar,
  (before, after) =>
    before.asOf === after.asOf &&
    before.prefix === after.prefix &&
    before.demo === after.demo &&
    before.research.length === after.research.length &&
    before.research.every((item, index) => item === after.research[index]) &&
    before.requested.length === after.requested.length &&
    before.requested.every(
      (symbol, index) => symbol === after.requested[index],
    ),
);
