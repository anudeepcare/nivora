# Implemented interface preview — not a production release

The user requested a visual review before proceeding. Rendered images use actual React components and CSS; prices, decisions, signals and authentication are controlled illustrative browser inputs. Financial statement responses use an earlier captured MSFT API response. They are not current market recommendations.

Changes: amount-free 0/1/2/4x weekly DCA research signal; visible rule explanation; stronger semantic colors and dark contrast; mobile dock moved outside the container that establishes a fixed-position containing block; top/bottom safe-area spacing; expanded chart mounts only when opened. CSS fixes are in product-repair.css. The final screenshot run loads this same CSS over the production preview build.

Verification: Next production preview build passed; four DCA behavior tests passed; Chromium rendered desktop/light/mobile/dark with no runtime errors or document-width overflow. No claim of physical iOS or Safari verification. This is a visual checkpoint, not full regression certification.

Outstanding: trace and fix news-based business misclassification (Apple became AI infrastructure); invalidate unsuitable persisted decisions safely; reproduce user-reported mid-use reloads; improve loading and background update continuity; recent quote failures (batch API now responds but prior failure not reproduced); logo coverage; audit full dark-theme secondary screens; Today/Discover utility; authenticated lab backend readiness and unapplied paper safety migration. No orders, deployment, Git push or database changes performed in this repair pass.

The DCA policy is experimental, uses completed UTC weeks, requires 52 consecutive weeks and excludes stale history. It must not be marketed as calibrated or as outperforming standard DCA. No amount, leverage or automatic order is produced.
