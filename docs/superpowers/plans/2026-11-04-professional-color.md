# Professional Color Implementation Plan
> Execute inline using executing-plans.
**Goal:** Apply the approved visual language throughout the real application.
**Architecture:** Core tokens and shared surface styles own typography/color; component modules own geometry. Existing controllers, data models and subscriptions remain unchanged.
**Tech Stack:** Next.js, React, TypeScript, CSS modules.
**Spec:** docs/design/professional-color.md
## Global Constraints
Preserve current uncommitted work and financial/auth/billing logic. No production deployment or commits in this task; deliver source ZIP and actual browser verification.
## Review Focus
- Long metric labels/values: wrap labels without splitting values.
- Mobile: no horizontal page overflow; touch controls remain usable.
- Dark mode: readable category surfaces and controls.
- Navigation: every destination remains reachable after replacing sidebar.
- Data: preserve empty, stale, crypto and Pro states.
## Tasks
- [ ] 1. Update foundation/appearance tokens, typography, shared financial surfaces and gradient logo. Verify build and appearance tests.
- [ ] 2. Replace WorkspaceShell layout with white top navigation and accessible More menu; retain keyboard and route behavior. Verify navigation tests and browser.
- [ ] 3. Recompose IntegratedResearch: Pace/chart, overview metrics, evidence and risks, supporting detail. Style Pace and evidence modules; preserve controller behavior. Verify research/Pace tests and desktop/mobile.
- [ ] 4. Apply surfaces to Home, Portfolio, Watchlist, Discover, Settings, Plans, public/auth and all research tabs. Verify route inventory and dark/text-size cases.
- [ ] 5. Run full test suite/build, perform fresh review, package source and record exact verification limits.
## Rulings
User explicitly approved implementation; proceed without a second design approval. Existing feature checkout contains prior authorized work, so continue there without moving/resetting it. No backend or data contracts change; existing behavior regression suite and visual QA are appropriate, rather than tests that merely repeat CSS declarations.
