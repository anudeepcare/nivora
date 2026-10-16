/** Historical weekly geometry. This module performs no requests or trading actions. */
export type ResearchStructureOptions = {
  asOf?: string | number;
  mode?: 'auto' | 'manual';
  startDate?: string;
  endDate?: string;
  direction?: 'UP' | 'DOWN';
  scale?: 'linear' | 'log';
  averageType?: 'SMA' | 'WMA';
  custom686?: boolean;
};

export type ResearchWeeklyBar = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sourceEndDate: string;
};

export type ResearchAnchor = { time: string; price: number; type: 'LOW' | 'HIGH' };
export type ResearchFibLevel = { ratio: number; price: number; label: string; kind: 'ENDPOINT' | 'RETRACEMENT' | 'EXTENSION'; custom?: boolean };
export type ResearchMovingAverage = { period: 50 | 200; value: number | null; points: Array<{ time: string; value: number }> };
export type ResearchStructure = {
  weeklyBars: ResearchWeeklyBar[];
  coverage: { completedWeeks: number; firstDate: string | null; lastDate: string | null; gaps: number; invalidBars: number };
  anchors: {
    start: ResearchAnchor;
    end: ResearchAnchor;
    direction: 'UP' | 'DOWN';
    method: string;
    confirmedAt: string | null;
  } | null;
  levels: ResearchFibLevel[];
  movingAverages: { ma50: ResearchMovingAverage; ma200: ResearchMovingAverage };
  lastClose: number | null;
  lastWeek: string | null;
  warnings: string[];
  reason: string | null;
  scale: 'linear' | 'log';
  averageType: 'SMA' | 'WMA';
};

type DailyBar = Omit<ResearchWeeklyBar, 'sourceEndDate'>;
const DAY = 86_400_000;
const WEEK = 7 * DAY;
const dateString = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);

/** Require an ISO calendar date (or explicitly zoned ISO timestamp), never locale parsing. */
function timestamp(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    const parsed = value < 1e11 ? value * 1000 : value;
    return Number.isFinite(new Date(parsed).getTime()) ? parsed : null;
  }
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if (!match) return null;
  const calendar = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== value.slice(0, 10)) return null;
  const parsed = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isFinite(parsed) ? parsed : null;
}

function monday(timestampMs: number): number {
  const date = new Date(timestampMs);
  const midnight = Date.parse(`${dateString(timestampMs)}T00:00:00Z`);
  return midnight - ((date.getUTCDay() + 6) % 7) * DAY;
}

const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

function movingAverage(bars: ResearchWeeklyBar[], period: 50 | 200, type: 'SMA' | 'WMA'): ResearchMovingAverage {
  const points: ResearchMovingAverage['points'] = [];
  let consecutive = 0;
  for (let end = 0; end < bars.length; end += 1) {
    consecutive = end > 0 && Date.parse(bars[end].time) - Date.parse(bars[end - 1].time) === WEEK ? consecutive + 1 : 1;
    if (consecutive < period) continue;
    let total = 0;
    for (let offset = 0; offset < period; offset += 1) {
      total += bars[end - period + 1 + offset].close * (type === 'WMA' ? offset + 1 : 1);
    }
    const value = total / (type === 'WMA' ? period * (period + 1) / 2 : period);
    if (positive(value)) points.push({ time: bars[end].time, value });
  }
  const lastPoint = points[points.length - 1];
  const lastBar = bars[bars.length - 1];
  return { period, points, value: lastPoint && lastPoint.time === lastBar?.time ? lastPoint.value : null };
}

function manualAnchors(bars: ResearchWeeklyBar[], options: ResearchStructureOptions): { anchors: ResearchStructure['anchors']; reason: string | null } {
  const startTime = timestamp(options.startDate);
  const endTime = timestamp(options.endDate);
  if (startTime === null || endTime === null) return { anchors: null, reason: 'Choose valid start and end dates for the manual swing.' };
  const startWeek = dateString(monday(startTime));
  const endWeek = dateString(monday(endTime));
  if (startWeek >= endWeek) return { anchors: null, reason: 'The start week must precede the end week; a single week cannot define the swing.' };
  const startBar = bars.find((bar) => bar.time === startWeek);
  const endBar = bars.find((bar) => bar.time === endWeek);
  if (!startBar || !endBar) return { anchors: null, reason: 'Both manual anchor weeks must exist in the completed historical data.' };
  const direction = options.direction || 'UP';
  const start: ResearchAnchor = { time: startWeek, price: direction === 'UP' ? startBar.low : startBar.high, type: direction === 'UP' ? 'LOW' : 'HIGH' };
  const end: ResearchAnchor = { time: endWeek, price: direction === 'UP' ? endBar.high : endBar.low, type: direction === 'UP' ? 'HIGH' : 'LOW' };
  if (direction === 'UP' ? end.price <= start.price : end.price >= start.price) return { anchors: null, reason: 'The chosen anchor prices do not form a positive range in the selected direction.' };
  return { anchors: { start, end, direction, method: 'Manual weekly anchors', confirmedAt: null }, reason: null };
}

function autoAnchors(bars: ResearchWeeklyBar[]): { anchors: ResearchStructure['anchors']; reason: string | null } {
  const pivots: Array<{ anchor: ResearchAnchor; index: number }> = [];
  for (let index = 2; index < bars.length - 2; index += 1) {
    const window = bars.slice(index - 2, index + 3);
    if (window.some((bar, offset) => offset > 0 && Date.parse(bar.time) - Date.parse(window[offset - 1].time) !== WEEK)) continue;
    const candidate = bars[index];
    const peers = window.filter((_, offset) => offset !== 2);
    const isLow = peers.every((bar) => candidate.low < bar.low);
    const isHigh = peers.every((bar) => candidate.high > bar.high);
    // An outside bar can be both: daily OHLC cannot establish the ordering of those extremes.
    if (isLow === isHigh) continue;
    pivots.push({ index, anchor: { time: candidate.time, price: isLow ? candidate.low : candidate.high, type: isLow ? 'LOW' : 'HIGH' } });
  }
  for (let endIndex = pivots.length - 1; endIndex > 0; endIndex -= 1) {
    const end = pivots[endIndex];
    for (let startIndex = endIndex - 1; startIndex >= 0; startIndex -= 1) {
      const start = pivots[startIndex];
      if (start.anchor.type === end.anchor.type) continue;
      const direction = start.anchor.type === 'LOW' ? 'UP' : 'DOWN';
      if (direction === 'UP' ? end.anchor.price <= start.anchor.price : end.anchor.price >= start.anchor.price) continue;
      return {
        anchors: {
          start: start.anchor,
          end: end.anchor,
          direction,
          method: 'Latest opposite weekly pivots; 2 weeks left and 2 weeks right',
          // Under the conservative cutoff, the second right-hand week is known only on the next Monday.
          confirmedAt: dateString(Date.parse(bars[end.index + 2].time) + WEEK),
        },
        reason: null,
      };
    }
  }
  return { anchors: null, reason: 'No ordered pair of opposite weekly pivots is confirmed by two consecutive completed weeks on each side.' };
}

function fibonacci(anchors: NonNullable<ResearchStructure['anchors']>, scale: 'linear' | 'log', custom686 = false): ResearchFibLevel[] {
  const start = scale === 'log' ? Math.log(anchors.start.price) : anchors.start.price;
  const end = scale === 'log' ? Math.log(anchors.end.price) : anchors.end.price;
  const restore = (value: number): number => scale === 'log' ? Math.exp(value) : value;
  return [
    ...[0, 0.236, 0.382, 0.5, 0.618, ...(custom686 ? [0.686] : []), 0.786, 1].map((ratio): ResearchFibLevel => ({
      ratio,
      price: restore(end + (start - end) * ratio),
      label: `${ratio.toFixed(3)} · ${(ratio * 100).toFixed(1)}% ${ratio === 0 ? 'swing end' : ratio === 1 ? 'swing start' : ratio === 0.5 ? 'retracement (common convention)' : ratio === 0.686 ? 'custom retracement' : 'retracement'}`,
      kind: ratio === 0 || ratio === 1 ? 'ENDPOINT' : 'RETRACEMENT',
      ...(ratio === 0.686 ? { custom: true } : {}),
    })),
    ...[1.272, 1.618].map((ratio): ResearchFibLevel => ({
      ratio,
      price: restore(start + (end - start) * ratio),
      label: `${ratio.toFixed(3)} · ${(ratio * 100).toFixed(1)}% conditional extension`,
      kind: 'EXTENSION',
    })),
  ].filter((level) => positive(level.price));
}

/**
 * Aggregate daily bars without mutating input. Supply asOf for reproducible historical output.
 * A completed week means its UTC calendar boundary has passed; provider/session completeness
 * and split/dividend adjustments cannot be certified from OHLC observations alone.
 */
export function buildResearchStructure(input: unknown, options: ResearchStructureOptions = {}): ResearchStructure {
  const scale = options.scale === 'log' ? 'log' : 'linear';
  const averageType = options.averageType === 'WMA' ? 'WMA' : 'SMA';
  const asOf = timestamp(options.asOf === undefined ? Date.now() : options.asOf);
  const result: ResearchStructure = {
    weeklyBars: [],
    coverage: { completedWeeks: 0, firstDate: null, lastDate: null, gaps: 0, invalidBars: 0 },
    anchors: null,
    levels: [],
    movingAverages: { ma50: { period: 50, value: null, points: [] }, ma200: { period: 200, value: null, points: [] } },
    lastClose: null,
    lastWeek: null,
    warnings: ['The entire current UTC calendar week is excluded, even after Friday close; only earlier calendar weeks are used.'],
    reason: null,
    scale,
    averageType,
  };
  if (asOf === null) {
    result.reason = 'A valid as-of date is required; no historical observations were admitted.';
    return result;
  }
  const cutoff = monday(asOf);
  const daily = new Map<string, DailyBar>();
  for (const item of Array.isArray(input) ? input : []) {
    if (!item || typeof item !== 'object') { result.coverage.invalidBars += 1; continue; }
    const raw = item as Record<string, unknown>;
    const parsedTime = timestamp(raw.time === undefined ? raw.date : raw.time);
    if (parsedTime === null) { result.coverage.invalidBars += 1; continue; }
    // Reject future observations before examining their values, preserving historical prefix stability.
    if (parsedTime > asOf || monday(parsedTime) >= cutoff) continue;
    const time = dateString(parsedTime);
    const alternateTime = raw.time !== undefined && raw.date !== undefined ? timestamp(raw.date) : parsedTime;
    if (alternateTime === null || dateString(alternateTime) !== time || !positive(raw.open) || !positive(raw.high) || !positive(raw.low) || !positive(raw.close)
      || raw.high < Math.max(raw.open, raw.low, raw.close) || raw.low > Math.min(raw.open, raw.high, raw.close)
      || (raw.volume != null && (typeof raw.volume !== 'number' || !Number.isFinite(raw.volume) || raw.volume < 0))) {
      result.coverage.invalidBars += 1;
      continue;
    }
    // Last valid supplied revision wins for the same UTC day; volumes are not counted twice.
    daily.set(time, { time, open: raw.open, high: raw.high, low: raw.low, close: raw.close, volume: typeof raw.volume === 'number' ? raw.volume : 0 });
  }
  const ordered = Array.from(daily.values()).sort((a, b) => a.time.localeCompare(b.time));
  for (const bar of ordered) {
    const week = dateString(monday(Date.parse(bar.time)));
    const previous = result.weeklyBars[result.weeklyBars.length - 1];
    if (previous?.time === week) {
      previous.high = Math.max(previous.high, bar.high);
      previous.low = Math.min(previous.low, bar.low);
      previous.close = bar.close;
      previous.volume += bar.volume;
      previous.sourceEndDate = bar.time;
    } else {
      result.weeklyBars.push({ ...bar, time: week, sourceEndDate: bar.time });
    }
  }
  const bars = result.weeklyBars;
  const last = bars[bars.length - 1];
  result.coverage.completedWeeks = bars.length;
  result.coverage.firstDate = ordered[0]?.time || null;
  result.coverage.lastDate = last?.sourceEndDate || null;
  for (let index = 1; index < bars.length; index += 1) result.coverage.gaps += (Date.parse(bars[index].time) - Date.parse(bars[index - 1].time)) / WEEK - 1;
  result.lastClose = last?.close ?? null;
  result.lastWeek = last?.time ?? null;
  if (result.coverage.invalidBars) result.warnings.push(`${result.coverage.invalidBars} invalid daily observations were excluded.`);
  if (result.coverage.gaps) result.warnings.push(`${result.coverage.gaps} missing calendar weeks were not filled. A moving-average window spanning a missing week is unavailable.`);
  if (last && asOf - Date.parse(last.sourceEndDate) > 14 * DAY) result.warnings.push('Stale historical coverage: the last source observation is more than 14 days before the as-of date.');
  if (bars.length) {
    result.warnings.push('The first and last vendor weeks may be partial; daily observations alone cannot certify complete exchange-session coverage.');
    result.warnings.push('Price adjustment consistency for splits and dividends cannot be verified from these bars alone.');
  }
  result.movingAverages = { ma50: movingAverage(bars, 50, averageType), ma200: movingAverage(bars, 200, averageType) };
  for (const average of [result.movingAverages.ma50, result.movingAverages.ma200]) {
    if (average.value === null) result.warnings.push(`${average.period}-week ${averageType} unavailable: exactly ${average.period} consecutive completed calendar weeks are required at the latest observation.`);
  }
  const selection = options.mode === 'manual' ? manualAnchors(bars, options) : autoAnchors(bars);
  result.anchors = selection.anchors;
  result.reason = bars.length ? selection.reason : 'No valid completed historical weeks are available.';
  if (result.anchors) {
    result.levels = fibonacci(result.anchors, scale, options.custom686 === true);
    result.warnings.push('Extensions are conditional two-anchor geometry in the swing direction, not price predictions or probabilities.');
    if (result.levels.length < (options.custom686 ? 10 : 9)) result.warnings.push('Nonpositive or nonfinite extension prices were omitted.');
  }
  return result;
}

/** A personal overlay never replaces or changes the reproducible automatic study. */
export function buildResearchStructureStudies(input: unknown, options: ResearchStructureOptions = {}) {
  return {
    automatic: buildResearchStructure(input, { ...options, mode: 'auto' }),
    personal: options.mode === 'manual' ? buildResearchStructure(input, options) : null,
  };
}

export type ResearchSetupMarker = {
  id: string;
  ruleVersion: 'auryn-weekly-reclaim-v1';
  label: 'AURYN weekly reclaim';
  signalWeek: string;
  firstKnownAt: string;
  anchors: NonNullable<ResearchStructure['anchors']>;
  reclaimPrice: number;
  invalidationPrice: number;
  invalidation: string;
  invalidatedAt: string | null;
  conditions: string[];
};

/**
 * Replay the automatic, linear 0.618 reclaim rule, independent of personal chart settings.
 * Each prefix ends BEFORE the signal week. Anchor confirmation is therefore available at
 * that week's start; the crossing is first known only at the following UTC Monday.
 * No marker is drawn on the earlier pivot, and later pivots cannot rewrite its inputs.
 */
export function buildResearchSetupMarkers(model: ResearchStructure): ResearchSetupMarker[] {
  const bars = model.weeklyBars;
  const markers: ResearchSetupMarker[] = [];
  const signalledSwings = new Set<string>();
  for (let index = 1; index < bars.length; index += 1) {
    const current = bars[index], prior = bars[index - 1];
    const knownAt = dateString(Date.parse(current.time) + WEEK);
    for (const marker of markers) {
      if (marker.invalidatedAt === null && current.close < marker.invalidationPrice) marker.invalidatedAt = knownAt;
    }
    if (Date.parse(current.time) - Date.parse(prior.time) !== WEEK) continue;
    const anchors = autoAnchors(bars.slice(0, index)).anchors;
    if (!anchors || anchors.direction !== 'UP' || !anchors.confirmedAt || anchors.confirmedAt > current.time) continue;
    const swingKey = `${anchors.start.time}:${anchors.end.time}`;
    if (signalledSwings.has(swingKey)) continue;
    const reclaimPrice = anchors.end.price + (anchors.start.price - anchors.end.price) * .618;
    if (!(prior.close <= reclaimPrice && current.low <= reclaimPrice && current.close > reclaimPrice)) continue;
    signalledSwings.add(swingKey);
    markers.push({
      id: `auryn-weekly-reclaim-v1:${swingKey}:${current.time}`,
      ruleVersion: 'auryn-weekly-reclaim-v1', label: 'AURYN weekly reclaim',
      signalWeek: current.time, firstKnownAt: knownAt, anchors, reclaimPrice,
      invalidationPrice: anchors.start.price,
      invalidation: `A subsequent completed weekly close below ${anchors.start.price} invalidates this chart setup.`,
      invalidatedAt: null,
      conditions: [
        'An upward pair of automatic pivots, each with two consecutive completed weeks on both sides, was known before the signal week began.',
        'The immediately preceding weekly close was at or below the fixed linear 0.618 (61.8%) retracement.',
        'The signal week traded at or below that level and closed above it; both weeks are consecutive.',
        'Only the first qualifying reclaim per anchor pair is recorded. The signal is first known at the next UTC Monday, never on the earlier pivot.',
      ],
    });
  }
  return markers;
}
