# AURYN V9.9.9.28 — Unified Experience + Permanent UI Fixes

Root causes addressed:
1. V27 help was rendered as a sticky document-flow panel, so clicking ? inserted a large card elsewhere on the screen. V28 anchors the popover to the clicked helper on desktop and uses a compact bottom sheet on mobile.
2. Execution map clustering threshold was too narrow for real-world entry/current proximity. V28 uses a 3.5% semantic clustering threshold so close decision levels become one readable node instead of overlapping.
3. Typography ownership was fragmented across globals, auryn.css, auryn-product.css and premium styles. V28 adds one final loaded typography contract across Research/Stock, Portfolio, Monitor and Trading Lab: Inter/system UI for product/evidence text and Georgia only for intentional display/editorial headings.

No price truth, valuation truth, long-term calculation, or canonical execution behavior is changed.
