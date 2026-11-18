export type JourneyPoint = {
  date: string;
  value: number | null;
  currency: string | null;
  basis: string;
};
export function journeyGrowth(points: JourneyPoint[]) {
  const a = points.at(-2),
    b = points.at(-1);
  if (
    !a ||
    !b ||
    !a.currency ||
    a.currency !== b.currency ||
    a.basis !== b.basis ||
    a.value == null ||
    b.value == null ||
    !Number.isFinite(a.value) ||
    !Number.isFinite(b.value) ||
    a.value <= 0
  )
    return null;
  const days = (Date.parse(b.date) - Date.parse(a.date)) / 86400000;
  return days >= 330 && days <= 400
    ? Math.round((b.value / a.value - 1) * 1000) / 10
    : null;
}
export function journeyPlot(points: JourneyPoint[]) {
  // Preserve chronological input; reject duplicate/backwards dates instead of
  // reordering them into a seemingly valid annual series.
  let lastTime = -Infinity;
  const times = points.map((p) => {
    const time = Date.parse(p.date);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
      !Number.isFinite(time) ||
      new Date(time).toISOString().slice(0, 10) !== p.date ||
      time <= lastTime
    )
      return null;
    lastTime = time;
    return time;
  });
  const dated = times.filter((t): t is number => t !== null);
  const start = Math.min(...dated),
    end = Math.max(...dated);
  const valid = (p: JourneyPoint, i: number) =>
    times[i] !== null &&
    !!p.currency &&
    /^[A-Z]{3}$/.test(p.currency) &&
    p.value !== null &&
    Number.isFinite(p.value);
  const values = points.flatMap((p, i) => (valid(p, i) ? [p.value!] : []));
  const low = Math.min(0, ...values),
    high = Math.max(0, ...values),
    spread = high - low || 1;
  const dots: { x: number; y: number; index: number }[] = [],
    segments: string[][] = [];
  let segment: string[] = [];
  const breakPath = () => {
    if (segment.length) segments.push(segment);
    segment = [];
  };
  points.forEach((p, index) => {
    if (!valid(p, index)) {
      breakPath();
      return;
    }
    const previous = points[index - 1],
      previousTime = times[index - 1];
    const days =
      previousTime == null ? null : (times[index]! - previousTime) / 86400000;
    if (
      days === null ||
      days < 330 ||
      days > 400 ||
      previous.currency !== p.currency ||
      previous.basis !== p.basis
    )
      breakPath();
    const x =
      start === end
        ? 200
        : 24 + ((times[index]! - start) / (end - start)) * 352;
    const y = 132 - ((p.value! - low) / spread) * 108;
    dots.push({ x, y, index });
    segment.push(`${x},${y}`);
  });
  breakPath();
  return { dots, segments, zeroY: 132 - ((0 - low) / spread) * 108 };
}
