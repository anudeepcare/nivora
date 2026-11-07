# AURYN

Current source handoff: 7 November 2026. Not deployed by this update.

Start with [the current ZIP handoff](RELEASE-HANDOFF-20261107.md). Earlier review and completion documents are historical snapshots; the handoff resolves their conflicting status statements.

See [the recovered requirement checklist](REQUIREMENTS-STATUS-20261107.md) and [exact configuration notes](CONFIGURATION-20261107.md). These separate shipped source from live activation and unfinished roadmap items.

## Run and verify
Use Node 24.x (`.nvmrc` and CI agree), then `npm ci`, `npm test`, `npm run typecheck`, `npm run build`. `npm run test:api` exercises controlled API fixtures. Live-provider, production-account and physical-device checks remain separate.

## Deploy
Deployment is outside this source-only delivery. Before a future deployment, reconcile installed migrations against the recovered migration records; do not blindly reapply older numbered migrations. Keep the dedicated snapshot-signing secret and existing account/access configuration. See the current handoff for scheduler and database status.

Owner reference: Admin controls → Owner handbook. Its API authorizes the exact configured owner. Never import its content into a client component or place it in `public/`.

## Product boundaries
Pace is a price-condition policy, not demonstrated investment outperformance. Confirmed and forming periods remain distinct. No broker execution or subscription-wide automation is enabled by this handoff.

Older release narratives are in `docs/archive/`; their setup claims and test counts are historical, not current instructions.
