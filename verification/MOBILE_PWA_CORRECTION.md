# Mobile PWA screenshot corrections

Reviewed IMG_3637, IMG_3638 and IMG_3639. Search inherited a bottom-aligned, auto-height dialog rule that contradicted the full-height reference. Mobile search now uses a top-anchored rounded viewport with an internally scrollable result list. VisualViewport resize and scroll updates account for keyboard visible height; native input autofocus was removed from hidden search dialogs to avoid scroll-on-focus.

The mobile header is now sticky, opaque, and includes top and horizontal safe-area padding. Product no longer duplicates the top inset. Header backdrop blur is removed. Content disables browser scroll anchoring to prevent async list replacements moving the page independently of route restoration. Route positions and deliberate-gesture cancellation remain intact.

Revenue uses blue, positive margins and cash generation green, negatives red, and forward P/E violet. These colours do not turn unavailable or negative values into buy claims.

150 tests, TypeScript, production build and 58 simulated API checks passed. Two viewport regressions passed after a recorded failing run. Existing navigation regressions passed. Physical installed-iPhone PWA behaviour and screenshot parity are NOT verified. No deployment, account mutations, orders or paid AI requests performed.
