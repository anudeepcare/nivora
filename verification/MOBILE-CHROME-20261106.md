# Mobile chrome follow-up — November 6, 2026

- Expanded the existing Gamma & open interest help dialog with definitions, a worked $360/$949.6K example, grid/colour/summary explanations and interpretation limits.
- Removed the white inset shadows from the dock and selected tab that created doubled outlines. Retained one subtle outer border and a soft external shadow.
- Mobile header uses the opaque --chrome-surface token shared with the document root, eliminating the deliberate translucent mismatch and header blur work during scrolling.
- Pre-hydration saved-theme initialization now sets color-scheme and theme-color, rather than waiting for client effects. Runtime theme changes keep color-scheme synchronized.

Validation: 13 targeted mobile viewport/shell tests and 16 Options/exposure tests passed. Production build and type checking passed.

Limits: installed iPhone status-bar chrome and device scroll frame pacing cannot be validated in the desktop runtime. No claim of a complete native-device fix or guaranteed smoothness. Existing Apple status-bar metadata and viewport-fit=cover remain in place. If the native bar remains white after deployment, capture the installed iOS version and launch state to distinguish native chrome from document paint; do not keep adding CSS strips.

Correction to the chat explanation: the prior Gamma screenshot correctly shows Below price $350 and Above price $360 for spot $351.29. The earlier statement that Above price showed $350 was a reading error, not an observed application bug.

Options alignment: numeric column headers share right alignment with values, text identifiers stay left aligned, hovered/focused rows include the first cell, and filters align to one baseline with responsive two-column/single-column reflow. Mobile backgrounds no longer use fixed attachment, avoiding that extra scrolling paint path. These changes need visual confirmation against the deployed live contracts.
