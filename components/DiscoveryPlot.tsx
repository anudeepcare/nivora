import Link from "next/link";
import { discoveryPlot } from "@/lib/discovery-plot";
import styles from "./DiscoveryPlot.module.css";
export default function DiscoveryPlot({
  rows,
  prefix,
}: {
  rows: Parameters<typeof discoveryPlot>[0];
  prefix: string;
}) {
  const plot = discoveryPlot(rows);
  return (
    <section className={styles.map} aria-label="Company evidence map">
      <header>
        <span>YOUR SELECTED UNIVERSE</span>
        <h2>Where growth meets cash generation</h2>
        <p>
          Annual revenue growth and free-cash-flow margin. These are reported
          financial metrics, not a valuation or quality score.
        </p>
      </header>
      <div className={styles.plot}>
        {plot.points.map((p) => (
          <Link
            key={p.symbol}
            href={`${prefix}/research/${encodeURIComponent(p.symbol)}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            aria-label={`${p.symbol}: revenue growth ${p.growth!.toFixed(1)}%, cash margin ${p.margin.toFixed(1)}%, ${p.pace}`}
            title={`${p.symbol} · Growth ${p.growth!.toFixed(1)}% · FCF margin ${p.margin.toFixed(1)}%`}
          >
            <b>{p.symbol}</b>
            <small>{p.pace === "unavailable" ? "No Pace" : p.pace}</small>
          </Link>
        ))}
        {!plot.points.length && (
          <p className={styles.empty}>
            Screen companies to plot comparable annual growth and cash
            generation. Missing evidence stays off the chart.
          </p>
        )}
        <span className={styles.x}>
          REVENUE GROWTH → {plot.x[0].toFixed(0)}% to {plot.x[1].toFixed(0)}%
        </span>
        <span className={styles.y}>FCF MARGIN →</span>
      </div>
      <footer>
        {plot.points.length} plotted · {plot.omitted} omitted for incomplete
        metrics. Equal-size markers; axes rescale to the selected companies.
        Exact values remain in the results below.
      </footer>
    </section>
  );
}
