# Installed-PWA viewport and keyboard correction — 18 October 2026

Evidence: user supplied a 402×812 standalone viewport report. Header controls were inside measured bounds; header padding-top was 70px (8px plus safe area). Dock bottom was 766px. Screenshots show the dock moving up over search results while the keyboard is open and surplus space below the closed-keyboard dock.

Root cause found in source: the entire mobile shell used visualViewport.height; its in-flow navigation therefore moved up with the software keyboard. Closed standalone visualViewport height can also exclude safe-area space (WebKit bug 254868).

Changes:
- Normal mobile shell uses CSS 100dvh; standalone uses 100vh, following the documented standalone workaround. No hardcoded status-bar offset or device model detection.
- Software-keyboard state requires editable focus and a viewport reduction greater than max(120px, 20% of full height). Hardware focus and small safe-area changes do not trigger it.
- Keyboard state uses visual viewport height and removes the dock from layout, freeing result space. Keyboard dismissal restores navigation.
- One focus highlight on the whole search capsule instead of an inner input outline.
- Opt-in diagnostics now include screen size and keyboard state, without account information.

Verification: regression first failed for absent software-keyboard detection and then passed. Full suite: 166 tests, TypeScript and production build passed. Physical installed-iPhone acceptance and rendered screenshot parity have NOT been executed. These changes have NOT been deployed/pushed.

Outstanding: SAP ADR USD prices versus EUR financials require verified FX and per-share/ADR reconciliation before corporate numeric scenarios can be supported. No targets were invented, and financial reporting currency was not relabelled USD. NBIS/IREN and other conditional scenario paths retain the preceding report's limitations. No all-stock accuracy or production-readiness claim.

References: https://bugs.webkit.org/show_bug.cgi?id=254868 and https://bugs.webkit.org/show_bug.cgi?id=217754
