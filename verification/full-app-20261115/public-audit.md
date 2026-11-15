# Public route audit — 15 November 2026

Scope: source review of every public route and its loading/error/empty/expanded branches, following AGENTS.md, README.md, DESIGN-PREFERENCES.md and EXPERIENCE-REDESIGN-20261115.md. Existing composition is retained. This is not browser or physical-device acceptance. No previously blocked browser route was retried. No live account, support submission, checkout, password reset, provider or database state was changed.

## Route coverage

| Route / state | Component | Source finding / action |
| --- | --- | --- |
| `/` | PublicLanding | Reviewed menu open/closed, Escape focus return, hero, three-question composition, sample, evidence, footer. Existing narrow layouts, labelled controls and scenario qualifications retained. No additional confirmed defect changed. |
| `/sample` | PublicLanding / ProductWalkthrough / PublicSample | Reviewed sample-only branch, walkthrough disclosures, tabs, next button and hypothetical evidence labels. Existing 44px controls and wrapping retained. |
| `/about` | PublicEducation / PublicFrame | Reviewed research workflow and educational links. Existing single-column mobile steps retained; no financial text removed. |
| `/pace` | PublicEducation / PublicFrame | Reviewed P0–P4 layout and business/confirmed-period qualifications. Existing mobile rows retained. |
| `/track-record` | PublicFrame / PaceRecordFeed | Reviewed public route composition, loading/error/empty record branches and methodology disclosure. Performance-not-established caveat retained. No feed logic changed. |
| `/portfolio-check` | PublicPortfolioCheck / PublicFrame | Reviewed blank, example, valid, invalid, duplicate-symbol and nonfinite-total conditions. Fixed unbroken entered symbols overflowing their meter column through zero-minimum tracks and wrapping. Calculation/input validation unchanged. |
| `/pricing` and account `/plans` reuse | Plans | Reviewed free/pro lists, unavailable billing, current plan, upgrade/manage conditions. Fixed two-column feature list on phones <=420px. No prices, entitlements or billing logic changed. |
| `/contact` | Contact | Reviewed form, screenshot preparation/error/removal, diagnostics opt-in, busy and saved/receipt branches. Existing mobile one-column layout and 16px inputs retained. Submission/privacy behavior unchanged. |
| `/login` login/signup/reset modes | Session | Reviewed named inputs, password visibility, provider availability, busy/error/notice/resend states and mobile shell. No auth logic changed. |
| `/reset-password` | PasswordRecovery | Reviewed checking/invalid/ready/mismatch/submitting/complete branches. Initial proposal to share Session classes was withdrawn after the full suite revealed an intentional separate recovery theme contract. Existing scoped safe-area styling and reset API retained. |
| `/help` | LegalDocument | Trimmed search whitespace; added polite match count and clear-search recovery. Full topic content retained. |
| `/terms` | LegalDocument | Reviewed shared navigation and content rendering. Increased nav/privacy action targets to 44px. Legal wording unchanged. |
| `/privacy` | LegalDocument | Same shared target correction; consent control and privacy text unchanged. |
| `/risk` | LegalDocument | Same shared target correction; risk text unchanged. |
| `/methodology` | LegalDocument | Same shared target correction; methodology text unchanged. |
| `/reliability` | LegalDocument | Same shared target correction; reliability/provider qualifications unchanged. |
| `/changelog` | ReleaseNotes | Reviewed candidate/published labels, grouped release text, feedback link and dismissible published-only notice. Existing wrapping metadata and mobile padding retained. |
| Access pending/error/feature locked | Access / LaunchScreen | Reviewed loading/retry/sign-out boundary and gated content. No access policy/auth changes; LaunchScreen remains shared owner scope. |
| `/auth/callback`, `/auth/confirm` | server handlers | Non-screen authentication handlers, not presentation changes. |

## Regression evidence

`tests/full-app-public.test.mjs` has four regression checks. All four failed on the original source (public-red.log) and pass after the fixes (public-green.log). The red log also retains the initially proposed fifth recovery check, subsequently withdrawn as described above. The green log includes the four retained checks plus seven existing safe-area regressions (11/11). These are source/CSS contracts, not actual browser layout, event interaction or screenshot tests. Tests preserve the legal section rendering contract. An initial full-suite run found the recovery theme contract failure described above; the proposed recovery change was reverted rather than weakening that contract. The final whole-suite rerun is still running at handoff; output is `/tmp/public-full-tests-final.log` (shell session 91279). No failures have appeared so far. The coordinator must record its final result before acceptance.

## Remaining acceptance work

Actual rendered phone/tablet/desktop, both themes, increased text, keyboard focus, auth forms, support form, help search, billing states and all expanded public disclosures remain unverified visually. Live account delivery and legal/provider accuracy are outside this presentation pass. Source inspection is not evidence that every pixel or every interaction is correct.

## Combined candidate verification

After all presentation edits finished, the final `npm run verify` completed successfully: 1,616 tests passed, zero failed or skipped, with lint, formatting, typecheck and production build also passing. The parent summary records API/HTTP/package outcomes separately. Earlier concurrent runs above are historical, not the final result. Browser and device acceptance remain unverified.
