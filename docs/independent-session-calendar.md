# Inactive bounded 2026 session schedule

Version: `us-regular-equities-2026-schedule-v1`. Source inspection date: 2026-11-18. Source publication timestamp is not supplied and remains null.

## Scope

Only explicit MICs XNYS and XNAS, regular equities, local dates 2026-01-01 through 2026-12-31. No aliases, OTC, other exchanges, options, pre/post-market or prior/future years. Weekdays are regular 09:30–16:00 America/New_York except the published holiday and early-close dates below. IANA timezone conversion supplies UTC instants, with round-trip validation, not hand-written DST rules.

Both exchange calendars list closures on January 1/19, February 16, April 3, May 25, June 19, July 3, September 7, November 26 and December 25. November 27 and December 24 close at 13:00 Eastern. No inferred July 2 early close.

Primary sources directly checked:
- https://www.nyse.com/trade/hours-calendars
- https://classic.nasdaqtrader.com/Trader.aspx?id=Calendar
- https://classic.nasdaqtrader.com/content/TechnicalSupport/nasdaq_sys_hours.pdf

This is a transcription of the **published schedule**, not observed venue operation. The calendars do not establish that exceptional closures, halts, later notices or revisions have been reconciled. Retrospective lookup uses this November snapshot; it does not assert what was known on the queried historical date. Future dates remain scheduled, not a promise of actual opening.

## Contract and limits

`scheduledSession(mic, date)` returns scheduled/closed/unknown with open/close UTC instants when applicable. `latestScheduledClose(mic, asOf)` accepts a strict UTC instant and searches only within this year's New York dates. Close equality means the scheduled close has occurred, not that a vendor bar is final. January queries needing the previous year's session return unknown. An early UTC January 1 instant can still be December 31 in New York.

Every result retains immutable version/source/coverage metadata and explicitly returns `calendarVerified:false`, `actualSessionVerified:false`, `providerBarFinalized:false`, `readyForPace:false`. These flags are not promoted by elapsed time or a price row's presence. No output contains a Pace stage or trade instruction.

The server-only facade is the intended future server entry. The pure module permits deterministic unit testing; there are no application consumers or routes. No provider credentials, SentiSense/EODHD requests, paid calls, new vendor integrations or production changes occurred. Official exchange documents are reference evidence, not an added market-data provider.

## Remaining production blockers

Trusted venue/security mapping; complete historical coverage for the actual lookback; exceptional-closure/revision monitoring; security-specific suspension treatment; a verified provider final-publication policy and receipt; point-in-time data vintages when required. Do not infer session completeness from missing bars or certify a stale snapshot as current. This module does not unblock production Pace.

## Verification

Synthetic query tests cover every listed holiday and both early closes/venues, ordinary days/weekends, both DST transitions, precise close boundaries, New York/UTC year boundaries, invalid dates/venues and immutable fail-closed flags. No fixtures assert actual venue operation or actual market prices. Independent review and integrated tests/build remain separate release gates.
