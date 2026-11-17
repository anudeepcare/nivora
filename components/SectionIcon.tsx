import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarDays,
  Layers3,
  Scale,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
/** Decorative section cues; the adjacent heading carries the accessible name. */
export default function SectionIcon({
  name,
  size = 18,
}: {
  name: string;
  size?: number;
}) {
  const key = name.toLowerCase();
  const Icon =
    /valuation|value|price in context|scenario|percentile|median/.test(key)
      ? Scale
      : /trend|growth/.test(key)
        ? TrendingUp
        : /momentum|volatility|cash.flow/.test(key)
          ? Activity
          : /portfolio|market cap|holding/.test(key)
            ? Wallet
            : /earning|event|today/.test(key)
              ? CalendarDays
              : /risk|quality|evidence/.test(key)
                ? ShieldCheck
                : /reference|fibonacci|option/.test(key)
                  ? Layers3
                  : /business|research/.test(key)
                    ? BookOpen
                    : BarChart3;
  return (
    <Icon
      size={size}
      aria-hidden="true"
      className="section-symbol"
      strokeWidth={1.7}
    />
  );
}
