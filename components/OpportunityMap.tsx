"use client";
import Link from "next/link";
import type { Research } from "@/lib/types";
import { opportunityMap } from "@/lib/opportunity-map";
import styles from "./OpportunityMap.module.css";

export default function OpportunityMap({
  research,
  requested,
  prefix = "",
  demo = false,
  onSector,
}: {
  research: Research[];
  requested: string[];
  prefix?: string;
  demo?: boolean;
  onSector?: (sector: string) => void;
}) {
  const map = opportunityMap(
    research,
    requested,
    demo && research[0] ? Date.parse(research[0].retrievedAt) : Date.now(),
  );
  return (
    <section className={styles.map} aria-label="Opportunity map">
      <header>
        <div>
          <span className={styles.eyebrow}>YOUR RESEARCH UNIVERSE</span>
          <h2>Opportunity map</h2>
        </div>
        {!onSector && (
          <Link href={`${prefix}/discover`}>Explore Discover ↗</Link>
        )}
      </header>
      <p className={styles.note}>
        {demo ? "Illustrative data · " : ""}
        {map.covered} of {map.requested} selected companies have loaded
        research.{" "}
        {map.oldest
          ? `Evidence retrieved ${map.oldest.slice(0, 10)}${map.newest?.slice(0, 10) !== map.oldest.slice(0, 10) ? ` – ${map.newest?.slice(0, 10)}` : ""}.`
          : "No research loaded yet."}{" "}
        This is your selected universe, not the whole market.
      </p>
      {map.sectors.length ? (
        <div className={styles.grid}>
          {map.sectors.map((group) => (
            <article key={group.sector} className={styles.tile}>
              {onSector ? (
                <button type="button" onClick={() => onSector(group.sector)}>
                  {group.sector} ↗
                </button>
              ) : (
                <h3>{group.sector}</h3>
              )}
              <strong>
                {group.zones}
                <small> / {group.total} in P2–P4</small>
              </strong>
              <div className={styles.bar} aria-hidden="true">
                <span
                  style={{ width: `${(100 * group.zones) / group.total}%` }}
                />
              </div>
              <p>{group.cash} with positive free cash flow</p>
              {group.blocked > 0 && (
                <p>{group.blocked} P2–P4 zones require business review</p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <strong>A map begins with evidence.</strong>
          <p>
            Screen companies in Discover to see their supported sectors, cash
            generation and confirmed Pace zones.
          </p>
          <Link href={`${prefix}/discover`}>Screen your companies ↗</Link>
        </div>
      )}
      {map.covered > 0 && (
        <p className={styles.note}>
          {map.missingPace} without a confirmed Pace. Sector labels come from
          company metadata; absent sectors stay unclassified. P2–P4 describes
          price zones, not business quality or a forecast. Business checks can
          block additions within those zones.
        </p>
      )}
    </section>
  );
}
