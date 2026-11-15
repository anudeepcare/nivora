# AURYN experience redesign — November 15, 2026

## Status

This is a **source candidate for preproduction review**, not a deployed or production-accepted release. It replaces the earlier composition pass with structural changes across Home, Research, News and Portfolio. The previous system-audit and loading corrections remain included. No provider, financial calculation, Pace classification, authentication, subscription, payment or migration behavior was changed.

## What is different

### Home: a briefing rather than a stack of tools
- A dated, source-backed 30-second briefing shares the desktop opening with the actual portfolio session. The next event is chosen chronologically, not by portfolio weight.
- A slim source strip distinguishes checked, incomplete, loading and stock-only coverage. New accounts have no links to sections that do not exist.
- News and the agenda now come before followed-company chart cards. The lead headline has clear editorial hierarchy without an invented summary or price-move explanation.
- The company grid is accurately titled “Companies you follow,” not a broad-market reading.
- Contributions, monthly plan, saved reviews, radar, Pace and detailed coverage remain together in a lower workbench, reachable from the top shortcut.

### Research: decision, explanation and evidence
- Context controls, the existing branded Pace action and the actual price chart form one coordinated decision workspace.
- The repeated four-card action/analyst/risk summary is replaced by the supplied decision’s explanation, its key risks and explicit conditions that would change the view. Additional risks/conditions remain in a disclosure; financial metrics are not hidden.
- This conclusion sits beside the canonical scenario range on wide screens. Bear/base/bull, analyst-range provenance, consensus-only data and all eight company metric cells/four evidence grids remain available.
- The former separate duplicate risk panel is removed. Source freshness and deeper methods remain distinct.

### News: company mentions and primary evidence
- Supplied headlines are ordered by their actual dates and deduplicated. The default view contains headlines that mention the company name or explicit ticker; unrelated returned stories remain accessible under “Broader coverage.” Matching limitations are stated plainly.
- This addresses a live review finding where unrelated companies’ headlines appeared as NOW coverage. Title matching is not a claim of article accuracy or price causation.
- The feed has a distinct lead story, visible source domain/date, relevance controls, refresh and expansion beyond six articles. No generated sentiment, story summaries or invented timestamps are added.
- Filings occupy a separate primary-record rail alongside earnings and transactions. Partial filing errors remain visible, and additional supplied filings can be expanded.
- Scheduled earnings use the existing freshness checks; an old dataset is not presented as a newly confirmed event. EPS accounting/currency limits remain explicit.

### Portfolio: balances, comparison, holdings
- A purpose-built balance layout distinguishes net view, priced investments, cash, recorded cost and margin. One evidence-based read replaces stacked snapshot summaries.
- The price comparison is directly after balances, with visible desktop SPY/QQQ choices and the existing single phone selector. It remains a reconstructed price path of today’s holdings, not fabricated account performance.
- Allocation and exposure form a coordinated row. Searchable holdings are full width and precede the scenario panel in both DOM and responsive layout.
- Position-decision evidence, transactions, cash tools, analysis and scenarios remain accessible. Earnings-company counts deduplicate purchase lots.

## Verification and limits

Final combined `npm run verify` passed: lint, formatting, **1,515/1,515 tests**, TypeScript and production build. `npm run test:api` also passed with controlled fixtures and 56 production file traces. See `verification/experience-recomposition-20261115/summary.json` for results and limits. New regression tests were demonstrated failing before the corresponding fixes. Independent source review found and prompted corrections for dead empty-workspace anchors, overly tall initial summaries, duplicate-lot earnings counts, non-Latin headline deduplication and hidden partial filing warnings.

**Browser acceptance remains open.** The live preproduction baseline and supplied screenshots were reviewed before this redesign. Candidate navigation to the documented local preview returned `net::ERR_BLOCKED_BY_CLIENT`. A separate installed headless-browser attempt to render local isolated components could not start because process sockets were not permitted. No alternate hostname, tunnel, deployment or sandbox disablement was used. No after-change screenshot or physical-device verification is claimed. Responsive rules and render tests are not visual proof.

Before deployment, review populated, empty, partial and expanded states on desktop, tablet and phone: the briefing/portfolio pairing, agenda/news balance, Research metric help and decision context, news relevance switching and filing expansion, Portfolio benchmark retry, holdings/scenario order, keyboard focus, history and modal dismissal. Live current-company financial/estimate/history validation and source parity remain inherited open gates. No investment outperformance or forecast-accuracy claim is made.

## Local use

Node 24.x. Run `npm ci`, `npm run verify`, then `npm run test:api`. Fixture preview: `AURYN_ENABLE_PREVIEW=true npm run dev`, then `/preview/overview`, `/preview/research/MSFT` and `/preview/portfolio`. Fixture values are not live evidence.

The ZIP places `package.json` at its root and excludes dependencies, builds, credentials, environment files and transient captures. `MANIFEST.sha256` covers every packaged file except itself. No source was pushed or deployed; no purchase was made.
