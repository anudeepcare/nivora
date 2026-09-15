# AURYN V9.9.9.36 — Upside Sequence Regime Fix

Root cause fixed:
- Extension publication incorrectly required `reclaimAboveCurrent=true`. Once price had already reclaimed the confirmation level, that flag became false and valid 1.272/1.618 targets were suppressed.
- Recent-regime rebuilds inherited historical extension values instead of calculating extensions from the rebuilt swing.

Changes:
- Validated comparable regimes may publish conditional extensions whether confirmation is still ahead or has already been reclaimed.
- Recent-regime rebuild now computes its own 1.272 and 1.618 extensions from the validated recent swing.
- UI filters unavailable targets instead of rendering `$38.20 → — → —`.
- Extension values remain conditional structural targets, not forecasts.

Verification:
- V36 focused tests pass.
- Complete V35/V34/V33/V32/V31.1 and legacy regression chain passes.
