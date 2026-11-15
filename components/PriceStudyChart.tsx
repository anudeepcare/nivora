"use client";
import { useEffect, useMemo, useState } from "react";
import { Layers, ArrowRight, Info } from "lucide-react";
import { studyMarket } from "@/lib/settled-study-bars";
import { indicators } from "@/lib/analysis";
import { consensusOutlook } from "@/lib/outlook";
import { useProduct } from "./Session";
import { researchBrief } from "@/lib/research-brief";
import { paceChartBands, currentPaceChartPeriod } from "@/lib/pace-chart-bands";
import type { PacePriceZones } from "@/lib/pace-price-zones";
import s from "./ChartReferences.module.css";
import { advancedStudies } from "@/lib/advanced-research";
import type { Research, Candle } from "@/lib/types";
import { amount, dateLabel } from "@/lib/format";
import { PriceChart } from "./Charts";
import StockFacts from "./StockFacts";
import { Help } from "./Ui";

export default function PriceStudyChart({
  research,
  bars,
  range,
  style,
  contrast,
  onOptions,
}: {
  research: Research;
  bars: Candle[];
  range: string;
  style: "line" | "candles";
  contrast?: boolean;
  onOptions?: () => void;
}) {
  const { demo } = useProduct();
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    if (demo) return;
    const timer = window.setInterval(() => setClock(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [demo]);
  const asOf = demo ? research.retrievedAt : new Date(clock).toISOString();
  const selectedPeriod = useMemo(
    () =>
      currentPaceChartPeriod(
        researchBrief(research).accumulation,
        Date.parse(asOf),
      ),
    [research, asOf],
  );
  const [zoneResult, setZoneResult] = useState<{
    history: Candle[];
    asOf: string;
    zones: PacePriceZones | null;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const market = studyMarket(research);
    if (market === "unknown" || !selectedPeriod) return;
    import("@/lib/pace-price-zones")
      .then(({ pacePriceZones }) =>
        pacePriceZones(
          research.history,
          research.priceObservedAt ?? research.retrievedAt,
          selectedPeriod,
          market,
          controller.signal,
        ),
      )
      .then((zones) => {
        if (!controller.signal.aborted)
          setZoneResult({ history: research.history, asOf, zones });
      })
      .catch(() => {
        if (!controller.signal.aborted) setZoneResult(null);
      });
    return () => controller.abort();
  }, [research, asOf, selectedPeriod]);
  const bands = useMemo(
    () =>
      paceChartBands(
        selectedPeriod &&
          zoneResult?.history === research.history &&
          zoneResult.asOf === asOf
          ? zoneResult.zones
          : null,
        asOf,
      ),
    [zoneResult, research.history, asOf, selectedPeriod],
  );
  const [overlay, setOverlay] = useState(false);
  const [showReferences, setShowReferences] = useState(true);
  const references = useMemo(() => {
    const tech = indicators(
      research.history,
      research.retrievedAt,
      studyMarket(research),
    );
    const target = consensusOutlook(research);
    return [
      ...(target
        ? [{ label: "Analyst target", price: target.target, color: "#d56b13" }]
        : []),
      ...(tech.ma50 != null
        ? [{ label: "50-session", price: tech.ma50, color: "#54698f" }]
        : []),
      ...(tech.ma200 != null
        ? [{ label: "200-session", price: tech.ma200, color: "#8290ad" }]
        : []),
    ];
  }, [research]);
  const fib = useMemo(
    () =>
      overlay
        ? advancedStudies(
            research.history,
            research.retrievedAt,
            studyMarket(research),
          ).fib
        : null,
    [overlay, research],
  );
  const levels = useMemo(
    () =>
      fib?.levels.map((level) => ({
        label: `${(level.ratio * 100).toFixed(1)}%`,
        price: level.price,
      })) ?? [],
    [fib],
  );
  return (
    <>
      <PriceChart
        bars={bars}
        range={range}
        style={style}
        contrast={contrast}
        levels={overlay ? levels : showReferences ? references : []}
        paceBands={overlay ? [] : bands}
      />
      <div className="signal-chart-tools">
        <button
          className="btn"
          aria-label="Fibonacci levels"
          aria-pressed={overlay}
          onClick={() => setOverlay(!overlay)}
        >
          <Layers size={15} /> Fibonacci
        </button>
        <Help
          label="Price reference levels"
          trigger={
            <>
              <Info size={15} />
            </>
          }
        >
          Fibonacci levels divide a historical price range into reference
          points. They are not forecasts or confirmed support. The automatic
          calculation uses the last 63 valid completed daily observations;
          changing the chart period does not change those anchors. Open
          Technicals for custom anchors, moving averages, momentum, volatility
          and volume studies.
        </Help>
        {onOptions && (
          <button className="text-link" onClick={onOptions}>
            Gamma & options <ArrowRight size={15} />
          </button>
        )}
      </div>
      {!overlay && references.length > 0 && (
        <div className={s.references} aria-label="Chart references">
          <button
            type="button"
            aria-pressed={showReferences}
            onClick={() => setShowReferences(!showReferences)}
          >
            {showReferences ? "Hide" : "Show"} references
          </button>
          {showReferences &&
            references.map((row) => (
              <span key={row.label}>
                <i style={{ background: row.color }} />
                {row.label} {amount(row.price, research.quote.currency)}
              </span>
            ))}
        </div>
      )}
      {!overlay && bands.length > 0 && (
        <span className="chart-note">
          Blue bands · Pace zones{" "}
          <Help label="Pace zone details">
            As of {dateLabel(zoneResult?.zones?.date)}. Deeper blue indicates a
            higher conditional accumulation zone, not historical signals or a
            recommendation.
          </Help>
        </span>
      )}
      <details className="chart-context">
        <summary>Price & volume details</summary>
        <StockFacts research={research} priceContext />
      </details>
      {overlay && (
        <p className="signal-fib-caption">
          {fib
            ? `Range ${amount(fib.low, research.quote.currency)} (${dateLabel(fib.lowDate)}) to ${amount(fib.high, research.quote.currency)} (${dateLabel(fib.highDate)}). ${fib.direction === "up" ? "Pullbacks measured down from high." : "Rebounds measured up from low."}`
            : "More completed history and distinct price extremes are required for this overlay."}
        </p>
      )}
    </>
  );
}
