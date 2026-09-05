# NIVORA V65.18 Premium UX Design

## Goal
Make Analyze, Portfolio, Trading Lab and Alerts feel like one premium mobile-first investment product: clean, fast, readable, decision-oriented and consistent on desktop and iPhone.

## Design
Use one responsive typography/spacing system and one shell/navigation system. Mobile bottom navigation is fixed to the safe area with page padding equal to its occupied height, so content never sits behind it. Desktop navigation is mathematically centered independent of logo/avatar widths. Glass is reserved for navigation and compact interactive surfaces.

Metric information uses one circular `i` affordance everywhere. Mobile explanations use a bottom sheet positioned above navigation. Portfolio preserves meaningful visual intelligence—performance versus SPY/QQQ when endpoints exist, drivers, allocation and exposure—but suppresses fake/unknown conclusions and repetitive holdings presentations. Holdings use `Qty`.

Analyze prioritizes quote integrity, decision, performance and evidence hierarchy. Alerts support clear management including deletion. Existing scoring, Trading Lab risk gates, paper-only safety and quote-integrity rules are unchanged.

## Performance
Visibility-aware polling, deferred below-fold work, cached calibration and reduced expensive blur/compositing. Avoid duplicate client requests and unnecessary rerenders.

## Acceptance
Responsive at narrow iPhone widths and desktop; no clipped controls, hidden content or nav overlap; consistent fonts; circular info controls; readable touch targets; meaningful portfolio visuals; no duplicate holdings table; Qty wording; alerts deletable; no scoring-policy changes.
