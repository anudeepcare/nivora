import type { OptionContract } from "./options-analysis";

export type VannaAssumptions = { riskFree?: number; dividendYield?: number };
type VannaInput = VannaAssumptions & {
  spot: number;
  strike: number;
  iv: number;
  years: number;
};
const positive = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0;
const yearMs = 365.25 * 86400000;

/** Spot-delta sensitivity per absolute unit of decimal IV, shared by calls and puts.
 * European Black–Scholes with continuous dividend yield: -exp(-qT) φ(d1)d2/σ.
 * Formula reference: OpenGamma Strata BlackScholesFormulaRepository.vanna;
 * https://strata.opengamma.io/apidocs/com/opengamma/strata/pricer/impl/option/BlackScholesFormulaRepository.html
 */
export function blackScholesVanna({
  spot,
  strike,
  iv,
  years,
  riskFree = 0.04,
  dividendYield = 0,
}: VannaInput): number | null {
  if (
    ![spot, strike, iv, years].every(positive) ||
    !Number.isFinite(riskFree) ||
    !Number.isFinite(dividendYield)
  )
    return null;
  const rootT = Math.sqrt(years);
  const d1 =
    (Math.log(spot / strike) +
      (riskFree - dividendYield + (iv * iv) / 2) * years) /
    (iv * rootT);
  const d2 = d1 - iv * rootT;
  const value =
    (((-Math.exp(-dividendYield * years) * Math.exp((-d1 * d1) / 2)) /
      Math.sqrt(2 * Math.PI)) *
      d2) /
    iv;
  return Number.isFinite(value) ? value : null;
}
function dateOnly(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
    ? time
    : null;
}
function asOfTime(value: string): number | null {
  if (dateOnly(value.slice(0, 10)) === null) return null;
  // Date-only values explicitly mean 00:00 UTC; timestamps must include a timezone.
  if (
    value.length !== 10 &&
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  )
    return null;
  const time = Date.parse(value.length === 10 ? value + "T00:00:00Z" : value);
  return Number.isFinite(time) ? time : null;
}
export type VannaCell = {
  strike: number;
  expiry: string;
  call: number | null;
  put: number | null;
  net: number | null;
  observedDates: string[];
  modeled: number;
  total: number;
  reason: string | null;
};
/** Signed convention only: calls +, puts −; this is not observed dealer positioning.
 * Expiration uses 21:00 UTC as a modeling approximation, not official settlement.
 * An incomplete/mixed-date cell has no net; unobserved contracts are never implied.
 */
export function modelVannaMap(
  contracts: OptionContract[],
  spot: number,
  asOf: string,
  options: VannaAssumptions = {},
) {
  const assumptions = {
    riskFree: options.riskFree ?? 0.04,
    dividendYield: options.dividendYield ?? 0,
  };
  const eligible = contracts.filter((c) => c.standard && c.multiplier === 100);
  const time = asOfTime(asOf);
  const groups = new Map<string, OptionContract[]>();
  for (const c of eligible) {
    const key = `${c.expiry}|${c.strike}`;
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  const cells: VannaCell[] = [...groups.values()]
    .map((rows) => {
      const { strike, expiry } = rows[0];
      const observedDates = [...new Set(rows.map((c) => c.observed))].sort();
      const mixed = observedDates.length !== 1;
      const expiryDate = dateOnly(expiry);
      const years =
        time !== null && expiryDate !== null
          ? (expiryDate + 21 * 3600000 - time) / yearMs
          : 0;
      const values = rows.map((c) => {
        const observation = dateOnly(c.observed);
        if (
          mixed ||
          time === null ||
          observation === null ||
          observation > time ||
          c.oi === null ||
          !Number.isFinite(c.oi) ||
          c.oi < 0 ||
          c.iv === null
        )
          return null;
        const vanna = blackScholesVanna({
          spot,
          strike: c.strike,
          iv: c.iv,
          years,
          ...assumptions,
        });
        if (vanna === null) return null;
        const value =
          (c.type === "call" ? 1 : -1) * vanna * c.oi * 100 * spot * 0.01;
        return Number.isFinite(value) ? (value === 0 ? 0 : value) : null;
      });
      const side = (type: "call" | "put") => {
        const indices = rows.flatMap((c, i) => (c.type === type ? [i] : []));
        return !indices.length || indices.some((i) => values[i] === null)
          ? null
          : indices.reduce((sum, i) => sum + values[i]!, 0);
      };
      const modeled = values.filter((v) => v !== null).length;
      const net =
        modeled === rows.length
          ? values.reduce<number>((sum, v) => sum + v!, 0)
          : null;
      return {
        strike,
        expiry,
        call: side("call"),
        put: side("put"),
        net,
        observedDates,
        modeled,
        total: rows.length,
        reason: mixed
          ? "Mixed source dates"
          : modeled !== rows.length
            ? "Missing or invalid IV, OI, spot, date or time to expiry"
            : null,
      };
    })
    .sort((a, b) => a.strike - b.strike || a.expiry.localeCompare(b.expiry));
  const modeled = cells.reduce((sum, c) => sum + c.modeled, 0);
  return {
    cells,
    assumptions,
    asOf,
    eligible: eligible.length,
    excluded: contracts.length - eligible.length,
    modeled,
    coverage: eligible.length ? modeled / eligible.length : 0,
    observedDates: [...new Set(eligible.map((c) => c.observed))].sort(),
    expiries: [...new Set(cells.map((c) => c.expiry))].sort(),
    strikes: [...new Set(cells.map((c) => c.strike))].sort((a, b) => a - b),
  };
}
