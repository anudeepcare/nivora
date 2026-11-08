/** Eight measured lenses. A missing value has a neutral facet, never a zero score. */
export function crystalFacets(scores: readonly (number | null)[]) {
  const vertices = Array.from({ length: 8 }, (_, i) => {
    const raw = scores[i];
    const score =
      raw != null && Number.isFinite(raw)
        ? Math.max(0, Math.min(10, raw))
        : null;
    const radius = score === null ? 66 : 66 + score * 7;
    const angle = -Math.PI / 2 + (i * Math.PI) / 4;
    return {
      score,
      measured: score !== null,
      radius,
      point: [
        160 + Math.cos(angle) * radius,
        160 + Math.sin(angle) * radius,
      ] as [number, number],
    };
  });
  return vertices.map((v, i) => ({
    ...v,
    points: [[160, 160], v.point, vertices[(i + 1) % 8].point] as [
      number,
      number,
    ][],
  }));
}
