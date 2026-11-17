# Layout repair — November 4, 2026

Changes: restored Home layout ownership after shell migration; consistent icon.svg brand in public/pricing/app; explicit Pace heading contrast; Pace precedes summary metrics; inline metric explanation controls; single search focus outline; structured financial rows; unbroken technical numeric values; compact research search; pricing removes purple gradients and stretched feature rows.

Validation: 881 tests passed. Next production build passed with type checking. Browser checked local illustrative preview: Home, Research search, all nine research tabs, public landing and pricing. Pace top approximately 284px at 1363x936 desktop viewport; no document horizontal overflow in inspected research tabs. Metric values computed with nowrap. Search input outline none and containing form solid outline.

Limits: not deployed. Mobile visual validation incomplete. Live payments/provider integrations not exercised. Home preview contains no news/events, so populated event layout has source inspection only. These repairs are not certification of every page/state. Existing auth, subscription and financial calculation logic was not changed by this repair.
