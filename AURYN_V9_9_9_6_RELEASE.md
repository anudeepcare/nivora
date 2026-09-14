# AURYN V9.9.9.6 — Current-Session Price Integrity

This release intentionally supersedes V9.9.9.4's permissive extended-hours fallback.

Root cause:
V9.9.9.4 allowed any real timestamped price up to 24 hours old to become the primary display outside regular hours. That eliminated VERIFYING states but could put a morning price in the primary header during an active after-hours session. That is truthful historical data but not a current after-hours price.

New invariant:
- PRE_MARKET active: primary price must be a fresh PRE_MARKET price. Otherwise PRE-MARKET PRICE UNAVAILABLE.
- REGULAR active: primary price must be a fresh regular-session price.
- AFTER_HOURS active: primary price must be a fresh AFTER-HOURS price. Otherwise AFTER-HOURS PRICE UNAVAILABLE.
- CLOSED: regular close / last official market price may be shown as the primary historical reference.
- CRYPTO_24X7: live crypto path remains.
- A stale morning/regular price can never be promoted as the primary price during active premarket/after-hours.
- Regular close may be shown only as secondary reference context when current extended-hours price is unavailable.
- Local viewer timezone rendering and unified header/trust truth from V9.9.9.5 remain.

No SQL. No ticker-specific exceptions.
