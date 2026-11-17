# Screenshot-driven UX refinement — October 26, 2026

This release keeps the approved design and addresses the eight supplied screenshots.

## Changes

- Settings is one route-based screen. Avatar, rail and Explore enter the same screen; the redundant SettingsSheet is removed. Back carries the prior workspace pathname, query and anchor. Sign out is immediately visible, with busy/error handling; account mutations remain disabled in the sample preview.
- Plans/header and Settings navigation use consistent readable type. The mobile avatar stays visible. Reduce motion now has one accessible switch thumb instead of competing CSS pseudo-elements.
- Explore opens an explicitly labeled tools dialog, leaves the current route in place, and omits the destination already being viewed. The Pro feature link now points to Plans rather than Settings.
- Buy/wait totals count actual included reasons. In the supplied Bloom screenshot, four buy factors had summed to ten; ten was importance weight, not ten reasons. Factor numbers are now plain impact labels, and the scale uses one marked circle per reason. No six-circle truncation. Circle size and balance remain qualitative; calculated Pace and verdict are untouched.
- Connected evidence uses green/amber/blue highlights with visible selected/focus states and plain phrases. "Conditional cushion" is replaced with growth-assumption wording. Clicking a phrase selects the corresponding evidence metrics.
- Scenario cards explicitly separate potential gain/loss, resulting investment value, scenario price and dated reference. Grid layout prevents inherited horizontal flex styles from overlapping amounts and prose. All amounts remain derived from the existing scenario engine.
- Pace drawer styles now apply in the new evidence container. Completed and developing months are visually separated. SVG coordinates are rounded to prevent cross-engine floating-point hydration differences; SVG titles use one text string.

## Verification

640 automated tests passed, including reason-count and Settings/navigation regressions. TypeScript and production build passed; see verification/REPORT.json and the ux-refinement logs for the latest command results.

Browser QA used actual Next.js sample pages in managed Chromium. Desktop, 360×740 and 390×844 frames were checked. Phone document scroll widths equaled client widths (350/380px with browser scrollbars). Scenario children did not overlap on desktop or phone. Colored evidence phrases changed the visible metric section. Pace opened with a three-column reading on desktop. Settings Back returned from /preview/settings to /preview/research/MSFT; clicking the avatar while already in Settings opened no duplicate modal. Mobile Sign out was visible at y110–154, and all category and shortcut labels measured 14px. Mobile Explore showed tools and omitted Settings when already on Settings. The Plans page had no horizontal overflow at 360px. Final research reload had no application errors in the latest console entries after the SVG hydration fix.

Sign-out handler behavior is tested with controlled auth transports; no real account was signed out. No live provider, email, payment, or production persistence verification was performed. Temporary review HTML, preview environment settings and development frame permission were removed before the production build. Production frame policy remains DENY. No new dependency, migration, production push or deployment.
