# AURYN connected experience — October 25, 2026

This complete source package continues the approved Auryn design in the existing Next.js application. It changes page composition and adds decision tools while retaining research calculations, access gates, data adapters and account handlers.

## What changed

- Home now opens with a portfolio summary strip, a compact blue briefing, session/exposure/calendar insights and company rows with supplied price history. Missing history stays explicit and does not trigger a fan-out of research requests. Watchlist-only accounts receive a meaningful no-holdings state.
- Research Overview adds a sector-aware business/price/timing fingerprint, supporting and limiting evidence with links to the financial statements, and a hypothetical allocation explorer. Existing research tabs, metrics, source details, conditional cases, price charts, and confirmed/forming Pace remain available.
- The allocation explorer uses priced USD investments and recorded cash as a fixed base. It discloses excluded/unpriced holdings, managed balances, margin and quote dates. Zero allocation remains zero; reset returns to exact current exposure. A Bear sensitivity appears only when the existing scenario model is eligible and denominated in USD. It never places an order or supplies a recommended weight.
- Navigation, portfolio/watchlist, research, labs, settings, plans, alerts, public and account surfaces share the updated typography, controls, spacing and light/dark colors. The public sample describes an illustrative investment rather than promoting a named ticker.
- Product stylesheet ordering is centralized in `app/product.css`, with `app/auryn-experience.css` owning shared composition. Existing specialized styles remain for compatibility. `pwa-shell.css` stays last; this is not a wholesale deletion of historical CSS.

## Run and review

Use Node 22.18 or newer. In the extracted `AURYN` folder:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

For a labeled, read-only local preview without account credentials, set `AURYN_ENABLE_PREVIEW=true` in `.env.local`, then visit `http://localhost:3000/preview/overview` or `/preview/research/MSFT`. Keep this flag disabled when hosted. Real account mode requires your existing configuration. This update introduces no new variables, migrations or production dependencies.

```sh
npm run verify
npm run test:api
```

The archive includes the full source, migrations, assets, tests, setup instructions and checksums. Installed dependencies, build output and private environment files are excluded. Existing deployment/source-install instructions remain available; nothing was pushed or deployed during this work.

## Verification and limits

Current results are recorded in `verification/CONNECTED_DESIGN_REPORT.json`. The domain/UI/database suite, TypeScript, production build and compiled API checks passed. API tests use synthetic transports; they do not prove live provider, OAuth, billing, email or brokerage acceptance.

Desktop and 360/390-pixel phone review used the actual React components and styles in a separate, labeled fixture harness. It substituted standalone routing for Next.js and disabled all account submissions. Reviewed Home, Overview, all research tabs, portfolio, watchlist, research search, settings, plans, alerts, Discover, Research Lab, Paper Lab, Compare, public home and sign-in/signup/reset layouts. Checked light/dark themes, larger text, horizontal overflow, evidence navigation and allocation presets/zero/reset. This is browser layout and interaction evidence, not a full production or physical-device test.

The saved Claude reference could not be reopened: automatic approval review rejected access because the current turn did not explicitly authorize that signed-in destination. Recovered approved design details were used; exact visual parity is unverified. Installed iPhone/PWA behavior and live service acceptance remain to be tested in the configured preproduction environment. Historical model-performance limitations in earlier reports remain applicable.
