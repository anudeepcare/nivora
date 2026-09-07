# AURYN V5.1 Pro Reliability Release

Release date: 2026-09-07
Engine: `auryn-v5.1-pro-reliability-1`
Domain: `auryn-v5-domain-1`

V5.1 is a reliability hardening release for the V5 Decision OS. It fixes the classes of defects exposed by production screenshots without adding ticker-specific exceptions.

## Market Truth corrections

- Closed/holiday sessions resolve the latest completed regular close rather than presenting a provider `previous_close` field as the current close.
- The daily percentage change and displayed close are derived from compatible completed-session semantics.
- Canonical market snapshots carry a separate `decisionPriceAsOf` timestamp so request time is never presented as the price timestamp.
- Unverified/stale/disagreeing prices continue to fail closed for price-sensitive research and paper execution.

## Decision and execution-plan consistency

- The headline represents the actionable current CIO posture; long-term 6–12M and 3–5Y conviction may remain stronger without manufacturing a current Strong Buy.
- `STRONG_BUY` requires high numerical decision confidence; medium-confidence analysis is capped below Strong Buy.
- HOLD / DO NOT CHASE no longer publishes active DCA instructions. It publishes structural watch/reclaim/break levels instead.
- REDUCE/SELL never publishes averaging tiers.
- Active DCA tiers are allowed only for accumulation decisions with decision-grade valuation and verified Market Truth.
- Initial entry, DCA tiers, confirmation, invalidation and targets are ordered and owned by one canonical V5 `ExecutionPlan`.
- The stock toolbar and technical chart consume the same V5 plan instead of separately calculated legacy support/resistance or DCA zones.

## Global professional formatting

- Central metric formatting removes raw floating-point output such as `13.210369719590044` and `99.3617338041066%`.
- Scores render as rounded integer `/100` values.
- RSI, ADX, DMI, stochastic, CCI, MFI, ROC and similar indicators use human-readable precision.
- CMF, MACD histogram, ratios, percentages, prices and multipliers use metric-appropriate precision.
- Ichimoku `-1/0/1` is rendered as `Below cloud / Inside cloud / Above cloud`.
- One shared score-band vocabulary is used across V5 Thesis, Business and fallback stock-summary surfaces: Strong >=75, Good >=60, Mixed >=45, Weak >=30, otherwise Poor. Risk uses its own inverse Low/Moderate/Elevated/High vocabulary.
- Grid cells protect against long numeric/token collisions on desktop and mobile.

## Cross-tab canonicalization

- Thesis, Business, Earnings, Technicals, Ownership, Catalysts and Options continue to explain one V5 decision rather than independent verdicts.
- Options uses the V5 underlying call, not a legacy view label.
- Technicals no longer labels a HOLD watch region as a DCA zone.
- Legacy Pro technical duplication is suppressed whenever the V5 Professional Metric Explorer is present.
- Business headline/detail scoring uses the canonical V5 business score and shared score semantics.
- Catalyst copy and tab context consistently refer to the V5 evidence state.
- Earnings and Options provider values are normalized before rendering.

## Learning and paper-broker alignment

- Validation snapshots freeze the V5 execution plan and V5 canonical levels.
- Frozen V5 invalidation is preferred for paper sizing.
- Paper intent consumes V5 thesis/business/entry scores when present rather than silently reverting to older scoring fields.
- UI, learning and paper execution therefore share the same V5 snapshot/action/plan boundary.

## Safety

AURYN V5.1 remains autonomous **paper-only**. Live-money automatic execution is not enabled. Passing software tests establishes consistency and fail-closed invariants; it does not guarantee investment returns.
