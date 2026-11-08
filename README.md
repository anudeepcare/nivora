# AURYN

Current enhancement handoff: 8 November 2026. ZIP-only delivery; no remote branch or deployment was changed. Production remains unchanged.

Start with [visible changes and the integration correction](VISIBLE-CHANGES-20261108.md), then [the preprod enhancement report](PREPROD-ENHANCEMENTS-20261108.md), then [the operational handoff](RELEASE-HANDOFF-20261107.md). Earlier review and completion documents are historical snapshots.

See [the recovered requirement checklist](REQUIREMENTS-STATUS-20261107.md) and [exact configuration notes](CONFIGURATION-20261107.md). These separate shipped source from live activation and unfinished roadmap items.

## Run and verify
Use Node 24.x (`.nvmrc` and CI agree), then `npm ci`, `npm test`, `npm run typecheck`, `npm run build`. `npm run test:api` exercises controlled API fixtures. Live-provider, production-account and physical-device checks remain separate.

## Deploy
This enhancement release is delivered as a source ZIP. Automatic push and deployment were stopped at the user’s request. Production requires later acceptance, including the outstanding browser/device checks in the current report. Before any future database migration, reconcile installed migrations against the recovered records; do not blindly reapply older numbered migrations. Keep the dedicated snapshot-signing secret and existing account/access configuration. See the current handoff for scheduler and database status.

Owner reference: Admin controls → Owner handbook. Its API authorizes the exact configured owner. Never import its content into a client component or place it in `public/`.

## Product boundaries
Pace is a price-condition policy, not demonstrated investment outperformance. Confirmed and forming periods remain distinct. No broker execution or subscription-wide automation is enabled by this handoff.

Older release narratives are in `docs/archive/`; their setup claims and test counts are historical, not current instructions.

Latest automatic-coverage correction: [SYSTEMATIC-SCENARIO-COVERAGE-20261108.md](SYSTEMATIC-SCENARIO-COVERAGE-20261108.md).
