# Paper Lab diagnosis and implementation verification — 2026-10-16

Read-only investigation against baseline `bbdce50b92384acefb3db79978423da92a75e1ea`, for approved-build section 10. No account, role, environment, workflow, database, flag, broker, or order mutation was performed. Database reads returned schema metadata or aggregates only; this report contains no credentials, user identifiers, or private order rows.

The investigation below records baseline findings. The implementation addendum at the end records subsequent authorized local changes and verification; baseline code defects should not be read as claims about the revised checkout. No production mutation or deployment was performed in either phase.

## Main findings

1. **Owner authorization is not established by the available evidence.** Live Supabase has six users and **zero** users with trusted `app_metadata.role = 'admin'`. Therefore access currently depends entirely on the deployed `AURYN_ADMIN_USER_IDS` allowlist. That environment value and the intended owner's authenticated UUID were not available for verification. A code-only change cannot honestly claim to restore the owner's production access.
2. **There is no evidence of an automatic paper invocation.** All 29 stored paper runs have `automatic = false`. All 262 available GitHub workflow runs, spanning August 29–October 16, contain **zero** paper-runner runs. This establishes missing recorded automatic activity, not whether the workflow is disabled, unregistered, or its history was removed.
3. **The paper workflow still uses the obsolete secret/URL contract.** The actual main-branch YAML uses `AURYN_PRODUCTION_URL` and `TRADING_LAB_CRON_SECRET`; the working research/calibration/portfolio workflows use `AURYN_BASE_URL` and `CRON_SECRET`. The paper route prioritizes `CRON_SECRET`. This is a confirmed code/configuration-contract defect; actual secret absence or inequality is unverified.
4. **Autonomous research and paper execution disagree on the market-intelligence shape.** The latest 100 autonomous snapshots have canonical IDs, but none has `evidence.v934.levels`. The producer persists the raw canonical snapshot, whose structural levels live under `actionMap`; the runner requires the projected `levels` object. These snapshots would be rejected as `MARKET_INTELLIGENCE_MISSING` even after scheduling is restored. None of this sample has `executionAction = 'READY'` either, so correcting the shape does not itself authorize trades.
5. **The manual-order audit migration is absent in live Supabase.** `public.auryn_manual_paper_orders` does not exist. After administrator access is restored, the current manual ticket still fails safely with storage unavailable until its reviewed migration is applied.

## Confirmed live observations

| Check | Result |
|---|---|
| Target project | Supabase `nivora` / `culqkfmyqfpcuklonnog`; active/healthy confirmed by the coordinating investigation |
| Production target | Vercel `nivora`, project `prj_ArVpxUGZW6pbC9KfuumKWfCCKsu2`, deployment `dpl_HP4H6NhtMAKA1b8Tx35issE79wE5`, READY, `getauryn.vercel.app`, confirmed by the coordinating investigation |
| Trusted admin metadata | 0 of 6 users have the exact role accepted by the server; no user identity or metadata row was output |
| Recorded paper runs | 29 total: 23 regular-session `OK`, 5 closed-session `SKIPPED`, 1 after-hours `SKIPPED`; all manual |
| Latest recorded run | 2026-09-29 15:10:44 UTC |
| Latest runner health | 2026-09-29 15:10:48 UTC; 29 health records total |
| Recorded evaluations/orders | 92 evaluations; 2 historical orders, most recent order 2026-09-04 19:58:14 UTC |
| Recent historical blocking | Latest evaluation is `MARKET_INTELLIGENCE_MISSING`; eight evaluations carry that code |
| Available GitHub run history | 262 runs, none named/path-matched to paper; latest 100 consist of 73 market cycles, 16 calibration, 11 portfolio runs |
| Paper YAML on main | Exists and matches the obsolete URL/secret contract; declared cron is `*/15 13-22 * * 1-5` |
| Autonomous sample | Latest 100 `auryn-v9.8` snapshots span 2026-10-15 10:09:34 to 2026-10-16 14:26:27 UTC; all have v935/v931 provenance and v934 IDs; zero have top-level v934 `levels`; zero have execution `READY` |
| Freshness at read time | No `auryn-v9.8` snapshot was within the runner's 30-minute window; four newer `v65.2` snapshots existed but are intentionally excluded by its version filter |
| Core paper schema | Runs, evaluations, intents, orders, and fills exist; all have RLS enabled and no browser policies, consistent with service-role-only access |
| Uniqueness | Unique `intent_id`, `client_order_id`, and `evaluation_key` indexes exist |
| Manual paper schema | `auryn_manual_paper_orders` absent |

These are point-in-time observations, not a claim that all historical runs or later research were inspected. Raw audit payloads, user rows, balances, positions, and secrets were not retrieved for this report.

## Code causes and concrete corrections

| Location at baseline | Finding | Proposed correction |
|---|---|---|
| `lib/server/authorization.ts:8–20`; `app/api/trading-lab/status/route.ts:13`; `run-now/route.ts:7` | Supabase `getUser(token)` verifies identity, then exact UUID allowlist or trusted app role grants access. GitHub ownership, email, name, and editable user metadata do not qualify. | Preserve this gate. Confirm the intended owner's authenticated Supabase UUID, compare it privately against the production allowlist, then apply the explicitly authorized trusted mapping. Do not infer identity from a display name or repository ownership. Surface authentication separately from administrator authorization. |
| `.github/workflows/nivora-paper-trading.yml:6,19–26`; `run-paper/route.ts:92–93` | Workflow uses legacy URL/secret names, route prefers canonical `CRON_SECRET`. No available paper Actions history. | Standardize this YAML on the same `AURYN_BASE_URL` / `CRON_SECRET` contract as the working workflows; preserve the paper workflow. Verify its GitHub registration/enabled state and observe an actual dispatch/scheduled invocation. Secret equality and deployed origin must be checked privately, without returning values. |
| `lib/auryn/v995/persist-research.ts:5–8`; `lib/auryn/v934/intelligence-snapshot.ts:16–20`; `run-paper/route.ts:194–198` | Raw canonical market intelligence is persisted, but the runner requires a display/execution projection's `levels`. | Normalize through the existing `projectMarketIntelligence` function (`lib/auryn/v934/projections.ts:5–50`) or an equivalent typed canonical adapter before validation. Validate usable structural data and provenance; do not merely delete the gate or fabricate missing levels. Preserve genuine execution-readiness and quote gates. |
| `run-paper/route.ts:157–163,206–209` | Only fresh, matching-engine snapshots qualify; all sampled autonomous decisions are not READY. | Keep version/freshness gates. Report no-fresh-research and policy-not-ready separately from scheduler failures; diagnose upstream evidence and policy rather than forcing READY. |
| `supabase/auryn_manual_paper_orders.sql:2–29`; `app/api/trading-lab/manual/route.ts:85–86` | Manual audit table missing in production. | Review/apply this migration with its owner-scoped read policy and service-role writes, then verify schema and cross-user isolation before manual lifecycle proof. Do not disable RLS or let browsers write orders. |
| `status/route.ts:161–169` and `:46` | Hardcodes automatic=true and every ten minutes, despite fifteen-minute YAML; `lastAutomaticRun` is actually latest health from manual or automatic runs. | Return configured cadence, enabled/disabled/unknown scheduling state, and last automatic run from `nivora_v65_trading_runs` filtered `automatic=true`. Do not describe a healthy manual check as scheduler proof. |
| `run-paper/route.ts:92–115` | Authentication, disabled flag, missing storage, or missing broker credentials return before a run is recorded; insert/update errors are ignored. | Record safe preflight outcomes once authenticated and storage is available; report unavailable audit storage explicitly. Ensure non-execution states are visible in workflow summaries. Do not store secrets or create unauthenticated database-write amplification. |
| `status/route.ts:157`; `app/trading-lab/page.tsx:17–25` | Broker-connected can appear ready without enabled flag, schema readiness, schedule health, or eligible strategy. A denied admin request renders the broker as disconnected. | Return/render separate authentication, administrator permission, storage, configuration, broker, schedule, research, and strategy states. Unknown broker state after 403 must not be displayed as tested/disconnected. |
| `diagnostics/route.ts:12` | Diagnostics prioritizes the legacy secret, opposite run-paper/run-now. | Reuse the canonical cron authorization helper/precedence for all internal endpoints; test conflicting configured secrets explicitly. |

## Safety gaps to close before restoring autonomous submission

These are code findings, not observed duplicate orders or account losses.

- `run-paper/route.ts:245–249,332–358` checks existence before inserting an intent, but ignores the insert result and then submits. A unique database index helps only when the conflict is handled. Two concurrent requests can both pass the read; the losing insert must stop before broker transmission. GitHub's concurrency group does not cover manual requests, HTTP retries, or a timed-out invocation still executing.
- `run-paper/route.ts:332–379` writes an intent before broker submission. A timeout or broker rejection leaves an existing intent that later becomes `DUPLICATE` without reconciliation. Use an atomic claim, explicit durable submission state, stable client order ID, lookup by that ID after uncertain responses, and bounded recovery. `AlpacaPaperBroker.getOrderByClientOrderId` already exists.
- `run-paper/route.ts:152–154,260–266` snapshots cash and positions once for the whole batch. Subsequent intended orders do not reserve cash/position capacity or include pending orders. Maintain account-wide reservation/locking and revalidate limits to prevent cumulative over-allocation across the batch or concurrent runs.
- `run-paper/route.ts:50–87` reconciles fills but not accepted/rejected/canceled order states; it only fetches the first 100 fill activities for 30 days. Add paginated reconciliation and terminal-state updates. Preserve partial fills and cancellation uncertainty.
- `run-paper/route.ts:134–148` upserts one record per snapshot/status; there is no run ID on evaluations. `status/route.ts:151–152` infers membership from timestamps. Persist explicit run/evaluation associations so repeated checks and overlapping runs remain attributable.
- `run-paper/route.ts:384–386` marks a run and health `OK` even if individual results contain `ERROR`. Return a meaningful partial/error result while retaining every per-symbol outcome.
- Automatic account checks omit broker account configuration/capability checks used by the manual route (`manual/route.ts:89–90`). Verify account trading suspension, asset eligibility, supported order sizes, and existing pending orders before transmission.

Existing limits and fail-closed behavior should remain: regular session plus broker clock, canonical execution READY, independent live-quote verification, quote age/spread/gap limits, invalidation-based sizing, position/cash/daily-loss limits, paper-only base URL, and an explicit enabled flag.

## Verification performed and remaining

**Performed:** live aggregate/schema SQL; all three GitHub run pages; main-branch paper YAML read; source tracing; `node --test tests/api-authorization.test.mjs` — **9 passed, 0 failed**. The tests confirm 401 without bearer, 403 for ordinary/editable-admin users, acceptance of trusted app role or explicit allowlist UUID, invalid-token rejection, and ownership binding. They do not establish the production owner's role.

**Access limitations:** Vercel environment metadata read returned 403 for the connected scope; the suggested `vercel` CLI fallback is not installed. GitHub workflow-registration enumeration was rejected by the connector's URL allowlist. No credentials were retrieved. No authenticated production session was available. Consequently enabled flags, service-role/key configuration in the deployed app, exact allowlist, GitHub secret presence/equality, broker account capability, live quote eligibility, and workflow enabled state remain unverified.

**Required focused tests after correction:**

1. Producer → persisted raw canonical snapshot → normalized paper consumer contract, plus already-projected legacy compatibility, missing structural data, mismatched provenance, stale/version-mismatched snapshots, and non-READY decisions.
2. Scheduler secret precedence, actual cadence agreement, disabled/missing-config outcomes, last-automatic-run isolation from manual runs, and stale heartbeat reporting.
3. Two simultaneous claims produce at most one broker transmission; failed audit/intent writes produce zero transmissions; broker timeout followed by retry reconciles the original client ID; cumulative cash/position reservations hold across a batch.
4. Broker acceptance, partial fill, fill, rejection, cancellation, uncertain acknowledgment, and paginated reconciliation update a durable run/order trail.
5. Verify the owner's existing authenticated session gets authorized, a separate ordinary user remains denied, and manual audit rows remain isolated. Apply the reviewed manual-audit migration before claiming manual functionality.
6. Only after configuration, permission, and safety gates are verified, perform the authorized controlled **paper-only** lifecycle and record invocation, acknowledgment, fill/rejection/cancellation, and reconciliation separately. This investigation performed none of those broker mutations.

J01/J02/J05/J06/J08 acceptance is **not yet satisfied**. This report establishes concrete causes and verification gaps; it does not claim production access or automatic trading has been repaired.

## Implementation addendum

The local subsystem repairs are implemented on `codex/auryn-intelligence-upgrade`. Execution remains paper-only, requires existing server authorization and explicit enabled configuration, and fails closed until the new schema/control is available. The migration initializes its control **paused**; it has not been applied to production.

| Area | Implemented locations and behavior |
|---|---|
| Scheduler contract | `.github/workflows/nivora-paper-trading.yml` uses canonical `AURYN_BASE_URL` / `CRON_SECRET` with legacy-name fallbacks; it retains the fifteen-minute weekday schedule, HTTPS validation and concurrency. `lib/server/paper-operations.ts::authorizePaperCron` consistently prefers the canonical secret. The workflow emits a bounded status summary and does not automatically retry mutations. |
| Trusted canonical evidence | `lib/server/paper-operations.ts::normalizePaperEvidence` validates freshness, canonical IDs, matching market/research provenance, execution READY and usable structural levels after `projectMarketIntelligence`. New trades require both trusted autonomous `v995` evidence and the current decision policy version. Historical, client-origin and older-policy rows remain observation-only. The coordinating implementation secures the research persistence boundary. |
| Authorization and status | `lib/server/authorization.ts`, `app/api/trading-lab/status/route.ts`, and `app/trading-lab/page.tsx` distinguish authentication, administrator authorization, storage, configuration, research, strategy, scheduling and broker state. The owner gate still requires a verified identity with trusted role or exact UUID allowlist. Automatic activity comes from `automatic=true` runs, independently of manual health. Partial fills, cumulative fills and unverified historical activity have distinct labels. |
| Durable execution and limits | `app/api/trading-lab/run-paper/route.ts` and `lib/server/paper-operations.ts` record authenticated preflight runs, associate evaluations with run IDs, claim unique stable intents before transmission, retain broker client IDs, and reconcile ambiguous submissions without resending. Account-wide leases, final lease/quote checks, pending-order reservations, cash/position/daily-loss limits, account capability and asset checks guard both automatic and manual execution. A failed audit write prevents transmission; a per-symbol error cannot produce an all-success run. |
| Sell reservations | `reservePaperCapacity` treats broker `availableQty` as already net of open sells and caps it by total holdings minus aggregate pending sells. Newly submitted orders use a separate reservation mode, so later orders in the same batch consume additional capacity. A realistic 100-share holding with 70 available and 30 pending remains 70 available; new 10- and 5-share submissions reduce it to 60 then 55. This matches the [Alpaca Position model](https://alpaca.markets/sdks/python/api_reference/trading/models.html#alpaca.trading.models.Position.qty_available). |
| Reconciliation and pause | `lib/alpaca-paper.ts` supplies bounded open-order and paginated fill reads. Automated order reconciliation validates identity and cumulative quantities; metrics exclude unrelated/manual fills. `app/api/trading-lab/control/route.ts` controls new submissions. `app/api/trading-lab/reconcile/route.ts` allows an authorized observation-only reconciliation while paused; it does not submit or cancel orders. The page exposes both controls and explains that pausing leaves existing broker orders active. |
| Manual audit and plan review | `app/api/trading-lab/manual/route.ts` shares the account lease and reservations, checks unresolved orders, and preserves explicit preview/confirmation, cancellation and recovery. `components/ManualPaperTicket.tsx` accepts `planSymbol`, `planAmount`, `planSnapshot` and `planPolicy` as review context only, selects the symbol and never submits from URL input. A supplied amount is a preview/confirmation ceiling. It is not an immutable approved-plan budget or inherited canonical authorization; the handoff explicitly requires fresh review. |
| Unsafe diagnostic mutation | `app/api/trading-lab/diagnostics/route.ts` keeps read-only checks and rejects its former unaudited self-test submission with `USE_AUDITED_PAPER_TICKET`. The normal audited manual lifecycle and broker cancellation behavior remain. `run-now/route.ts` checks current canonical research instead of invoking a legacy producer whose evidence the runner did not consume. |
| Schema | `supabase/migrations/20261016155025_auryn_paper_execution_safety.sql` adds the paused singleton, fenced account lease RPC, intent client/order-plan audit, run associations, verified cumulative-fill fields and the missing manual-order table. Control and execution writes remain service-role-only; manual reads remain owner-scoped. The migration was created with the Supabase CLI and tested locally, including repeat application. |

## Final local verification

Fresh verification after the sell-reservation correction:

- **82 passed, 0 failed, 0 skipped** across `paper-operations`, `paper-runner-route`, `api-authorization`, `manual-paper`, `manual-paper-route`, `manual-paper-lifecycle`, `manual-paper-broker-lifecycle`, `manual-paper-lifecycle-ui` and `v61-trading-api-contract` test files.
- **1 passed, 0 skipped** in `tests/paper-migration.test.mjs`, executing real PostgreSQL semantics in pinned PGlite. It applies the base schema and migration twice, verifies default pause, mutually exclusive leases, expiry/ownership fencing, observation while paused, RPC/control isolation and owner-scoped manual reads with browser writes denied.
- **2 focused compatibility tests passed:** diagnostics now rejects unaudited order mutation, and canonical cron-secret precedence remains enforced. Existing broker cancellation behavior is retained.
- `npx tsc --noEmit --incremental false --pretty false` exited 0. `git diff --check` for the owned code/tests exited 0. The coordinating agent owns the final integrated build and full release-suite gate; these focused results do not claim that the entire repository suite passed.
- Regression tests were observed failing before the relevant fixes, including double sell reservation, missing projection/provenance, invalid broker fills, paging, uncertain submissions and definitive rejections. No authenticated production browser session, physical-device check or real broker mutation was performed.

Reproduce the focused tests from the repository root:

```sh
node --test tests/paper-operations.test.mjs tests/paper-runner-route.test.mjs tests/api-authorization.test.mjs tests/manual-paper.test.mjs tests/manual-paper-route.test.mjs tests/manual-paper-lifecycle.test.mjs tests/manual-paper-broker-lifecycle.test.mjs tests/manual-paper-lifecycle-ui.test.mjs tests/v61-trading-api-contract.test.mjs
node --test tests/paper-migration.test.mjs
node --test --test-name-pattern='paper diagnostics' tests/v63-evidence-reality.test.mjs
node --test --test-name-pattern='scheduled auth' tests/auryn-v99938-trading-lab-canonical.test.mjs
npx tsc --noEmit --incremental false --pretty false
```

The coordinating checkout now pins `@electric-sql/pglite` at `0.3.14`, so `npm ci` followed by the migration command above is reproducible. An isolated alternative, also executed successfully during this work, is:

```sh
npm install --prefix /tmp/auryn-paper-sql --no-save @electric-sql/pglite@0.3.14
PAPER_SQL_TEST_MODULE=/tmp/auryn-paper-sql/node_modules/@electric-sql/pglite/dist/index.js node --test tests/paper-migration.test.mjs
```

## Remaining production acceptance

1. **Owner authorization (J01):** privately verify the legitimate owner's authenticated Supabase UUID and deployed trusted role/allowlist, then test that owner's access and an ordinary user's denial. No account or role has been changed and production access is not claimed restored.
2. **Deployment/configuration (J02/J03):** review/apply the migration, verify service-role and paper-broker configuration, exact GitHub/deployed secret agreement, production origin and workflow enabled state. The revised migration starts paused. No enablement, resume, environment write, migration application or deployment occurred here.
3. **Observed automatic activity (J02/J05):** observe a real invocation and inspect its durable run/evaluation trail, including specific closed-session, disabled, no-fresh-research, non-READY and error outcomes. Local run-route tests prove those code paths with mocked external edges; they do not establish scheduler operation in production.
4. **Controlled paper lifecycle (J06/J08):** after verified authorized configuration and deliberate resume, record broker submission, acknowledgment, partial/full fill or rejection/cancellation, and subsequent reconciliation individually. Historical orders without the new audit fields must not be relabeled as verified merely because a fill activity exists. This work made no real or paper broker order mutations.

Section 10's code safeguards and diagnostics have local verification. Its live owner-access, scheduler and broker-lifecycle acceptance remains open until the observations above are obtained.
