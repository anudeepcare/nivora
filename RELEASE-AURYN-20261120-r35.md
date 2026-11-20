# Auryn r35 · Public and workspace cleanup

- Fixes the Home heading color at the selector emitted in production, preserving the violet/blue design and high contrast in either theme.
- Aligns Home features, walkthrough, Pace, and footer on a single content rail. Plan/account actions and visible support text are simpler.
- Keeps sign-in compact with a navy contour header and the linked brand, without a separate Close link. Terms, Privacy, and Risk can be read in an accessible dialog on the form. These use the same text as the full pages, and modified/fallback opening remains available.
- Aligns Help and legal header, navigation, and reader; public guide, tools, Pricing, and Contact use consistent, nonsticky navigation with top breathing room.
- No changes to authentication actions, financial logic, providers, permissions, account data, or database migrations. The owner deploys the archive.

## Signed-in screens

- Desktop navigation is part of the workspace surface instead of a detached capsule. The mobile dock stays at the bottom. Removed Alerts from the header and account menu; Settings still offers alert setup, and existing alerts, delivery, and the Alerts route are unchanged.
- Research keeps stock identity and price in place, with compact primary section controls. Business, Technicals, Analyst Coverage, Targets, Pace, and Options expose key figures first. Source and method notes remain available without interrupting the main view.
- Search uses a single visible focus outline. Ask AURYN keeps the available evidence actions without implying AI is enabled when it isn't.
- Today makes better use of width for holdings and recent-quarter data, and gives Radar status and contribution planning a simpler layout. The Radar backend setup issue remains; no migration was applied.
- Signed-in Membership has one concise access/status area, and Portfolio Check's results can be scrolled using a keyboard. No billing, access, pricing, or portfolio valuation changes.
