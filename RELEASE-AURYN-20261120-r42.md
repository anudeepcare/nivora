# AURYN r42 | Mobile readability and Today

This is a source handoff building on r41. No deployment, account/holding edits, provider changes or database migrations are included.

## Screen-by-screen coverage

| Reference | Change |
| --- | --- |
| IMG_4201, IMG_4198, dark/light Research | The full company identity can wrap, the quote stays in view with its date, and the small Pace badge retains a touch-sized information control. Existing tab and global navigation are unchanged. The Atlas diagram labels have higher contrast and the caption has a separate line below the diagram. |
| IMG_4200, IMG_4199, mobile Atlas Pace | Compact current/historical Pace evidence and stance layout; evidence links replace oversized boxed secondary controls without changing the model or hiding its dated inputs. |
| IMG_4197, IMG_4202, light/dark Portfolio | No per-holding Details & actions disclosure on phones. Position facts, quote context and Pace are inline, with direct lot and one-time purchase actions. Cash editing remains direct. Desktop ledger and return math are unchanged. |
| IMG_4196, mobile sign-in | X has one visible mark and its original accessible sign-in label and flow. Shared safe-area transition and a compact sign-in header. |
| IMG_4195, mobile public entry | The first visible area, menu and hero transition into a matched safe-area surface. Existing public navigation stays in place. Installed launch/greeting receives the same safe-area treatment. |
| IMG_4205, IMG_4204, IMG_4203, dark Today | Concise empty-story layout, clearer benchmark price/freshness details and shorter workspace tools without a duplicate holdings total. |
| r41 four desktop Today follow-ups | One dated, sourced news lead; company news and supported broad-market stories are compared rather than one gating the other. Single-symbol local Radar does not display market-wide breadth or rotation. Diagnostics and useful links remain. |
| Desktop Today and footer, 4:18 PM | Distinct colors for dated quarter comparisons; uniform type size and spacing for footer copy, navigation, and research disclosure. |
| Explore business reference, 4:19 PM | Opt-in shared teal link styling for secondary evidence actions with accessible touch targets; keeps native link/button semantics. |

Settings → Appearance → Theme adds **Daylight**: light 7 AM to 7 PM using the device’s local time, dark otherwise. No location permission. Light, Dark and System remain available and the current choice is not silently replaced.

The Radar storage/setup issue was not changed. A full daily snapshot still requires configured storage and enough provider data. App logic and release checks do not certify the appearance of native iOS chrome on a particular phone.
