/** Diagram coordinates encode only the reference and case price, never a time series. */
export function scenarioGeometry(
  target: number,
  reference: number,
  scale: { min: number; max: number },
) {
  if (
    ![target, reference, scale.min, scale.max].every(Number.isFinite) ||
    scale.max <= scale.min
  )
    return null;
  const y = (value: number) =>
    100 -
    84 *
      Math.max(0, Math.min(1, (value - scale.min) / (scale.max - scale.min)));
  const referenceY = y(reference),
    targetY = y(target);
  return {
    referenceY,
    targetY,
    area: `18,${referenceY} 282,${targetY} 282,${referenceY}`,
  };
}
