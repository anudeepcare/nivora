# AURYN 1.0.0 — lean source handoff

Copy the contents of the AURYN folder into the app root of your repository. Keep your existing environment configuration. Do not nest this AURYN folder inside another app folder accidentally.

## Changes in this handoff
- Removes archived screenshots and prototype files from the source archive. Removes the unused Home ResearchLens function and its CSS.
- Compact stock facts and decision panels reduce vertical whitespace.
- Home comparison uses a carbon/citron banner; workspace headings use restrained violet/citron color. Public Home has a lighter, more compact hero.
- Pace has a larger action, a connecting stage rail, a subtle diamond watermark and clearer conditional-change typography. Existing financial rules are preserved.
- The research chart links explicitly to Gamma & options. Existing options analysis contains strike exposure and heatmap views; it requires supplied gamma and dated open interest. It does not establish dealer holdings or guaranteed support levels.

## Included
Application source, package lock, tests and fixtures, scripts, deployment guidance, SQL and Supabase migrations. Dependencies, build output, local environment secrets, screenshots and prototype archives are excluded.

Archive size reduction improves download and repository size. It does not by itself demonstrate faster market-data APIs or improved investment results.

## Verification for the current source candidate
975 tests passed. Production build and all API regression scripts passed with synthetic/mocked transport. The final Pace disclosure style passed a CSS parser check. Physical iPhone and authenticated live-provider acceptance remain pending.

## Approved readability redesign
Business-focused header facts replace the previous-close strip. Historical price range and volume are inside chart context; the quote Help follows the displayed movement basis. Banks and insurers use the shared business classification. No finance/provider credentials are included.
Options has its own scoped color/contrast layout, expiry controls, tinted positioning cards, readable tables and preserved payoff calculations. Calculation detail is contextual; repeated consensus and overview guidance are consolidated. Portfolio CSV import controls are removed; saved holdings and manual position management remain. Home cards can show supplied EPS actual/estimate values; future actuals remain withheld.

Verification limits: local browser review uses illustrative research and a synthetic Options snapshot. It is not authenticated live-provider validation or physical installed-iPhone acceptance.

## Compact metrics and section icons
Header facts are now inline; source/reporting dates remain in each fact’s Help. Technical rows use metric Help instead of nested accordion boxes. Fibonacci/reference grids have one surface per item without an outer frame. Shared decorative section icons cover technical groups, valuation, historical outcomes, stock facts and workspace section headings. No calculations or provider configuration were changed in this refinement.
