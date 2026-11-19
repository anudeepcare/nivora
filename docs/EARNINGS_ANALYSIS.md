# Earnings analysis in the existing calendar

The Earnings view now offers Upcoming calendar, Recently reported, Weekly statistics, and Ranked earnings. Only the selected view mounts and requests data. Existing calendar behavior remains available.

## Provider contracts

Official reference: https://sentisense.ai/docs/api/earnings/

Fixed, bounded requests only:
- `earnings/recent?days=7&limit=25`
- `earnings/statistics?window=last_completed_week`
- `earnings/ranked?reportedDays=14&reportedLimit=12&upcomingDays=7&upcomingLimit=12`

The private route requires an authenticated non-sample account with overview, analysts, and news access. Requests use the existing server-side SentiSense key, user and provider quotas, a 12-second timeout, a 2 MB response limit, and no redirects. No additional environment variable or migration is required.

## Interpretation and limits

Dates and counts are validated, canonical ticker identity is retained, malformed/duplicate rows are omitted with a visible count, and fiscal period distinguishes same-day reports. Ranked preview limits are respected and clearly labeled. Source order is preserved, not converted into investment recommendations. No proprietary score or invented currency is shown. EPS is source per-share data and its accounting/currency comparability is not supplied.

Statistics distinguish classified events, measured reactions, pending reactions, and unavailable reaction coverage. Rates use their documented denominators; insufficient samples suppress rates. Final, provisional, and extended-hours reactions are distinct. Sign-flip/outsize or inconsistent EPS surprise percentages are withheld.

The client retains selected-view results for five minutes. Source timestamps and retrieval timestamps are separate; a loaded view may be older. This is not a live feed, an exhaustive global calendar, or proof of API entitlement. Provider responses and rendered browser behavior were not verified live.

Validation includes pure schema regressions, actual route-to-server-to-projection-to-render tests, authorization/query/size/error cases, and the existing calendar tests. The independent source review covers this bounded scope, not every provider API.
