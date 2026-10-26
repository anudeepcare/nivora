# Auryn connected design implementation plan

**Goal:** Carry the approved late-October Auryn direction into the complete existing Next.js application, preserving account data, calculations and routes.

**Architecture:** Keep the existing Next.js, React and provider/auth layers. Introduce coherent shared surfaces and readable responsive typography; rebuild Home's hierarchy and research decision tools on the existing evidence models. Keep fixture-only browser review separate from production.

**Spec:** Current user continuation plus recovered approved Claude reference: portfolio summary strip, compact blue briefing, insight cards, company rows with charts, buy/wait evidence, position sizing, company fingerprints and combined metrics/scenarios/interpretation. Existing October 25 source is the baseline.

## Constraints
- One complete source ZIP; preserve the existing file identity. No GitHub push or live-account mutations.
- Real account research must never receive fixture values. No hardcoded public ticker recommendations.
- Preserve EODHD/Twelve Data, Supabase, Alpaca paper-only controls, billing, quotas, all research tabs and company-specific model gates.
- Readable desktop and mobile layouts, dark/light, large text, reduced motion, PWA safe areas and ordinary chart scrolling.
- Claude origin could not be reopened. Match recovered design intent, not claim verified pixel parity.

## Tasks
- [x] 1. Shared composition: update Shell, tokens, controls, navigation and all page surfaces in app/auryn-experience.css. Consolidate runtime stylesheet entry while retaining compatibility styles for existing specialized components.
- [x] 2. Home: portfolio summary, compact blue briefing, actionable insights, real-history company rows, current-source news and calendar. Retain empty/error/partial states and same-date return logic.
- [x] 3. Research: balanced supporting/limiting evidence, business fingerprint, interactive position sizing and existing scenario, price and detail tools. Test target-weight arithmetic, missing/invalid quotes, partial totals and zero target before implementation.
- [x] 4. Public/account and supporting routes: public page without named ticker promotion, auth, portfolio/watchlist, settings, plans, alerts, labs/admin. Keep existing handlers and access gates.
- [x] 5. Verify: domain regression suite, TypeScript, production build and compiled API checks; browser review of production React components in labeled fixture harness at desktop/mobile sizes, light/dark and core interactions. Record limitations, refresh checksums, replace the original complete ZIP.

## Review focus
Unknown prices must remain unavailable, zero must remain meaningful, partial portfolio values must be labeled, charts must use real supplied history, account/broker actions must remain disabled in review, direct detail routes and mobile controls must remain accessible.
