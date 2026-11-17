# Visible changes and integration correction

## What happened

The first ZIP contained real backend and secondary-tool changes, but two enhanced components were connected only to obsolete overview implementations. The active route imports `IntegratedResearch` from `Research.tsx`; it did not render `CompanyMetrics` or `PositionExplorer`. Isolated component tests passed without catching this integration gap. This was an implementation miss, not evidence of a deployment-cache failure.

The corrected ZIP connects both to the actual Research overview. Contextual company metrics are shown by default; `Review position size & cash` opens the existing cash/concentration review on demand. `All research metrics` retains the complete evidence grid without duplicating it by default. The position-review chunk remains lazy. Two new rendered active-overview regressions cover these connections.

## Where changes appear

| Location | Observable behavior |
| --- | --- |
| Initial authenticated workspace opening | Small Auryn mark and “Opening your workspace”; recovery appears only if genuinely slow or failed. Fast loading is not deliberately prolonged. |
| Research → Overview, metrics area below valuation/consensus | Corrected ZIP: contextual metric strip with reporting dates and per-share figures where available; “More company metrics” on narrow layouts. |
| Same Overview area | Corrected ZIP: “Review position size & cash” opens funding shortfall/remaining recorded cash and concentration review. Complete usable prices and holdings are required for funding feasibility. |
| Same Overview area | Corrected ZIP: “All research metrics” expands business, valuation, technical and ownership evidence. |
| Research → Labs → Research tools → Expectations | “Funding & dilution cases” switches to the existing funded Bear/Base/Bull model. Unsupported sectors show a reason; future assumptions are not fabricated. Existing advanced-feature entitlement applies. |
| Research → News & earnings | Earnings snapshot → “What changed in the business?” expands comparable annual filing changes. Missing comparable evidence is disclosed. |
| Workspace tools → Strategy lab | “Current v6 · technical rules only” versus “Legacy v5 · price-only research”; current v6 correctly has no completed eligible execution months yet. |
| Research → Options | Labels formerly 10–11px are 12px; mobile input/select text is 16px. This is a modest readability change, not a layout redesign. |
| Research → Overview freshness; stock facts | Context-dependent quote time, older dataset labels and consistent upcoming earnings selection. |
| Portfolio review | Existing candidate review separates business rationale from concentration attention. |

Home and the overall navigation/composition were largely unchanged. Most of the first ZIP's work was correctness and secondary-tool functionality, not a broad visual redesign. The report should not be read as claiming otherwise.

## Deployment identity

The user-deployed first ZIP is commit `49c9f022a20bb12e9a67210ee325c9d436fce4de`, READY at `nivora-enf02pdyu-anudeeppaleru.vercel.app`; 865 application/library/script/test files match that ZIP exactly. The branch alias `nivora-git-preprod-anudeeppaleru.vercel.app` points to this deployment.

The earlier immutable URL `nivora-nh6hiy9wd-anudeeppaleru.vercel.app` remains the old `b050ff2` deployment. Reloading that old URL does not turn it into the new deployment. No evidence establishes an asset-cache failure: the service worker uses network-first navigation and does not cache JavaScript or account/API responses. An already-open app tab still needs an ordinary reload on the correct URL to load new code.

The correction in this ZIP is local only and has not been pushed or deployed by the assistant. No runtime feature switches, data subscriptions, security settings or production code were changed remotely.

## Verification

Corrected source: 1,280 tests passed, including the two new active-overview render tests; typecheck and lint passed. Release-build result is recorded in the main enhancement report. Actual authenticated browser/mobile validation remains pending the existing cloud-browser Vercel sign-in handoff; render tests do not certify visual appearance or physical iOS/PWA behavior.

## Missing Bear/Base/Bull follow-up

Two confirmed calculation blockers are corrected in this ZIP: missing/nonpositive vendor EV/revenue no longer prevents independent reconstruction when all corroborating financial and dated listing evidence qualifies; EPS from a different or invalid fiscal year no longer blocks a valid selected-year revenue range. Revenue estimate ordering is also validated.

Focused tests cover IREN, HIMS, CIFR and NBIS using explicitly synthetic complete and incomplete evidence. These tests establish algorithm behavior, not the current availability of live vendor inputs. The authentic archived IREN snapshot lacks field-specific listing/share dates, so its per-share fundamental scenarios correctly remain unavailable. It supplies only one consensus target, not analyst low/high bounds; those bounds have not been fabricated. Current live snapshots for all four tickers remain unverified behind preview authentication.

When source evidence is incomplete, the existing Bear/Base/Bull cards remain visible with “Not calculated” and the missing-evidence reason. Separate consensus remains separate. User-entered sensitivities are available under Research → Labs → Research tools → Expectations → Funding & dilution cases, subject to the existing entitlement and explicit assumptions. This correction cannot promise numeric ranges for every ticker without reliable inputs.

## Screenshot-driven follow-up (local source after deployed 9152947)

The three user screenshots show IREN, NBIS and ASTS, not HIMS or CIFR. Their cards render but have no calculated targets. IREN reports incomplete EPS and matched cash/debt; NBIS reports absent dated listed-share observations; ASTS reports unsupported sector valuation. These are different from the two previously corrected calculation blockers.

The business-review headline now reads “Review business” without attaching an eligible P-code; the separate current reading explicitly says “Price zone P2” (or the applicable zone). This removes the misleading P1 headline versus P2 scale combination while preserving the actual business decision, eligible contribution level and provisional price reading.

Live-provider confirmation still requires the existing authenticated preview browser, or sanitized Research API JSON for IREN, HIMS, CIFR, NBIS and ASTS containing company, quote, history, evidence and facts only. Do not supply credentials, cookies or private holdings. Screenshots establish visible symptoms but cannot establish raw field provenance. No assertion is made that every ticker now produces numeric targets.

The provider mapping now recovers a missing aggregate debt field from complete same-row shortTermDebt + longTermDebtTotal, or the provider-defined netDebt + cash identity. Explicit aggregate debt takes precedence, including zero. Conflicting identities, partial or invalid values remain unavailable; calculated facts retain derivation provenance. This can restore a missing input but does not establish that current IREN has those fields or satisfies the remaining listing/estimate checks.

Provider references: https://eodhd.com/financial-academy/financial-faq/fundamentals-glossary-common-stock and https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds . Neither the dataset UpdatedAt nor historical share period-end is promoted to a field-specific market observation date.

For infrastructure and frontier companies, “Build funding assumptions” now opens the existing lazy-loaded workbench directly from the unavailable scenario section, behind the same Advanced feature entitlement. ASTS guidance calls for deployment/commercial milestones, capex, cash runway, financing and dilution. Infrastructure guidance distinguishes contracted capacity from realized revenue. These are explicitly user-entered conditional cases; they do not replace or silently populate automatic AURYN targets. Other unsupported sector gates are retained.

Latest validation: 1,288 integrated tests passed, plus lint, full formatting and typecheck. After the final denied-access display correction, 104 affected UI/model/provider tests passed and focused ESLint passed. No authenticated browser/mobile test is claimed. Final release-build status is reported with the delivery.

Final optimized release build passed after the final access-state correction.
