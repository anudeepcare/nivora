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

## Verification for this cleanup
Home was visually reviewed in the local browser using illustrative data. The existing suite completed 968/969 checks; the timing-sensitive provider minute-budget database assertion failed once and passed when rerun alone. This cleanup does not change that database rule. Physical iPhone and authenticated external comparisons remain pending.
