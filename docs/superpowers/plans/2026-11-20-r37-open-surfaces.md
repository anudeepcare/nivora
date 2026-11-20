# Auryn r37 screenshot-driven UX refinement

**Goal:** Make the 13 latest desktop screenshot states read as one modern product, and preserve readable counterparts on narrow screens.

**Shared design:** Group related content with rhythm and quiet surface fills rather than repeated nested borders. Keep keyboard focus, chart axes and table cues that carry information. Do not change market values, providers, access, backend setup or calculations. Preserve both sign-in providers and current callbacks. User deploys the ZIP.

| Ref | Acceptance target |
|---|---|
| 1 | Connected full-screen sign-in; readable branded side, complete form, mobile-first ordering and honest Google/X availability |
| 2 | Today lower section has no large dead columns; Radar tells the truth without dominating the page |
| 3 | Today leads with useful items and gives empty events a proportionate treatment |
| 4 | Admin title/roles and selected tab share one rail without idle rule |
| 5 | Handbook reads like one guide, not a nest of boxes and separators |
| 6 | Support status and filters are clear and actions are preserved |
| 7 | Watchlist leads with rows and follow action, not framing and buried content |
| 8 | Research header, quote and tabs line up and utility nav blends into the same design |
| 9 | Events evidence uses aligned, coordinated columns and an intentional narrow stack |
| 10 | Risk & scenarios uses meaningful width rather than a half-empty two-column row |
| 11 | Provider, evidence and retrieval dates have explicit readable labels |
| 12 | Pace history starts with a clear zone selection and aligned facts using the same data |
| 13 | Options contract activity highlights actual values without decorative heavy borders |

**Verification:** Each owner adds targeted failing assertions before implementing and reruns them afterwards. Integrate once, run lint/typecheck/build, route and applicable regression tests, and visually check the changed surfaces where the browser can render the candidate. Do not claim signed-in or production validation without proof. Compare the packaged source to the exact r36 manifest; exclude screenshots, dependencies, build output, credentials and private data.
