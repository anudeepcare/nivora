# Experience changes: SentiSense migration

This is a source-change record, not a full-app visual acceptance certificate. Earlier release notes describe earlier builds.

## Included

- Public landing retains the supplied Research / Decide / Review structure and schematic Pace illustration. Destinations now lead to discovery, watchlist, portfolio and the guide. Copy distinguishes conditional research from recommendations.
- Help is a searchable field guide with three task journeys. Topic explanations open in existing accessible dialogs rather than expanding the grid. Policy pages retain their separately versioned text and privacy controls.
- Portfolio balance and card surfaces use the shared glass treatment, with opaque reduced-transparency fallback.
- Options uses a dedicated end-of-day aggregate experience when the API explicitly declares aggregate-only coverage. It shows activity, open interest, IV and expected moves with a date. Missing metrics remain missing; zero remains zero. It does not pretend an aggregate is a contract chain or trade tape. Existing chain tools remain available for sources that support them.
- `AURYN_USER_GUIDE.md` explains the research workflow and data distinctions.

## Checks executed

95 focused public/help/control/aggregate tests passed. Modified TSX ESLint and `tsc --noEmit` passed. These checks exercise rendered React markup, source contracts and types, not screenshots or physical devices.

## Release gate still required

Compare actual rendered public, sign-in, Home, every Research subtab, Watchlist, Portfolio, Settings and Help against the approved references at mobile and desktop widths, in light and dark modes. Exercise loading, empty, denied, partial and error states. Verify touch navigation, dialogs, email-edit layout, safe areas and installed iPhone PWA. Recheck actual quote/chart/Pace/scenario responses before release. No production deployment was performed by this UI workstream.
