export function secObservations(
  taxonomy: Record<string, any> | undefined,
  names: string[],
) {
  const chosen = new Map<string, { tag: string; unit: string; row: any }>();
  for (const tag of names)
    for (const [unit, observations] of Object.entries(
      taxonomy?.[tag]?.units ?? {},
    ))
      for (const row of observations as any[]) {
        if (row.val == null || !Number.isFinite(Number(row.val))) continue;
        const key = [
          unit,
          row.start ?? "",
          row.end,
          row.accn,
          row.form,
          row.filed,
        ].join("|");
        if (!chosen.has(key)) chosen.set(key, { tag, unit, row });
      }
  return [...chosen.values()];
}
