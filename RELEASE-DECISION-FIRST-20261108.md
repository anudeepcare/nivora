# AURYN — Decision first, open research layout

This update corrects the outlined-tile design and restores the decision as the primary information.

- Pace leads with the existing engine's decision and one short reason. All nine action states remain supported: Buy, Add, Hold, Wait, Watch, Review, Reduce, Sell and Avoid. Holding and new-purchase contexts remain distinct.
- The next price checkpoint sits above the compact diamond scale. Prices remain visible under P0–P4; the duplicate giant P0–P4 badge is gone.
- Watch/Wait/Review use a caution accent; Reduce/Sell/Avoid use a risk accent. The price-zone scale does not override the business decision.
- Bear/base/bull use open typography with distinct colors and one shared price comparison rail. Individual borders, tinted tiles and colored top outlines are removed.
- Historical price-risk cases also lose their outlined cards; their metrics and sensitivity diagrams remain accessible and retain their distinct historical labels.
- Forecast math, price-band calculations, classifier, fiscal-year synchronization and Pro tools are unchanged.
- Explicit design preferences are recorded in AGENTS.md so future work in this project starts from the user's rules.

Verification: 1,230 tests passed; eight browser layouts passed at 320, 390, 768 and 1440 pixels in light/dark themes. Browser assertions check the actual decision headline, ownership-context changes, five borderless priced stages, three borderless colored scenarios, framework navigation and page overflow. Fixtures do not verify live APP data or future forecast accuracy.

Source-only handoff. No deployment, database changes or external notifications.
