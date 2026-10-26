"use client";
import { useProduct } from "./Session";
import { pricePath } from "@/lib/position-explorer";
import type { Research, Candle } from "@/lib/types";

export default function CompanySparkline({ symbol }: { symbol: string }) {
  const { demo, cache } = useProduct();
  // Reuse already loaded research. Home must not fan out dozens of expensive research requests.
  const cached = cache.get(
    `research/${encodeURIComponent(symbol.replace("/", "-"))}`,
  )?.value as Research | undefined;
  const alternate = cache.get(`research:${symbol}`)?.value as
    | Research
    | undefined;
  const history: Candle[] =
    demo?.research[symbol]?.history ??
    cached?.history ??
    alternate?.history ??
    [];
  const line = pricePath(history);
  if (!line)
    return <span className="company-spark-empty">History not loaded</span>;
  return (
    <svg
      className="company-spark"
      viewBox="0 0 112 38"
      role="img"
      aria-label={`${symbol} price history ${line.from} to ${line.through}`}
      data-direction={line.direction}
    >
      <path
        d={line.path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
