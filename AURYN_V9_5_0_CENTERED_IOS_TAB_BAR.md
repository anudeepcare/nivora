# AURYN V9.5.0 — Centered iOS Tab Bar

The previous dock still looked like a tall panel because the iPhone bottom safe area was being added inside the dock's padding. V9.5.0 changes the geometry model:

- Dock itself is always exactly 64px tall.
- iPhone safe-area inset positions the dock upward; it no longer makes the dock taller.
- 12px symmetric side gutters.
- Four equal-width 1fr navigation items.
- Every item is exactly 52px and centered both horizontally and vertically.
- Active item is a subtle 17px-radius gold glass capsule.
- Lighter 0.72 glass with 28px blur and 180% saturation.
- Page reserves dock + safe area separately so chart/content remains reachable.
- Top PWA chrome and stock composition unchanged.
- No engine/data changes.

Verification: npm run gate:v950
