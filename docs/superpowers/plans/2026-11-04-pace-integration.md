# AURYN approved design integration

> Execute inline; user authorized real-app implementation. Preserve all data and account paths.

**Goal:** Bring the approved Pace-led presentation into the real application, with the user's latest matte visual direction and banner-first public/account entry.

**Architecture:** Reuse existing authenticated sessions, market-data models, account actions and research sections. Isolate new visual components in CSS modules so their styles do not depend on accumulated global overrides. Pace renders actual completed/forming readings; public surfaces explain the framework without fictional investments.

**Tech stack:** Next.js, React, TypeScript, CSS modules, existing financial engine.

## Constraints
- No changes to financial calculations, auth contracts or data persistence.
- No fabricated readings, returns or accuracy claims.
- P0/P1 do not imply buying. Risk/business gates take priority.
- Public and login lead with the visual. No neon glow or gradient ribbons.
- Keep every research section reachable on phone and desktop.

## Tasks
1. Add matte Pace instrument with public framework and real-data modes; test missing, forming and blocked states.
2. Put instrument first on public/login, preserving signup, OAuth, recovery and navigation.
3. Adapt real research overview and workspace shell to approved composition and navigation; preserve detail components and data feeds.
4. Validate typecheck, build, regression suite and responsive browser views. Commit on isolated feature branch; provide reviewable integration without falsely claiming production rollout.

## Review focus
Missing completed data must not become a signal. Forming data remains labeled. Risk actions override zone appearance. Public login retains usable mobile forms. All research metrics remain in their established sections.
