# AURYN — full application source

Packaged November 4, 2026. This contains the complete current application, not only Settings.

**Status: working rebuild candidate; the requested whole-app ground-up redesign is NOT finished.**
The source includes the new core CSS separation and revised Settings, but existing feature styles remain in a compatibility layer. This archive is not a claim that every page has been redesigned or that live/mobile acceptance has passed. No production deployment is included.

## Run locally

Use Node.js 22.18 or later (Node 22 recommended).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Configure the required values in `.env.local` for real accounts and providers. No actual secrets are supplied.
For a local, isolated illustrative workspace, add `AURYN_ENABLE_PREVIEW=true` and open `/preview/overview` on the local server printed by the dev command. Account writes are disabled in this preview. News and options are not fabricated when unavailable.

## Validate

```sh
npm test
npm run typecheck
npm run build
npm run test:api
```

Stop the development server before running production build/API checks. Several API checks use synthetic transports; they are not proof of live market-data entitlement, live billing, or sign-in success.

## Included

- Public website, login/signup and account UI.
- Home, Research, Watchlist, Portfolio, Discover, Settings, plans, alerts and supporting routes.
- Overview, business, valuation, technicals, analysts, ownership, news/earnings, advanced research and options features.
- AURYN Pace components and financial calculation code.
- API routes, background services, database migrations, tests and deployment documentation.
- `DELIVERY_STATUS.md` and per-file SHA-256 manifest.

## Current UI work

The shared workspace width is stable across research tabs. Settings now uses a slim account column, unboxed preference sections and AURYN Blue as the default/reset accent. Saved alternate accent choices remain supported. Historical styles are isolated rather than deleted; several panels still need component-by-component migration.

## Remaining release work

- Complete remaining page and component redesign/migration and remove superseded CSS.
- Verify mobile/PWA layout, keyboard, dialogs, wide tables, chart touch behavior and scroll restoration.
- Verify configured real authentication, Free/Pro/owner access and live provider success states.
- Review the exact rendered build across pages before release.

Historical implementation notes in `docs/` describe earlier revisions and are not evidence that this delivery passes every release gate.
