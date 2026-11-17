# Auryn Ground-Up Design

## Intent

Build a fresh, local-only stock research application using only EODHD and SentiSense Pro adapters, with no exposed credentials or assumed entitlements. The exact Figma Make file is blocked behind authentication, so its visual system must not be inferred; the first implementation uses a restrained independent design pending reference access.

## Goals

- Responsive overview, screener, research, portfolio, and settings routes.
- Grid scrolling only: shells stay fixed while data grids own overflow.
- Server-only credentials, request deduplication, TTL caching, retry/backoff, and quota-aware errors.
- Explainable independent Pace and Bear/Base/Bull calculations.
- Reproducible 509+ ticker structural coverage with honest live/fixture/skipped/failure counts.
- Desktop and mobile automated checks; no production deployment.

## Non-goals and anti-goals

- No reuse of prior app source or incomplete shells.
- No copied DCA Optimizer implementation, bulk extraction, fake live quotes, brokerage execution, or subscription changes.
- No claim that provider credentials or paid entitlements work until a live probe succeeds.
- No invented Figma colors, fonts, spacing, pages, or states.

## Architecture

Use a TypeScript/React/Vite client and small Node HTTP service. Domain analytics and provider contracts are framework-independent. Provider calls occur only on the server through EODHD and SentiSense adapters plus a shared rate-aware cache. The UI consumes normalized responses and shows provenance, freshness, and errors. A deterministic synthetic validation corpus tests algorithms but is never presented as live data.

## Approaches considered

1. Full-stack React framework: convenient but adds unnecessary SSR and framework coupling.
2. React/Vite plus focused Node service (selected): clean credential boundary, fast iteration, portable analytics.
3. Static client only: rejected because it cannot keep provider credentials server-side.

## Constraints and builder calls

- Node 20+, TypeScript strict mode, local-only.
- Provider values include source, as-of time, and live/fixture/unavailable status.
- Use a neutral dark research-console visual language only as an interim independent design.
- Treat user-provided DCA reference files as comparison inputs only; report differences, never replicate proprietary logic.
