# AURYN UI and reliability pass — November 6, 2026

This source package includes the cumulative prior fixes and the additional reliability and interaction fixes below. It is not a claim that every production/device scenario has been reproduced.

## New fixes

- Workspace API preserves authentication rejection (401), allowing the client's coalesced session refresh and single retry. Actual permission errors (403) and temporary service errors (503) have distinct messages. No database access policy was weakened.
- Workspace, access and preference requests have a 20-second connection deadline; other data requests have 90 seconds. Caller cancellation remains supported. This deadline covers waiting for response headers, not arbitrary downstream processing.
- Browser back/forward-cache restoration refreshes session state without reloading the entire application. Async restoration is ignored after unmount.
- Navigation links show immediate pending feedback, with reduced-motion support.
- Default dark selected controls now have a distinct fill and readable text.
- Mobile header and dock use more readable translucent surfaces and a smaller blur radius. Scrolling legal cards no longer apply backdrop blur.
- Removed residual decorative colored edge bars across research, home, options, comparisons and release notes.

## Cumulative fixes retained

Compact Holdings toolbar (one desktop row, two mobile rows); mobile theme control beside avatar; dark-safe HIMS/NOW logo backgrounds; safe-area-aware PWA header and black-translucent Apple status-bar configuration; duplicate Pace headline label removed; Completed Pace remains the default and Forming is an explicit preview; actual date range in daily-close captions; aligned Help/legal content; corrected Contact checkbox/file controls; single public closing banner and footer; reduced mobile footer spacing.

## Checks actually performed

Real hydrated React pages in a same-origin local browser iframe, not static screenshots. Fixture data and disabled account actions were used.

| Area | Result |
| --- | --- |
| 390px mobile account menu and settings navigation | Passed |
| Light/Dark selection, dark selected-control computed colors | Passed |
| Mobile Holdings search filtering and compact toolbar | Passed |
| All nine primary research tabs open | Passed |
| Four Targets sub-tabs | Passed |
| Pace Completed/Forming selection | Passed |
| Chart 1D/1W/3M controls change selected state | Passed; live market correctness not established by this UI check |
| Advanced research content at 768px | Passed |
| Help topic search | Passed |
| Contact topic selector and diagnostic checkbox | Passed; no message sent |
| Discover filter controls/reset | Passed; no live scan certified |
| Compare explanation dialog opens/closes | Passed; no live comparison certified |
| Alerts condition exposes price input and preview | Passed; no alert persisted |
| Desktop global search opens, Escape closes | Passed |
| Document-width overflow at observed mobile, tablet and desktop pages | None observed |
| Public home single closing banner/footer | Passed |
| Methodology desktop heading/layout | Passed |
| Automated regression tests | 1,064 passed, zero failed |
| Production build, TypeScript checks and 34 static pages | Passed |

## Live read-only diagnosis

The connected workspace database has row-level ownership policies and authenticated SELECT permissions on workspace tables. Its health advisor reported no findings. Aggregate recent logs contained both successful workspace reads and authentication-rejected reads. The API previously converted the latter to a generic 503 permissions message; this package corrects that classification. No account rows, tokens or credentials are included in this report.

## Still requires deployment/device verification

- Installed iPhone PWA status-bar appearance, safe areas, keyboard, background/resume and scroll frame pacing across themes.
- Expired-session recovery against the deployed application and the affected account. Unit tests cover retry/coalescing and API classification; production recovery is not yet certified.
- Live Options data, provider latency, real account mutations and contact delivery were not exercised through preview fixtures.
- No production performance trace or device-level 60fps guarantee is claimed. Smaller blur surfaces, retained mounted state and pending feedback reduce known sources of poor responsiveness, but measured device performance remains a release check.

## Packaging

Temporary responsive QA harness removed. Production X-Frame-Options DENY restored. Package excludes local environment files, dependencies and generated build output. SHA-256 manifest and ZIP CRC are checked by the packaging script.
