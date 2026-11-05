# AURYN 1.0.0 — workspace source candidate

Copy the contents of the AURYN folder into your app's repository root. Keep your existing environment settings. Do not accidentally nest AURYN inside another application folder.

## What changed
- Unified owned page surfaces around neutral/teal/jade/citron; improved headings, controls, focus and contrast across app/public/login/settings/portfolio surfaces.
- Compact stock facts now have one About metrics entry instead of repetitive icon buttons.
- Larger Pace stage, completed/forming selector above expanded technical and contribution details; original financial rules preserved.
- Clear historical downside/midpoint/upside labels remain separate from conditional Bear/Base/Bull valuation.
- Options has a strict exposure workspace with GEX/OI views, filters, normalized values, largest/above/below concentrations, tap inspection, device-local presets/snapshots, compatible change comparison, saved-symbol comparison and TSV export.
- Searchable expiration/company selectors, contract search/ranking, and dated implied-versus-realized volatility context. Removed duplicate old gamma/OI charts and misleading partial totals.
- Optional OPENAI_FALLBACK_MODEL performs one same-provider fallback for transient capacity HTTP errors; source validation, auth and budgets remain enforced. Configure only a model your account supports. No fallback model is selected for you.
- Portfolio CSV import UI remains removed. Saved holdings/manual positions and existing research/alert/notes tools remain.

## Scope and data limits
Read docs/verification/2026-11-05-workspace-coverage.md. It maps every requested product area and identifies features requiring additional licensed feeds or backend implementation. This candidate is not full Skylit parity. No live options flow, intraday replay, vanna board, exposure-alert backend or private competitor walkthrough is claimed.

## Source completeness
Application, lockfile, test fixtures/scripts, database migrations, deployment guidance and a per-file SHA256 manifest are included. Dependencies, generated output, private env files, screenshot archives and prototypes are excluded. Archive size does not establish faster provider APIs.

## Verification
Final results are appended below after checks complete. Synthetic provider regressions are not live-provider acceptance. Physical iPhone/PWA and browser visual acceptance remain pending.

No push or production deployment has been performed. The source stays at release candidate version 1.0.0.

### Automated verification
- 993 tests passed: `node --experimental-strip-types --test tests/*.test.mjs`.
- Strict TypeScript check passed with no errors.
- Production build passed (34 static pages generated, dynamic routes retained).
- All nine API regression scripts passed using synthetic/mocked transport; no real payment or trade executed.
- Independent code review completed. Large-chain snapshot persistence, compatible baseline selection and sparse-history volatility issues were fixed and covered by regressions.
- ZIP CRC and per-file manifest are checked by `scripts/package-source.py`.

Visual/browser verification: unavailable in this run because the browser service timed out. New controls have server-render checks and responsive styles, but mobile, installed PWA, live-account, accessibility interaction and screenshot acceptance are not certified. Review in preproduction before promoting.
