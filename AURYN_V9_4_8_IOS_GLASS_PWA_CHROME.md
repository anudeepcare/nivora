# AURYN V9.4.8 — iOS Glass PWA Chrome

## Root cause
The previous shell simultaneously reserved iOS safe-area space in the app shell/header at the top and in both page reserve/navigation at the bottom. In standalone mode that produced the oversized status/header gap and the large black block beneath the navigation.

## Fix
- Restores `black-translucent` iOS standalone status-bar behavior.
- App shell reserves only the 50px AURYN toolbar, not the iOS top safe area.
- Header alone owns `safe-area-inset-top`.
- Main content uses a fixed 76px navigation clearance and does not add `safe-area-inset-bottom`.
- Bottom navigation alone owns `safe-area-inset-bottom`.
- Bottom navigation is now an inset iOS-style glass dock with blur, saturation, rounded corners and a smaller visual footprint.
- Standalone mode explicitly paints behind the iOS status area.
- Existing V9.4.7 mobile stock composition, Portfolio, Technicals and desktop decision-footer fixes remain intact.

## Verification
`npm run gate:v948` — passes.
