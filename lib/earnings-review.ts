export function earningsReview(
  rows: {
    date: string;
    period: string;
    actual: number | null;
    estimate: number | null;
  }[],
  day: string,
) {
  const latest = rows
    .filter(
      (e) =>
        /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
        Number.isFinite(Date.parse(e.date)) &&
        e.date <= day,
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return null;
  const actual =
    typeof latest.actual === "number" && Number.isFinite(latest.actual)
      ? latest.actual
      : null;
  const estimate =
    typeof latest.estimate === "number" && Number.isFinite(latest.estimate)
      ? latest.estimate
      : null;
  const surprise =
    actual !== null && estimate !== null && estimate !== 0
      ? ((actual - estimate) / Math.abs(estimate)) * 100
      : null;
  return {
    ...latest,
    actual,
    estimate,
    surprise,
    reported: actual !== null,
    label:
      actual === null
        ? "Results not confirmed"
        : estimate === null
          ? "Estimate unavailable"
          : actual > estimate
            ? "EPS above the supplied estimate"
            : actual < estimate
              ? "EPS below the supplied estimate"
              : "EPS matched the supplied estimate",
  };
}

type ThesisPeriod = {end:string;currency:string;basis:string;revenue?:number|null;margin?:number|null;weightedShares?:number|null};
/** Descriptive comparisons only; caller supplies comparable annual/TTM periods. */
export function earningsThesisChecks(latest:ThesisPeriod|null|undefined,prior:ThesisPeriod|null|undefined){
 if(!latest||!prior||latest.currency!==prior.currency||latest.basis!==prior.basis||latest.end<=prior.end)return [];
 const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
 const rows:string[]=[];
 if(finite(latest.revenue)&&finite(prior.revenue)&&prior.revenue>0)rows.push(`Revenue changed ${((latest.revenue/prior.revenue-1)*100).toFixed(1)}% versus the comparable period. Revisit your demand assumptions.`);
 if(finite(latest.margin)&&finite(prior.margin))rows.push(`Operating margin changed ${(latest.margin-prior.margin).toFixed(1)} percentage points. Revisit pricing and cost assumptions.`);
 if(finite(latest.weightedShares)&&finite(prior.weightedShares)&&prior.weightedShares>0)rows.push(`Weighted shares changed ${((latest.weightedShares/prior.weightedShares-1)*100).toFixed(1)}%. Revisit per-share growth and dilution assumptions.`);
 return rows;
}
