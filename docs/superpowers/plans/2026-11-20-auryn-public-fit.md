# Auryn r35: fix the actual public page regressions

The deployed r34 release verifies the compact submit fit at 1180×757 (bottom y=515) but still has a near-black homepage headline in light theme. Validate emitted CSS and actual element identity, not just source selectors. Use the seven screenshots as coverage. Keep signed-in features and provider, auth, account, and database behavior intact.

1. Home: make the navy hero title and accent readable in both themes; align feature grid, walkthrough, Pace and footer on one rail; reduce repeated signup/plan actions and keep short useful support links.
2. Access: remove the unnecessary Close link by latest request. Bring back an accessible slim contour banner without the split marketing layout. Open Terms, Privacy and Risk text inline in a keyboard-accessible native dialog, preserving the typed form and the canonical routes. Keep ordinary overflow and essential actions visible without scrolling at typical sizes.
3. Documents/adjacent pages: align header, navigation and content to one rail; controls scroll in normal document flow and mobile wraps/touch-scrolls where appropriate.
4. Run behavior and compiled-CSS checks, production build and route smoke test. Do not deploy. Submit a single ZIP and disclose unverified live/browser coverage.
