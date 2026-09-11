# AURYN V9.4.3 — Mobile System Rebuild

- Adds `app/auryn-mobile.css` as the authoritative final-loaded mobile/PWA layer.
- Header owns iOS top safe area exactly once.
- Bottom navigation owns bottom safe area exactly once; content has one matching reserve.
- Search is normal-flow beneath the app header.
- Auth shell is independently mobile-composed.
- Stock shell forces identity/logo/ticker/current market price visible.
- Technical evidence becomes compact rows on mobile rather than equal-height grid cards.
- Portfolio, Monitor, Trading Lab and Profile roots are viewport/overflow safe.
- Portfolio mobile add action and holding View/Edit/Delete actions remain available.
- Account menu is a fixed viewport overlay and closes on route changes.
- Explicit 430px, 393px and 390px contracts.
- Desktop engine/data behavior unchanged.

Verification: `npm run gate:v943`.
