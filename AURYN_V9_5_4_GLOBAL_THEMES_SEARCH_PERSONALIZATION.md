# AURYN V9.5.4 — Global Themes + Search + Personalization

## UX lock
No approved layout, navigation geometry, chart composition, decision engine, Market Truth, or portfolio structure changes.

## Search dropdown
- Deterministic child selectors eliminate the legacy nested-span collision.
- Mobile result is a fixed 58px row.
- Ticker, company, exchange/type metadata, and Open affordance have isolated slots.
- Dropdown is capped at 232px / 28vh with contained scrolling and z-index 1000.
- Prevents overlap with Research evidence tiles and keyboard viewport.

## Themes
Seven curated palettes:
Auryn Classic, Midnight, Slate, Emerald, Obsidian Gold, Ocean, Burgundy.
Theme tokens now explicitly cover Research, Stock, Portfolio, Monitor, Trading Lab, Settings, authentication, search/input surfaces and navigation/chrome.

## Personalization
- Text: Compact / Standard / Large
- Density: Comfortable / Compact
- Number format preference: Standard / Abbreviated
- Preferences persist locally for immediate PWA startup.
- Theme cards now have proper title/note hierarchy instead of concatenated text.

No Supabase migration required.
Verification: `npm run gate:v954`
