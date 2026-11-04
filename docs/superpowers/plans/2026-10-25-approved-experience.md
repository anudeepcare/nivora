# Approved Experience Implementation Plan

> Implement inline, with parallel owners for independent UI surfaces and one final review.

Goal: deliver the approved graphical visual language consistently through the full app.
Architecture: preserve data and side-effect contracts, replace presentation compositions and section-owned CSS. Shared foundation owns tokens and control primitives. PWA geometry remains under pwa-shell.css.
Spec: docs/superpowers/specs/2026-10-25-approved-experience-design.md

## Global constraints
No production mutation. No fake data/history or performance promises. Preserve useful metrics and flows. Test fixtures remain isolated. Never confuse Pace with personal allocation or projected return.

## Tasks
- [x] Shared design foundation, screen inventory, shell controls and accessible graphics helpers.
- [x] Overview: compact assessment, three real-data graphics, risk/Pace/checkpoints and retained chart/detail.
- [x] Home: greeting with useful daily context, real exposure/contributor/event graphics; eliminate repeated earnings prose and counts-only panels.
- [x] Public/auth/recovery/support/legal (entry_rebuild owner), preserving auth and support side effects.
- [x] Portfolio/Watchlist/Settings/Plans/owner dialogs (account_surfaces owner), preserving financial accounting and membership behavior.
- [x] Business/Financial/Value/Technical/Analyst/News/Advanced/Options layouts (research_depth owner), preserving metrics and formula help.
- [x] Test conditional/scenario suppression regression, graphs missing/negative/single-point guards and all existing tests/type/build/API.
- [x] Render all routes/tabs at mobile/desktop light/dark, inspect images, independent review and full ZIP.

## Review focus
No fabricated charts when missing; no positive-base headline when model withheld; tab/scroll/keyboard stable; cash/margin/managed accounting intact; auth/billing permissions untouched; every form retains labels and usable contrast.

See docs/APPROVED_EXPERIENCE_RELEASE.md and verification/REPORT.json for verified scope and remaining live-device/provider acceptance.
