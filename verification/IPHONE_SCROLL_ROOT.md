# iPhone app scroll-root correction

Previous mobile implementation scrolled the document and tried to restore window.scrollY. Replaced this with one bounded content scroller on mobile: the app occupies 100dvh, header/dock remain outside the scrolling content, safe-area insets apply once in the header, and the document cannot scroll behind the app. Desktop retains document scrolling. Auth pages without the app shell remain scrollable.

Navigation environment now reads and scrolls the actual root for each platform. Shell remembers offsets through that root's scroll event; primary navigation, company links and Research tabs restore content offsets. Initial visits start at zero. Existing pending-restoration cancellation on deliberate gestures remains. Native resize/mutation tracking observes the mobile content. Dialog-open state locks underlying content and hides the inactive dock. Search keeps its own results scroller. VisualViewport measurements now also lift bottom sheets above the keyboard and constrain their height. No scroll animation or page reload was added.

Recorded failing tests for mobile content-root measurement and keyboard inset before implementation. Final verification: 152 tests, TypeScript, production build, 60 simulated API checks pass. Existing scroll retention/cancellation tests pass. Source diff is clean.

OPEN ACCEPTANCE GATES: installed iPhone PWA with keyboard open, rotation, rapid Watchlist/Portfolio switching, browser back, and exact rendered parity. No physical iPhone runtime or signed-in deployed browser test performed. Vercel deployment access remains blocked by connected account scope; no production push/deployment was performed. This is an implemented structural correction, not a certified permanent device fix.
