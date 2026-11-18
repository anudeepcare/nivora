/** Bounded account reads: retain the 1,001st row so callers can reject overflow. */
export async function readRadarPages<T>(
  read: (from: number, to: number) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let requests = 0; requests < 32; requests++) {
    const from = rows.length;
    const to = Math.min(from + 499, 1000);
    const page = await read(from, to);
    // PostgREST may cap a requested range below 500. Only an empty result
    // proves exhaustion; advance by received rows so no records are skipped.
    if (!page.length) return rows;
    if (page.length > to - from + 1)
      throw new Error("Daily radar database returned an invalid page limit.");
    rows.push(...page);
    if (rows.length === 1001) return rows;
  }
  // Never report a partially read account as complete under a tiny server cap.
  throw new Error("Daily radar database page limit prevented a complete read.");
}
