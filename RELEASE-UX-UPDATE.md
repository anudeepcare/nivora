# Mobile controls and workspace update

- Date and other shared selectors use one native control, removing nested pickers and automatic search focus.
- Gamma defaults to all loaded future expirations. Added next 1, 2 and 6 calendar month filters and an optional selected-date-only view. This is expiration coverage, not daily historical data. Provider coverage limits still apply.
- Home accumulation opportunities use one compact list, with small Pace badges.
- Admin navigation uses restrained icon colors and a tinted active section.
- Support messages expand on demand; status colors identify new, in-progress and resolved requests. Email configuration is collapsed.
- Support API returns 50 records per page using timestamp plus ID cursors and server-side status filtering. Screenshots remain fetched only on request. Stale inbox responses are ignored and cancelled.

Email configuration and inbox receipt still need production verification. This update does not claim to fix mail-provider delivery or prove production capacity at 10,000 concurrent requests. Existing database indexes and deployment settings should be monitored as traffic grows. The current contact anti-spam daily submission limit remains unchanged.
