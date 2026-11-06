# AURYN reference-led redesign — November 6, 2026

This source release combines the approved reference direction in the existing application. It is not a new standalone demo and has not been deployed.

## Changes

- Consolidated shared surfaces, typography, cards and controls; removed accumulated surface experiments and decorative card stripes.
- Compact top navigation on desktop and mobile; no sidebar or bottom navigation dock.
- Shorter Home, Research, Portfolio, Watchlist and company-tab copy. Dates, missing-data states and financial qualifications remain available.
- Subtle company card accents with distinct positive/negative chart and return colors.
- Portfolio summary hierarchy, quieter chart canvas, expandable allocation list and calculation details.
- Smaller business, technical and options headings; readable select fields and consistent analytical panels.
- Simplified public hero and sign-in story, retaining the existing product walkthrough and authentication behavior.

## Verification

- Automated regression suite: 1,055 passed, zero failed.
- Production build includes TypeScript validation. See verification/reference-redesign-validation.md for final status.
- Desktop portfolio, public landing and sign-in rendered in the local browser; sign-in text contrast corrected after review.
- Independent source review completed; stale quote labeling and auth contrast findings resolved.
- No financial calculation or authentication flow redesign in this release.

## Limits before release

Live authentication was unavailable in the local preview and was not end-to-end tested. Narrow-screen CSS was reviewed, but a physical iPhone/PWA run is still needed. The temporary iframe QA harness could not run the Next router and was removed; this does not constitute a successful mobile browser test. Full dark-mode and keyboard journeys across every tab remain release checks. No production deployment or enterprise certification is claimed.

## Run

Use the existing environment setup and installation instructions. Run `npm ci`, `npm test`, and `npm run build`. Environment secrets and generated output are excluded from this archive.
