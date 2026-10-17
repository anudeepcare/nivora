# Independent review and correction record

A fresh Astra reviewer inspected only the new application. Three findings were returned:

1. Incomplete month-end data could be confirmed within a four-day tolerance. Replaced the tolerance with an expected US final-session check (or calendar-final-day for crypto), including recurring month-end holiday cases. Added the January 27 vs January 31 regression test. Unanticipated closures withhold a signal.
2. Global search could discard exchange identity and load another instrument with the same ticker. Search now limits equity results to supported US/USD listings and USD crypto pairs; quotes enforce the equity boundary. A built-handler test supplies conflicting foreign and US results and asserts the foreign listing is excluded.
3. Foreign/unknown cash could be counted as USD. Totals, allocation and holding rows now require explicit USD currency and USD cash symbol; other cash is excluded and identified. Added regression tests.

The reviewer did not validate commercial feature completeness or visually inspect the app. These gates remain open.
