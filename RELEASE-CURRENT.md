# Current source candidate: Coherent glass and mobile navigation, November 15, 2026

Read [MOBILE-GLASS-20261115.md](MOBILE-GLASS-20261115.md) for the current changes and verification. Earlier release narratives are historical.

The candidate addresses the seven owner screenshots: inconsistent nested white panels, differently inset disclosures, unreadable semantic colors and fragmented menu styling. Shared glass panels and inset metric tiles now use separate tokens. Positive, negative, neutral and caution cues are theme-aware. The overview has a coordinated desktop pair and single-column mobile flow. Menus use a touch-sized glass dock and shared sheets. PWA offline assets, update lifecycle, safe areas and theme chrome have focused regressions.

Financial calculations, scenario values, source selection, APIs, services and database code are unchanged. Metrics and boxed grids remain. No source was deployed, pushed or migrated.

**This remains a source candidate, not visual or installed-PWA acceptance.** Local Chromium cannot launch in this execution environment (socket permission restriction even after escalation), and the separate cloud browser cannot reach its local dev server. No new browser screenshots or mobile-device results were obtained. Test passes, contrast calculations and code review do not establish actual screen quality. Before publication, inspect real populated, missing and expanded states at mobile/tablet/desktop widths, in both themes; test iOS/Android installed navigation, keyboard, offline recovery and updates.

Current machine-readable verification is `verification/mobile-glass-20261115/summary.json`. Existing inner Research view/input resets on outer-tab unmount are unchanged.
