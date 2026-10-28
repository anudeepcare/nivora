# Business-led Pace implementation

Goal: make business eligibility, accumulation Pace and valuation distinct and actionable across AURYN.
Architecture: shared assessDecision / aurynDecision output feeds Research, Home, Portfolio and tool guidance; shared Pace explanation feeds education and help.
Tech stack: TypeScript, Next.js, React, node:test.
Spec: ../specs/2026-10-27-business-led-pace-design.md
Global constraints: preserve approved layout and cumulative fixes; retain monthly-v5; no fabricated inputs; no production deployment.
Review focus: malformed Pace, P0/forming mismatch, critical missing reports, funding overrides, stale prices, misleading public claims, public/research contradictions, unsupported performance implications, valuation versus contribution semantics.

## Task 1: Decision contract
- Add behavioral tests for supported P1–P4 at fair/expensive/unassessed value, P0, risk overrides, missing inputs and invalid Pace; run and observe failures.
- Implement policy v5 and explanations; retain standalone valuation-entry fallback for missing Pace.
- Update old policy expectations without weakening share, model, freshness or funding checks.
- Verify targeted decision suites then commit.

## Task 2: Consistent presentation
- Update shared Pace guidance, research methodology and model-reference terminology.
- Update homepage, login, signup, recovery, education, metadata and help/methodology copy.
- Verify rendering contracts and mobile/desktop public/auth/research screens; no new layout.
- Commit tested changes.

## Task 3: Review and deliver
- Run full tests, typecheck, production build and API checks; inspect all results.
- Fresh reviewer checks the complete diff against the spec and review focus; fix material issues with regression tests.
- Save full-source package with manifest/CRC validation and release notes. Production remains unchanged.
