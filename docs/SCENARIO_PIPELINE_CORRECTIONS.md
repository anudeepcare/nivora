# Shared scenario pipeline corrections — 2026-10-19

## Reproduced failures and corrections

1. Revenue selection previously ranked forecasts before checking complete low/average/high values. An incomplete record near the preferred horizon could hide another complete annual forecast. Complete, ordered, same-currency and fiscal-compatible records are now filtered before horizon ranking.
2. EPS selection could select a malformed fiscal label before rejecting it, despite another eligible forecast. Fiscal-compatible candidates now participate in selection; an isolated malformed record is still rejected.
3. The most recent cash record could lack a matching debt record and prevent use of an older complete pair. Selection now finds the latest complete matching cash/debt pair within the existing freshness limit, retaining the same period, accession and currency requirements. The scenario exposes its balance date. Cash and debt from different reports are not combined.
4. Flat provider forecast records with explicit FY labels were incorrectly classified as quarterly. Annual FY and relative-year labels are recognized. Ambiguous dated records remain Unknown rather than being assumed annual.
5. Infrastructure suitability previously relied on a short known-symbol list. Relevant provider industry metadata now classifies arbitrary data-center and digital-asset-mining listings without adding ticker-specific production exceptions.

The unavailable-state disclosure now shows the underlying model rejection reason. Missing balance/share/multiple inputs identify the specific unmet categories rather than claiming all categories are missing.

## Validation

The focused regressions reproduce the pre-change failures and pass after correction. A synthetic 45-combination normalization-to-model matrix covers three provider forecast shapes, three completeness patterns and five business/listing types. Successful cases must remain finite, ordered and tied to one eligible forecast end date. Insurance cases remain unsupported; banks lacking valid EPS do not receive operating-company cash-flow or revenue substitutes.

These are synthetic coverage checks, not valuations of 45 actual companies or proof of coverage across thousands of live listings. Unit checks continue to reject missing shares/debt, mixed currencies, incorrect share units, EV/revenue denominator conflicts and stale observations. No missing inputs, low/high estimates, ADR ratios or foreign-exchange rates are fabricated.

## Live data boundaries and cost

The connected Twelve Data revenue-estimate checks for IREN and NBIS returned a plan-entitlement restriction during this investigation. This does not establish that those fields are unavailable from the user's paid EODHD account. No local private EODHD token or authenticated deployed research payload was available to audit the exact remaining per-ticker inputs. No subscription upgrade or new paid endpoint was added. The existing EODHD fundamental response and existing fallback wiring remain the sources.

No claim that these changes alone populate every actual ticker. Missing forecasts, unsupported sector models, listing/currency conflicts and current account entitlements can still prevent defensible numerical cases. Revenue scenarios remain conditional sensitivities with explicit multiple/dilution assumptions, not funded capacity forecasts or independently validated intrinsic values.
