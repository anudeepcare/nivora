"use client";
import { useId } from "react";
import { scenarioGeometry } from "@/lib/scenario-geometry";

export default function ScenarioSensitivity({
  target,
  reference,
  scale,
  label,
  className,
}: {
  target: number;
  reference: number;
  scale: { min: number; max: number };
  label: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const geometry = scenarioGeometry(target, reference, scale);
  if (!geometry) return null;
  const { referenceY, targetY, area } = geometry;
  return (
    <svg
      className={className}
      viewBox="0 0 300 132"
      role="img"
      aria-label={`${label}. Shared vertical price scale. Shaded reference-to-case sensitivity diagram, not a predicted time path.`}
    >
      <defs>
        <linearGradient id={`case-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".04" />
          <stop offset="100%" stopColor="currentColor" stopOpacity=".32" />
        </linearGradient>
      </defs>
      {[16, 44, 72, 100].map((y) => (
        <line
          key={y}
          x1="18"
          x2="282"
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeOpacity=".10"
        />
      ))}
      <line
        x1="18"
        x2="18"
        y1="12"
        y2="104"
        stroke="currentColor"
        strokeOpacity=".18"
      />
      <polygon points={area} fill={`url(#case-${id})`} />
      <line
        x1="18"
        x2="282"
        y1={referenceY}
        y2={referenceY}
        stroke="var(--muted)"
        strokeOpacity=".55"
        strokeDasharray="3 5"
      />
      <line
        x1="282"
        x2="282"
        y1={referenceY}
        y2={targetY}
        stroke="currentColor"
        strokeOpacity=".4"
        strokeWidth="1.5"
      />
      <line
        x1="18"
        x2="282"
        y1={referenceY}
        y2={targetY}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle
        cx="18"
        cy={referenceY}
        r="4"
        fill="var(--card, var(--surface))"
        stroke="var(--muted)"
        strokeWidth="2"
      />
      <circle
        cx="282"
        cy={targetY}
        r="8"
        fill="currentColor"
        fillOpacity=".14"
      />
      <circle cx="282" cy={targetY} r="4" fill="currentColor" />
      <text x="18" y="123" fill="var(--muted)" fontSize="10">
        Reference
      </text>
      <text x="282" y="123" fill="currentColor" fontSize="10" textAnchor="end">
        Case price
      </text>
    </svg>
  );
}
