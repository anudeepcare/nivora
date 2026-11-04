# AURYN product reset — design specification

Status: the product direction was approved in conversation on November 4, 2026. This document makes that direction concrete. The visual compositions remain to be demonstrated; this is not approval of unseen screens. No production release is authorized by this document.

## Purpose

Build a recognizable investment research product around AURYN Pace, with readable financial evidence and complete technical depth. Replace the current presentation system, rather than applying another global theme. Preserve functioning calculations, persistence, authentication, and entitlement enforcement.

The earlier full-source ZIP was a checkpoint, not the finished rebuild. Passing unit tests did not establish visual quality. Completion requires both feature coverage and visual/interaction evidence.

## Design decision

Use a precision investment workspace: porcelain surfaces, ink text, blue interactions, restrained typography, rich charts, and a signature five-stage Pace instrument. An ornamental dashboard would repeat the oversized cards and low information density the user rejected. A terminal-only design would make the product intimidating on mobile. The chosen direction combines a clear summary with immediately reachable depth.

Retain Next.js, React, TypeScript, lightweight-charts, and lucide-react from the repository. New components use locally scoped CSS Modules and shared semantic tokens. Product components must not depend on legacy global selectors. The prototype and production render the same components with different data adapters.

## Identity and visual rules — proposed design values

- New vector wordmark and symbol derived from five Pace stages. No black rounded-square tile by default. Test the symbol at 16, 24, 32, and 48 pixels before using it in the PWA.
- Light: canvas #F5F7FA, surface #FFFFFF, ink #162235, muted #526176, border #DCE3ED, action blue #215BE8.
- Dark: canvas #101722, surface #182231, ink #EDF2FA, muted #A9B6CA, border #334155, action blue #8AAEFF.
- Financial positive #087F68 and negative #B83E4B on light surfaces; equivalent accessible lighter tones in dark mode. Color always has a text or symbol counterpart.
- No purple in the default identity. Alternate user accents affect actions and selections, never financial meaning or the wordmark.
- Body 16px / 1.5; table values 14px / 1.4; metadata at least 12px / 1.4; page title 28–32px with 600 weight. Prefer 400–500 weights elsewhere. Tabular numerals for finance. Public hero may use 48–64px on desktop.
- Spacing scale 4, 8, 12, 16, 24, 32, 48. Control radius 8px; major surfaces 12px. A pill shape is reserved for status badges, not every navigation element.
- Touch targets at least 44px. Minimum normal-text contrast 4.5:1; large text and meaningful UI boundaries 3:1. Verify actual combinations, including alternate accents.
- Icons use one consistent stroke family, 18–20px for controls. Each icon represents an action or category. Decorative repetition does not count as identity.
- Motion 120–180ms for feedback; reduced-motion removes travel and animated chart transitions. No flashing quotes or looping background effects.

## Shared frame

Desktop >= 1100px: 208px left navigation, 56px top utility bar, one global search, 24–32px content gutters, maximum workspace width 1440px. Navigation can collapse to 64px by explicit user action. Reading/legal content has a 760px measure; Settings has a 1040px maximum within the same shell. These are intentional templates, not content-dependent width changes.

Tablet 768–1099px: compact rail, no overlapping sticky regions. Mobile <768px: 56px header plus safe-area inset, bottom navigation Home/Research/Watchlist/Portfolio/More, 16px gutters. More contains Discover, Alerts, Settings, and Help. Controls remain reachable above the PWA bottom inset.

One document scroll. Table wrappers may scroll horizontally and must show a visible affordance. Menus/dialogs manage their own overflow only while open. Sticky offsets use shared CSS variables. Back restores the originating list's scroll/filter state.

No separate breadcrumb search and hero search on the same page. The Research landing page places focus in the global search using a clear action; its primary content is the company list.

## Signature AURYN Pace instrument

One visual language: five precise stepped segments with a diamond identifying the active stage. It must remain readable without animation, perspective, gradients, or color. Do not reuse the olive three-dimensional staircase. The expanded treatment may use fine contours and restrained depth; the compact treatment uses the identical stage ordering and labels.

| Code | Primary label | Meaning |
|---|---|---|
| P0 | Pause | No accumulation allocation from this reading |
| P1 | Watch | Watch/hold; not an automatic buy |
| P2 | Start small | Initial planned accumulation, subject to qualification and limits |
| P3 | Add gradually | Gradual planned accumulation, subject to qualification and limits |
| P4 | Deep accumulation | Highest planned accumulation within cash and position limits |

Always distinguish confirmed completed-period readings from current forming readings. Show period, effective date, transition, and evidence link. An unavailable reading must never render as P0. Existing multiplier rules come from the policy engine; the UI must not invent allocations.

Place business qualification and position fit alongside Pace as separately labeled evidence. Do not invent a combined accuracy score. The public hero explains the framework with clearly illustrative data; it must not imply a live stock recommendation.

## Screen composition

| Screen | Composition and primary interaction | Remove from current presentation |
|---|---|---|
| Public home | Product demonstration banner first; concise promise; interactive five-stage explanation; real interface previews; methodology; plans | Hardcoded stock recommendations, repeated text-only feature rows |
| Login/register/recovery | Branded visual beside a compact form; errors beside fields; explicit provider labels and loading feedback | App navigation, oversized empty panels, icon-only provider buttons |
| Home | Compact value/return strip; Pace transitions and alerts; chronological earnings; concise news relevant to followed companies | Duplicate earnings summaries, long news blocks, generic motivational panels |
| Research library | Dense readable company rows: identity, quote, change, Pace, qualification, freshness; sort/filter; recent companies | Oversized search hero and three-column company cards |
| Watchlist | Same row language; conditions and alert management; filter by asset and Pace | Following-count hero and duplicate search controls |
| Portfolio | Value/performance chart; holdings table; allocation/concentration; cash and position fit; transaction/import tools | Repeated company research and unqualified return claims |
| Discover | Purposeful filters, results with why-matched evidence; accessible mobile filter sheet | Empty labs and fabricated opportunity rankings |
| Alerts | Condition, previous/current value or stage, triggered time, delivery state, edit/delete | Ambiguous alerts without transition context |
| Settings | Left category list, right compact preference forms; account/billing/security reachable | Huge title area, long single-column accordion page, repeated support links |
| Plans | Exact Free/Pro capability comparison, present entitlement, clear billing state | Hidden features that look like lost data |
| Help/legal/contact | Searchable learning topics, readable documents, working support form | Duplicated legal navigation on every research panel |

Home links to detailed datasets instead of reproducing them. Research contains company-level evidence; Portfolio contains ownership-level consequences. Every section has one primary job.

## Company research composition

At 1440x900, the initial viewport must show the company/quote header, research navigation, Pace state, six key metrics, and at least 320px of chart height. Test this with long company names and stale-quote metadata. On mobile, show identity and quote, compact Pace with evidence action, then the chart; no requirement to squeeze the entire desktop composition into one screen.

Desktop overview: compact company header; one tab row; six-column metric strip; chart occupying approximately 70% of the working area and compact Pace/evidence panel occupying 30%. The chart receives priority over explanatory prose. Below: next event and concise decision evidence. Full analyst ranges belong to Analysts; full model scenarios belong to Valuation.

Research destinations: Overview, Business, Valuation, Technicals, Analysts, Options, Ownership, News & earnings, Advanced. Preserve old tab query values as aliases. Mobile uses a labeled selector and previous/next section actions, not nine compressed tabs.

| Destination | Required evidence and interactions |
|---|---|
| Overview | Quote/freshness, confirmed/forming Pace, business qualification, valuation context, six metrics, price chart, next event |
| Business | Revenue/growth, margins, operating cash, capex/FCF, balance sheet, shares/dilution, financial statements, TTM/annual/quarterly controls, source details |
| Valuation | Bear/base/bull, explicit assumptions, relevant multiples, cash-flow model and sensitivity, asset-specific limitations |
| Technicals | Chart; studies grouped Trend/Momentum/Volatility/Participation; price references; custom anchors; historical Pace evidence |
| Analysts | Rating distribution, target range, coverage, revisions, dates; separate opinions from model outputs |
| Options | Market map, contracts, long-term, strategy builder, learning; expiration; IV/Greeks when supplied; gamma assumptions |
| Ownership | Institutions, insiders and filing dates; business/case evidence retained in a named subsection |
| News & earnings | Company news, schedules, reported/estimated results, guidance when available, source/time |
| Advanced | Existing risk/conditions, position design, expectations, market context, historical analysis |

Charts: separate range (1D,1W,1M,3M,6M,YTD,1Y,5Y,All) from interval (daily/weekly/monthly). Indicator settings identify calculation timeframe. Chart timeframe changes must not relabel unchanged daily indicators as weekly. Hover/touch inspection shows actual date and value. Drag/zoom is intentional and never captures ordinary vertical mobile scrolling. Bear/base/bull use aligned three-column comparisons, not independent uneven cards.

## Data and coverage contract

Before migrating a route, enumerate its interactive controls, accessible datasets, feature gates, and persisted state. Map each to a destination and verification case. Source presence alone is not evidence of current reachability or successful live data retrieval.

Metric presentation states: available, stale, missing, insufficient-history, restricted, error. Include unit, currency, period, as-of, definition, and provenance where applicable. Never convert missing to zero. Never use mock data to conceal a production gap. Quote, target-upside, and position values must use an explicitly consistent quote snapshot or label their differing timestamps.

Keep the financial model layer unchanged during presentation migration. Add new indicators only after specifying their calculation, minimum history, source, and validation. Distinguish 200-week linearly weighted WMA from 200-week simple MA.

## Prototype-to-production contract

Create the new UI under a dedicated `components/v2/` namespace. Use typed adapters over existing services. Fixtures and live adapters feed identical rendering components. The design preview is local-only and clearly labeled; fixtures never enter authenticated production responses.

Prototype all routes and research tabs before production replacement. Use representative long names, negative values, sparse history, zero holdings, full portfolios, and denied entitlement states. Approve actual rendered desktop/mobile screens. Do not recreate approved screens in a second component tree.

Migration is route-by-route behind a local development switch. Remove legacy style dependencies for each migrated route; do not append broad selector overrides. Retire `app/core/compatibility.css` only after all supported surfaces are migrated and tested. Keep a revertible checkpoint. No push/deployment is part of design approval.

## Acceptance gates

1. Coverage: every existing route, research tab, subview, metric family, and account action mapped; unknown or unreachable features explicitly flagged.
2. Visual: screenshots at 390x844, 768x1024, 1440x900, 1920x1080; light/dark; long text; 200% text zoom; no clipping, overlap, or horizontal document scroll.
3. Interaction: keyboard focus, menus, dialogs, search cancellation, table sorting, pagination, chart controls, route back/forward, scroll restoration, safe areas, empty/error/retry paths.
4. Data: 200 representative symbols with currency/period/split handling, stale quotes, missing fields, history constraints, calculation checks and external-reference checks where authorized data is available. Report passes, discrepancies, untested and unavailable separately.
5. Access: logged out, Free, Pro, expired, billing-error and owner/admin states; client preview never bypasses server enforcement.
6. Performance: measure production build under a recorded device/network profile; targets p75 LCP <=2.5s, INP <=200ms, CLS <=0.1 where field data exists. Lab runs remain labeled lab. Cached section changes target <=150ms visible response; API-dependent content reports loading honestly.
7. Delivery: source ZIP with setup, route/feature ledger, visual evidence and test report; no secrets or generated dependencies. Release only after unresolved blockers are identified and accepted.

## Current implementation status

This is a specification, not a claim of completed implementation. The current source still has the old shell, repeated compositions, and compatibility styles. Metric and route inventory is an initial source-derived baseline, not a finished exhaustive audit. Visual prototype approval and full acceptance runs remain outstanding.
