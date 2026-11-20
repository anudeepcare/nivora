"use client";
import { useMemo, useState, type ReactNode } from "react";
import { Layers, ArrowRight, Info } from "lucide-react";
import { indicators } from "@/lib/analysis";
import { consensusOutlook } from "@/lib/outlook";
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
  controls,
}: {
  research: Research;
  bars: Candle[];
  range: string;
  style: "line" | "candles";
  contrast?: boolean;
  onOptions?: () => void;
  controls?: ReactNode;
}) {
  const [overlay, setOverlay] = useState(false);
  const [showReferences, setShowReferences] = useState(true);
  const references = useMemo(() => {
    const tech = indicators(
      research.history,
      research.priceObservedAt ?? research.retrievedAt,
    );
    const target = consensusOutlook(research);
    return [
      ...(target
        ? [{ label: "Analyst target", price: target.target, color: "#8b6bc1" }]
        : []),
      ...(tech.ma50 != null
        ? [{ label: "50-session", price: tech.ma50, color: "#328b94" }]
        : []),
      ...(tech.ma200 != null
        ? [{ label: "200-session", price: tech.ma200, color: "#b87b23" }]
        : []),
    ];
  }, [research]);
  const fib = useMemo(
    () =>
      overlay
        ? advancedStudies(research.history, research.retrievedAt).fib
        : null,
    [overlay, research.history, research.retrievedAt],
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
      <div className={`signal-chart-tools ${s.tools}`}>
        {controls}
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
        {!overlay && references.length > 0 && (
          <button
            type="button"
            className="btn"
            aria-pressed={showReferences}
            onClick={() => setShowReferences((shown) => !shown)}
          >
            Reference lines
          </button>
        )}
        {onOptions && (
          <button className="text-link" onClick={onOptions}>
            Gamma & options <ArrowRight size={15} />
          </button>
        )}
      </div>
      <PriceChart
        bars={bars}
        range={range}
        style={style}
        contrast={contrast}
        compactLevelTitles={!overlay}
        levels={overlay ? levels : showReferences ? references : []}
      />
      {!overlay && references.length > 0 && (
        <details className={s.referenceDetails} open>
          <summary>
            Reference prices{!showReferences && " · not plotted"}
          </summary>
          <div className={s.references} aria-label="Chart references">
            {references.map((row) => (
              <span key={row.label}>
                <i style={{ background: row.color }} />
                {row.label} {amount(row.price, research.quote.currency)}
              </span>
            ))}
          </div>
        </details>
      )}
      <details className="chart-context" open>
        <summary>Price range & completed volume</summary>
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
