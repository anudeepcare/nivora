# AURYN

Current source handoff: 7 November 2026. Not deployed by this update.

Start with [the review and deployment checklist](docs/REVIEW-ACTIONS-20261107.md), [implemented workflows and remaining scope](docs/COMPLETION-STATUS-20261107.md), and [product priorities](docs/PRODUCT-PRIORITIES-20261107.md).

## Run and verify
Use Node 24.x (`.nvmrc` and CI agree), then `npm ci`, `npm test`, `npm run typecheck`, `npm run build`. `npm run test:api` exercises controlled API fixtures. Live-provider, production-account and physical-device checks remain separate.

## Deploy
Apply the three migrations listed in the current review checklist before deploying. Set the dedicated snapshot-signing secret and existing account/access configuration. Production access and shared request protection are enforced; missing configuration fails closed.

Owner reference: Admin controls → Owner handbook. Its API authorizes the exact configured owner. Never import its content into a client component or place it in `public/`.

## Product boundaries
Pace is a price-condition policy, not demonstrated investment outperformance. Confirmed and forming periods remain distinct. No broker execution or subscription-wide automation is enabled by this handoff.

Older release narratives are in `docs/archive/`; their setup claims and test counts are historical, not current instructions.
