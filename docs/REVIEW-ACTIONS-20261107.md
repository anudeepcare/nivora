> Historical review snapshot: completion status below is superseded by ../../RELEASE-HANDOFF-20261107.md and the later implementation/recovery notes. Retained as review history, not current release instructions.

# External review: verified actions, 7 November 2026

The attachment reviews an older snapshot. Its counts and missing-dependency failures are not current acceptance results. Each recommendation is treated as a hypothesis and checked against the current source.

## Implemented in this update
- Currency precision: compact minimum 0/maximum 1 decimal; standard minimum/maximum 2. Node runtime narrowed to 24.x and .nvmrc=24, matching CI's major version. This controls precision; it is not a promise that all browser ICU implementations are byte-identical for every currency.
- Access gating defaults on on every host. Production cannot disable it with AURYN_ACCESS_ENABLED=false. Explicit false is only a nonproduction escape hatch.
- Request limiter now uses an atomic Postgres reservation in production, with hashed scope keys, bounded cleanup and server-only execution. All route calls await it. Missing migration/storage returns an error rather than silently allowing requests. Development retains a local limiter unless AURYN_SHARED_RATE_LIMIT=true.
- Market allowance is an explicit required account(request,{market:...}) argument on every authenticated route. News, filings, analyst, valuation and Pace scans are included. Mixed saved/capture workspace operations retain their operation-specific capture check so reading saved observations does not consume market allowance.
- Snapshot signing requires AURYN_MARKET_SNAPSHOT_SIGNING_KEY (32+ characters). Service-role and cron fallbacks removed. Old signatures made with another key will not validate under the new dedicated key; device snapshots remain available. No automatic insecure legacy verification was added.
- Provider cache now refreshes LRU order on hits and only evicts the same failed entry. Partial-result invalidation also verifies entry identity. Existing retention horizons do not get extended by failures.
- Root README and start instructions consolidated; superseded narratives archived.

## Deployment order
1. Apply 20261107124746_auryn_support_workflow.sql (previous handoff).
2. Apply 20261107124819_auryn_transaction_ledger.sql (previous handoff; once).
3. Apply 20261107140000_auryn_shared_request_limits.sql (new).
4. Set AURYN_MARKET_SNAPSHOT_SIGNING_KEY to a newly generated dedicated server-only random secret of at least32 characters. Do not reuse another credential. Retain it across deployments.
5. Confirm existing Supabase URL, public key, service-role key and AURYN_OWNER_USER_ID; access tables/configuration must be initialized. Keep shared market/provider budget configuration enabled for commercial deployment.
6. Select Node24.x in deployment settings and deploy source. Test owner, free and paid access; support search; ledger save; account snapshot capture; and rate-limit responses.

No production migration or deployment was performed. The new limiter adds a database call per limited request; measure production latency and contention. It is a fixed-window limiter, so traffic can burst at a boundary. Provider-level budgets remain separate.

## Claims qualified or deferred
- Older Pace policies are live dependencies or experiment references, not safe bulk deletion targets. V5 directly reuses V3's settled-bar and robust guard logic. Shadow valuation is intentionally isolated; deletion would discard research work, not simply trim a bundle.
- Shared market allowance/cache mechanisms already exist. They are feature-configured and do not substitute for the now-shared general request limiter.
- getUser remains in place. Local JWT verification needs signing-key/JWKS rotation, algorithm and revocation semantics reviewed before replacement; a faster verifier alone is not a safe drop-in.
- Not every route should call account(): public contact, signed webhooks and secret-protected jobs use different boundaries. Blanket conversion would break those flows.
- CSS consolidation remains a larger migration: existing core cascade layers and token foundation must be measured before deleting compatibility sheets. This update does not pretend that removing imports is a verified visual redesign.
- ESLint/hooks enforcement and full formatting migration remain open. Avoid adding a large unverified dependency/rule change under a security patch.
- Production preview routes now return 404 regardless of the preview flag. Fixture and redesign imports are behind a compile-time nonproduction branch. Development preview still requires the enable flag and local host.
- The selected eight-security study is not a broad validation of today's V5. Its poor results matter, but do not establish either failure or success for a different version. No thresholds changed in this patch.

## Pace research gate
Pre-register policy/version/config hash and evaluation protocol. Use point-in-time membership including delistings, corporate actions and total-return data; walk-forward train/validation/test splits; identical external contribution budgets; explicit idle cash yield, fees and taxes assumptions; no future fundamentals. Report distributions, failures, drawdowns, turnover, invested-time and terminal wealth versus ordinary DCA. Separate model selection from final holdout evaluation. Do not publish “tamper-proof” claims from a privately held hash alone: an independently timestamped append-only publication and documented corrections are needed.

## Focus update requested immediately
Positioning: AURYN helps monthly investors research a contribution and keep the reasons checkable.
- Research's ordinary tabs exclude Options and Advanced. A single Labs selector contains them; Congress disclosures moved from News into Advanced.
- Public landing leads with monthly investing and links the evidence-status page and no-signup concentration check.
- /track-record states that no verified prospective series or established DCA advantage is available. It documents the comparison requirements without inventing returns.
- /monthly-plan is an authenticated, user-selected equal-budget research worksheet with a downloadable draft. It is NOT yet a holdings-aware allocation engine, two-minute onboarding, saved account plan, or real-money execution.
- /portfolio-check computes entered-value concentration locally, combines duplicate symbols and clears inputs. It does not infer sector, correlation or fund look-through exposure.
- CI now also runs on main pushes.

## Still not completed
Broad survivorship-aware total-return backtest; independently timestamped prospective signal publication; structured thesis monitoring; full CSS consolidation and ESLint/hooks enforcement; validated dead-code removal; observed onboarding; 20 real users; retention or paid conversion evidence. These remain acceptance gates, not fabricated accomplishments. Existing thesis notes and alerts are not equivalent to automatic evidence-based thesis invalidation.

## Existing study: negative evidence retained
The archived price-zone study (`docs/approved-build/PACE_ZONE_CONTRACT_20261027.md`) reports SPY, AAPL, NVDA, INTC, PYPL, PFE, F and ARKK. At 10 bps, both example schedules beat ordinary DCA in 2/8 and trailed in 6/8. Mean terminal-account-value differences: conservative −32.22%; regular −27.92%. These are not annualized returns and are not a fresh test of today's V5. The study excludes dividends, cash yield, taxes, point-in-time business eligibility and delistings; its surviving selected universe is not representative. Raw validation outputs were not available in this handoff, so these figures are retained as an archived study report, not republished as a verified current performance series.

## Verification for this source handoff
- 1,122 tests passed, zero failed.
- Next production build and type validation passed.
- Compiled API fixture suites passed with enforced access and shared-limit fixtures; no live provider/database/payment success is implied.
- 52 production file traces exclude development fixture source.
- Public home, evidence and concentration pages checked at 390 and 1440 pixels; concentration input/clear and duplicate aggregation checked. Production preview routes return 404 even when enabled.
- Monthly worksheet component checked at both widths for equal split, duplicate symbols and invalid budget; this is not a signed-in production-account acceptance test.
- No clean-install, live deployment, physical-iPhone, production database migration, real payment, or broad Pace-proof claim is made.
