# AURYN evidence and planning completion

Goal: explain Pace confidently without unsupported performance claims, implement holdings-aware planning and explicit thesis checks, prepare reproducible evidence infrastructure, and enforce code quality.

Architecture: extend the existing Next/React/Supabase product. Existing authenticated documents and alert history retain account ownership. No broker execution. Public research records contain public market observations only. Production publication requires real observations and verification; no retrospective signal receives a prospective label.

Constraints: USD planning; cent-exact budget, no leverage, cap each position after contribution; withhold incomplete valuations. Pace thresholds unchanged. Free-text theses are never silently interpreted. Missing data is unknown, not pass. Native one-tap controls, readable surfaces, mobile-first sizing. No invented users, records, performance, or deployments.

Tasks:
1. Replace negative public headline with precise Pace explanation, put comparison status in methodology details.
2. Holdings-aware planner: pure capped allocation engine and tests for budgets, cap redistribution, duplicates, incomplete holdings; integrate saved positions/current quotes and user-entered deployable contribution; show amounts and reasons and unallocated cash.
3. Structured thesis rules: validate explicit supported metric/threshold, route into existing monitor with stable identity and dated deduplicated events; preserve saved free text. Tests cover missing and fresh evidence, ownership, deduplication.
4. Evidence infrastructure: owner-only prospective checkpoint creation, server timestamp/hash and append-only database boundaries, public read with scope and version. No claimed returns until comparable observations exist. Add representative evaluation input validation and runnable result tooling without fabricating missing delisted/total-return data.
5. Quality: inspect styles/import reachability, consolidate safe token ownership, add ESLint/hooks enforcement and formatting checks; resolve found errors. Retain reachable policy dependencies.
6. User validation: useful private owner checklist/record of consenting observed sessions; cannot recruit or claim twenty people without actual participation.
7. Verify unit tests, typecheck/build, API access boundaries, phone/desktop layouts; package updated source, report exact remaining data/people/deployment gates.
