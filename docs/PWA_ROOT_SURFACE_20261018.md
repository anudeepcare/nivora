# Installed PWA status surface

This change is confined to the root layout, a dedicated pwa-shell.css, and removal of the obsolete product pseudo-element. The recovered version 18 page styles remain intact.

The previous product::before surface used height: env(safe-area-inset-top, 0px) without a minimum. It could collapse to zero when the installed viewport reports zero. A persistent real DOM surface is now a direct child of body, before the account/page shell. It is fixed at top:0, full width, opaque, non-interactive and at least 8 CSS pixels high. It retains a larger safe-area height when reported. It is rendered in the server HTML and activated by standalone media mode or legacy navigator.standalone detection before first paint. No timers, synthetic scrolling, root viewport resizing or route-dependent mounting are used.

Research reference: Danny Moerkerke, first-hand iOS 27 testing, September 30, 2026: https://modernwebweekly.substack.com/p/so-whats-up-with-the-ios27-blur . The reported fixed-surface sampling conditions are minimum 6px height, at least 80% width and within 4px of viewport top. This implementation uses 8px, 100%, top:0. This is an implementation of a reported workaround, not an Apple guarantee about future OS releases.

The earlier metadata-only correction did not resolve the user's reported result. Changing the status-bar meta tag is not the mechanism relied on here. No reinstall, cache clearing, accessibility setting change or account data removal is required by this implementation; deploy it and fully close/reopen the installed app to load the new network-first document.

Regression tests cover persistence before the account shell and non-zero surface geometry at zero insets. Physical iPhone compositor acceptance is not recorded. No deployment, database mutation or order submission was performed.
