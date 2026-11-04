# Studio production implementation plan

Goal: move the approved compact visual language into the real application while retaining real data, auth and entitlements.
Architecture: component-owned shell and research CSS; shared semantic colors; existing research evidence adapters. No synthetic metrics or replacement backend.
Spec: docs/superpowers/specs/2026-11-04-auryn-product-reset.md, extended by the user's approved Studio prototype and request for category colors.

1. Replace pill menu with a labeled desktop rail, tablet icon rail and mobile dock. Keep search keyboard shortcut, navigation restoration and route prefixes.
2. Replace olive Pace presentation with compact five-stage blue instrument; retain actual readings and exploration/confirmed distinction.
3. Surface overview evidence in four compact category panels using existing overviewEvidence adapter and dated metric provenance. Add icons to every research tab.
4. Apply readable warm surfaces and semantic category tokens; tighten existing settings component geometry.
5. Typecheck, production build and regression tests. Inspect desktop/mobile via available preview. Report limits honestly.

Review focus: mobile overflow; keyboard access and reduced motion; null/missing financial data; free-vs-Pro access; preserved navigation behavior.
Ruling: preserve all pre-existing uncommitted work and implement on the current feature branch. No production deployment or unrelated staging.
