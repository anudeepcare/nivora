# AURYN V9.6.3 Mobile Quality Design

## Goal
Restore the approved AURYN mobile/PWA shell behavior without changing the locked product layout, bottom dock, Overview hero, chart geometry, or engine behavior.

## Root Cause
The iPhone standalone white band is caused by theme CSS loading after the mobile shell and forcing `html,body` back to the page canvas. With `apple-mobile-web-app-status-bar-style: black-translucent`, iOS exposes that root background through the status area. The shell itself already paints the header dark, but the transparent status area is owned by the root element, not by the fixed header.

The stock masthead truncation is caused by a rigid two-column identity/price row combined with aggressive `white-space: nowrap`, `text-overflow: ellipsis`, and very small fixed font sizes. The tab bar similarly exposes a clipped final tab with no edge affordance.

## Design
1. In standalone mode, root/body own the chrome color and the app shell owns the page canvas. This removes the disconnected white status area while retaining theme-aware chrome.
2. The mobile stock masthead remains the same information architecture but uses a two-level composition with a flexible first row and a full-width status/meta row. Price and identity never overlap; market-state copy is allowed to wrap to two lines instead of hard truncating.
3. Evidence tabs remain horizontally scrollable but gain scroll padding, snap alignment, and a subtle right-edge fade so partial tabs look intentional.
4. Restore the known-good desktop typography baseline by neutralizing V9.6 readability rules from core product surfaces. Compact/Standard/Large continues to affect only secondary/supporting copy.
5. Bottom navigation, Overview hero, chart geometry, Portfolio layout, theme names, and engine outputs remain locked.

## Acceptance
- Standalone iPhone status area uses the active chrome color, with no white strip above the AURYN header.
- Mobile masthead shows ticker, company, ownership, price and market-state text without overlap.
- Evidence tabs scroll/snap intentionally and do not present a broken clipped tab.
- Desktop baseline typography matches pre-V9.6 scale on core surfaces.
- Existing PWA/theme/personalization tests remain green.
