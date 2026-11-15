# Auryn Approved Glass

## What changed

- One cool-white glass system with subtle cyan/lilac edge lighting, high-contrast data surfaces and blue selected navigation. Positive, warning and risk colors retain distinct meanings.
- Public landing, sign-in, workspace startup, home, research, portfolio, settings, plans and supporting tools share the same tokens and control treatment.
- Research places the chart beside the decision on desktop and the decision before the chart on mobile. Four concise snapshot cards and five evidence categories replace the previous scattered hierarchy. Existing research metrics remain available.
- Conditional Pace zones are shown behind the actual price history when eligible. They use the same current-Pace period selection and four-day freshness policy as the decision card. Disconnected ranges remain disconnected. These zones are expressly current conditional zones, not historical trading signals.
- Compact company/quote header; stock facts moved into evidence rather than removed. Long names wrap without forcing fixed-width content.
- Public illustrative figures remain labeled. Live screens do not substitute the mockup's example figures for real data.
- Mobile safe-area navigation and theme-aware PWA status/background colors, updated blue/cyan/violet app icons and cache versions. Reduced-transparency and reduced-motion accommodations remain supported.
- The earlier transient upstream-error cache retry and authentication-style fixes are retained. No scenario model or pricing calculation was replaced with fabricated values.

## Validation

`npm run verify` passed: lint, formatting, 1,644 tests (zero failures), typecheck and production build. `npm run test:api` passed against that build with controlled fixtures. Production isolation checked 56 route traces. Results are recorded in `verification/approved-glass-20261115/summary.json`. Independent source review passed 21 focused tests covering current-Pace consistency, overlays, retained facts, zone contracts and research structure.

## Release boundary

This is not a production deployment or a claim of guaranteed stock-price accuracy. Automated tests use controlled fixtures; they do not prove live DCA Optimizer parity across all stocks. The environment did not permit a final rendered browser/device inspection, so exact pixel fidelity, installed-iPhone status-bar behavior and live-provider acceptance are not certified by this package. Keep it in preproduction until those checks are completed.

## Install and verify

Use Node 24, run `npm ci`, then `npm run verify` and `npm run test:api`. Keep existing deployment secrets and provider configuration; none are included. Deploy source to preproduction first. Existing app users may need to close and reopen their installed PWA to adopt the updated cache and icon assets. Production deployment remains a separate action.
