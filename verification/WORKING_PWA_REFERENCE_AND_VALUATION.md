# Working PWA reference and valuation repair — 18 October 2026

## Source and reference

The user supplied AURYN_KEY_PROD(1).zip as a comparison-only working reference. The archive was read without executing, extracting into, or replacing the current project. No credentials from it were inspected or copied. Its active layout uses black-translucent status-bar metadata, normal document scrolling, a sticky safe-area-aware header and fixed mobile navigation. No visualViewport-driven main-shell resizing was found.

The latest 20 origin/main commits were inspected; see pwa-20-commit-audit.json. Internal mobile scrolling appears at 155fa62; visual-height shell sizing appears at 817faf9. This establishes source changes, not which revision first failed on the user's physical device. The current working source was compared byte-for-byte with origin/main c610416 before applying the repair; application differences were the ongoing repair files.

## Current PWA repair

- Matches the reference's black-translucent status-bar mode.
- Restores normal mobile document scrolling and a sticky header.
- Removes locked html/body, fixed-height mobile shell and internal content scrolling. No main-shell height is driven by visualViewport.
- Fixed dock uses max(12px, safe-area-bottom), rather than adding margins and safe-area padding to a reduced viewport height.
- Main content reserves clearance for the dock, including the final footer/controls.
- Navigation memory follows document scroll on mobile and desktop; active-route no-op and delayed-content restoration remain.
- Software keyboard hides the dock. Dialogs retain visual viewport handling; main document does not move/rescale in response to those measurements.
- Search focus highlight surrounds the whole capsule. Keyboard lifecycle includes already-open startup, dismissal, blur and listener cleanup.

This is a source correction using a user-confirmed working reference. It has NOT been tested on a physical installed iPhone and must not be described as a verified permanent device fix. The archive's older screens, provider code and investment logic were not transplanted.

## Valuation repair

- Current price, reported analyst consensus and calculated gap are distinct primary fields. Missing consensus remains missing.
- A consensus target is not relabelled intrinsic fair value. Target horizon is unknown when not supplied.
- Generic EPS/revenue price sensitivities are in a closed, clearly labelled detail section. They remain unvalidated mechanical experiments, not company-specific fair value or buy targets.
- Mobile cases use separate rows and wrapping numeric cells, preventing the demonstrated three-column collision.
- Redundant detailed-page target scale, case explanations and annualised return panels were removed.
- Revenue price sensitivities require consistent reporting/quote currency, shares × quote versus market capitalisation within 10%, reported EV versus equity plus current net debt within 20%, and reported EV/revenue versus EV/TTM revenue within 10%. This catches inconsistent units/bases; it does not independently validate ADR ratios, preferred/minority interests, financing, future margins or company-specific exit multiples.
- Tests reproduce incorrect share units and denominator inconsistencies; no test fixture is evidence of live financial accuracy.

## Six supplied reference examples

reference-screenshot-values.json records NBIS, IREN, CRM, HIMS, CIFR and BE values for audit only. They are not runtime inputs. All six high-end values are approximately 1.15 times their displayed fair value; that observation does not establish the underlying valuation method. Reference quote dates differ from AURYN screenshot dates.

## Remaining scope

Company-specific validated Bear/Base/Bull valuation models, SAP ADR/FX reconciliation, independent live multi-ticker validation, post-change rendered desktop/mobile comparison and physical installed-iPhone acceptance remain incomplete. No production-ready, exact-parity, competitor-superiority or universal coverage claim. No deployment, push, database write, paid AI call or broker order was performed.
