# AURYN V3.7 Release Cleanup

Goal: finish the approved responsive/product cleanup as one release rather than another style patch.

1. Replace the legacy Thesis verdict presentation with new AURYN-only component/class names so globals.css V65 selectors cannot stretch it.
2. Replace the stock intelligence strip and position control with AURYN-only layout classes; clean quote-integrity spacing.
3. Make portfolio holding rows clickable, remove the redundant arrow button, keep edit/delete secondary, retain quantity/avg cost/value/return/action.
4. Move Add Investment directly below the portfolio hero and make the top button open it in place.
5. Replace misleading API risk summary with AURYN portfolio-intelligence concentration/liquidity measures and an explanatory info control.
6. Make Visual Intelligence controls a mobile segmented grid without horizontal scroll.
7. Remove “Go” text from header search and use a compact icon action.
8. Run all V3 contract tests and package V3.7.
