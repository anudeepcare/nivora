# Approved build progress

Reference: mockup 632e79dd06d0b8844f2c65f08812ad07fbb79bbf. User approved overall and requested compact first-view public/auth screens, rigorous functional/data checks, preserved metrics and junk removal.

Implementation is in /workspace/scratch/9f0036d454ae/auryn-approved/AURYN, an isolated copy with local baseline Git history. Source ZIP delivery remains the final artifact. No live production deployment authorized by implication here.

Task ownership: public/account agent; provider-reliability agent; workspace agent; root shell/research/integration. Disjoint implementation files allow parallel work. Shared styling and route imports owned only by root.

Ruling: Do not ask again to approve the plan or design; the user's current instruction is explicit build authorization. Missing provider data must not be fabricated to satisfy the universal-ticker wording; implement resilience and prove tested coverage.

Ruling: Need not copy or modify production credentials while building UI. Live provider checks are separate from synthetic tests, and any configuration limits will be reported.

## Integrated implementation
- Public hero and account forms use approved visual language with compact first views. Browser measured hero bottoms: 648px at390×844,570px at360×740,605px at1365×768. Signup submit bottoms:719px,687px,692px respectively (including local missing-account-configuration status). No horizontal overflow.
- Shell uses approved92px rail/72px desktop header and phone dock. Mobile Explore was verified to open Discover, Research Lab, Paper Lab, Compare, Help and Settings.
- Research now connects the approved weighted scale, unchanged model/Pace reading, scenarios, sentence evidence, fingerprint, compact metrics and contextual drawers. Full financial/valuation/technical/analyst/news/options/advanced components preserve actual functionality. Scale exclusions are saved locally and never alter the engine verdict. Normal1× Pace is neutral, not a wait factor.
- Portfolio/Home/Watchlist/Research discovery integrate real account hooks and mutations. Browser verified loaded quotes, real-data presentation, position-editor controls and navigation. Local fixture account writes remain intentionally disabled.
- Source review found and fixed historical scenario horizon/reference mislabeling, mixed503/404 provider classification, and mobile tools access. Browser additionally found a saved-theme hydration mismatch; regression fix passed and browser reloading now restores the correct selected theme without new application console errors.
- Validation uses actual production components with isolated fixtures in the localhost-only preview. No preview fixture can substitute for market data in production.
