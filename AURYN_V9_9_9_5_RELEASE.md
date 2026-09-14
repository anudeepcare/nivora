# AURYN V9.9.9.5 — Unified Market Truth

Goal: one price, one timestamp, one session, one freshness state everywhere.

- Adds a canonical display Market Truth object containing price, provider, provider timestamp, checked timestamp, session, freshness, confidence and age.
- Research header and Research overview/trust receive the same display truth instead of independently interpreting timestamps/session.
- Provider timestamps remain UTC internally.
- Browser renders price time in the viewer's local timezone using Intl.DateTimeFormat; no Texas/ET timezone is hard-coded.
- Detail explicitly separates `Price as of ...` from `checked ...`.
- Explicit UI states: LIVE MARKET PRICE, PRE-MARKET, AFTER-HOURS, MARKET CLOSED / LAST MARKET PRICE, RECENT / LAST MARKET PRICE, 24/7 LIVE, PRICE VERIFYING.
- Generic across supported symbols; no META/AMZN/IREN/etc exceptions.
- V9.9.9.4 session-safe price fallback remains intact.
- V9.9.9.3 crypto 24x7 fallback remains intact.
- Portfolio visual and interaction work remains intact.
- No SQL required.

Important: holidays/weekends/session boundaries continue to use the existing NYSE calendar/session engine; international provider-reported market-open state remains honored by the provider layer.
