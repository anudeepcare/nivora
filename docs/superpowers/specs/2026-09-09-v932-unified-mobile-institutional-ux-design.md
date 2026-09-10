# AURYN V9.3.2 Unified Mobile-First Institutional UX Design

## Goal
Turn the stock experience into one synchronized, premium research narrative that is simple at first glance, expert-deep on demand, mobile-first, and driven everywhere by the canonical V9.3.1 decision snapshot.

## Product principles
- One stock, one story, one decision, one visual language.
- Preserve V9.3.1 Market Truth, DecisionSnapshot, Decision Kernel, Astra authority boundaries, Trading Lab safety, and all prior release gates.
- Do not create a new decision engine or duplicate canonical values in UI code.
- Default view exposes only the highest-value decision information; deep evidence remains available under Pro and Extreme Pro.
- Same snapshot must produce the same visible call, price, owner/new-money actions, setup state, trigger and invalidation across all evidence tabs.
- Mobile 375px is a first-class layout target with no horizontal overflow and thumb-friendly controls.

## Stock page information architecture
1. Security masthead: company, symbol, canonical 24/7 price, market state, ownership state.
2. Institutional decision hero: call + precise two-to-three sentence rationale.
3. Compact action rail: New Money, Owner, Long Term, Execution.
4. Ranked decision drivers: six canonical pillars rendered as evidence rows, not KPI cards.
5. Decision narrative: Why this call, strongest counter-evidence, what changed, next trigger, invalidation.
6. Evidence navigation: sticky, horizontally scrollable on mobile, synchronized across tabs.
7. Evidence page: each tab explains its dimension of the same decision without repeating another dashboard hero.
8. Extreme Pro disclosures: model attribution, legacy diagnostics, scenario maps and metric explorer remain available but visually subordinate.

## Visual system
- Premium ivory/ink/muted-gold editorial system.
- Replace large gray card grids with white/transparent surfaces, thin rules, typographic hierarchy and restrained accents.
- Use compact chips only for state; use rows and dividers for evidence.
- Keep numerical typography tabular and scan-friendly.
- Avoid duplicate score headlines and repeated AURYN action labels.
- Motion is subtle and optional; no animation may obscure market/data status.

## Mobile behavior
- Decision hero stacks compactly; price remains visible without dominating.
- Action rail becomes a 2x2 compact grid, not full-width oversized tiles.
- Driver list is single-column.
- Evidence nav is sticky and horizontal-scroll with accessible tap targets.
- Trigger/invalidation sections stack.
- Extreme Pro content remains collapsed by default.
- No horizontal overflow at 375px.

## Cross-tab contract
Every tab consumes the same InstitutionalDecision and MarketTruth objects. StockTabContext must be a compact evidence-page heading only and must not repeat the canonical action. The setup map may appear only inside Technicals/Extreme Pro and is explicitly supporting evidence, never a second verdict.

## Developer workflow
Add VS Code tasks and simple npm aliases for quick reliability, full release gate, and live 30/100/500-symbol audits. Secrets remain server-side; live audit scripts target deployed AURYN endpoints.

## Acceptance gate
- 0 duplicate canonical decision heroes in normal/Pro stock flow.
- 0 cross-tab canonical value contradictions introduced by UI.
- 0 horizontal overflow in the 375px CSS contract.
- Mobile evidence nav is sticky and horizontally scrollable.
- Extreme Pro diagnostics are collapsed by default.
- Existing V9.3.1 reliability and historical/research gates continue to pass.
- Production TypeScript/Next build must pass before the release is called production-safe.
