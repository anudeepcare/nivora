"use client";
import { useMemo, useState } from "react";
import { Layers, ArrowRight, Info } from "lucide-react";
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
  const [overlay, setOverlay] = useState(false);
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
      <PriceChart
        bars={bars}
        range={range}
        style={style}
        contrast={contrast}
        levels={levels}
      />
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
