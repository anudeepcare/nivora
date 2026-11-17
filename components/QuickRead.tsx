import type { ReactNode } from "react";
import { Diamond, Info, TrendingUp, ShieldCheck } from "lucide-react";
import s from "./QuickRead.module.css";
export type QuickReadItem = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "positive" | "caution" | "neutral" | "pace";
};
export default function QuickRead({
  title = "At a glance",
  items,
}: {
  title?: string;
  items: QuickReadItem[];
}) {
  if (!items.length) return null;
  return (
    <section className={s.root} aria-label={title}>
      <h3>{title}</h3>
      <div className={s.grid}>
        {items.map(({ label, value, detail, tone = "neutral" }) => {
          const Icon =
            tone === "pace"
              ? Diamond
              : tone === "positive"
                ? TrendingUp
                : tone === "caution"
                  ? ShieldCheck
                  : Info;
          return (
            <article key={label} data-tone={tone}>
              <span className={s.icon}>
                <Icon
                  size={18}
                  fill={tone === "pace" ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </span>
              <div>
                <span className={s.label}>{label}</span>
                <strong>{value}</strong>
                {detail && <p>{detail}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
