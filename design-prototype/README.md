# AURYN design review · first pass

This is an isolated, interactive Next.js prototype. It does not import the rejected application styles, send credentials, query market data, mutate portfolios, or connect billing.

## Run
From this directory, `npm install` then `npm run develop`. The parent repository's installed dependencies are sufficient in the current workspace. `/mobile.html` embeds the same frontend at a 390-pixel viewport for phone review. `All screens` opens the review navigation. The toolbar offers light/dark and populated/loading/empty/error/stale states.

## Baseline and coverage
Candidate pre-redesign baseline: `ef216a3` (October 28 release, parent of November 3 changes). This is inferred from local Git history, not user-confirmed. `data/source-inventory.json` indexes 122 baseline component files. `data/financials.json` carries 36 existing financial definitions. Newer features such as technical reference maps and options gamma are included as review surfaces.

Available: public landing, how-it-works, pricing structure, approach, Pace guide, help/contact, legal reading shell; sign-in/signup/recovery; Home, Research, Watchlist, Portfolio, Explore, Settings. All nine research sections and their declared secondary views are navigable. Financial catalog, technical indicator groups, analyst distribution, gamma heatmap, option chain, news and earnings layouts are represented.

## Honest limits / not ready for full approval
This is a first-pass design prototype, not a complete parity release. Sample financials and headlines are invented and explicitly marked. Legal text and pricing are reserved for authoritative existing content. Detailed add/edit/import dialogs, full source-specific evidence, crypto/specialist-company variants, all advanced computations, option payoff calculations, OAuth/email flows, billing, durable persistence and complete feature-to-field reconciliation remain pending. Several controls explain their intended behavior rather than execute it. No live business decisions should be made from the preview.

## Fidelity contract
The approved frontend must be retained as the integration source; replace sample-data adapters, not layouts. Before final approval, split the prototype into stable production modules, add fixture coverage for long names, sparse and delayed data, specialist businesses, and large portfolios, and review every deep interaction at desktop and phone widths. Capture approved rendered screens at agreed sizes and compare the integrated app against those same fixtures and viewports.

No production code or existing styles have been modified. Do not deploy this preview over the app.
