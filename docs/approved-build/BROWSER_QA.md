# Browser verification — approved build

Date:2026-10-26. Actual Next.js application via managed local preview. Synthetic fixture account was clearly labeled and account mutations disabled. This is UI verification, not a live-provider or live-auth certification.

## Confirmed
- Public home: complete primary hero at1365×768,390×844,360×740. Main hero bottom605/648/570px. No horizontal page overflow.
- Create account: name,email,password,OAuth controls and46px submit visible in all three viewports. Submit bottom692/719/687px, including missing local Supabase configuration status.
- Research desktop: approved scale/Pace/connected layout and real computed fixture values.
- Financial drawer: opens from evidence; Annual and Line controls change their actual aria-selected state and chart.
- Business,Value,Price & Pace,Analysts,News,Options andAdvanced drawers all open and render. Options honestly preserves unavailable snapshot behavior instead of inventing contracts.
- Advanced renders risk distribution,volatility,recovery andexecution metrics.
- Saved research view returns device-local saved status.
- Portfolio:chart,allocation,holdings andreturns populate; Add position opens real units/cost/currency editor. Historical chart accurately labeled current-quantities repricing.
- Watchlist:all6 supplied examples populate prices/changes/trend/Pace after quote initialization.
- Home:real fixture holdings total andlargest-position/Pace cards populate.
- Settings:appearance/research/account controls render atphone width; dark palette works.
- Research andSettings phone body scrollWidth equalsclientWidth380px in390px frame (10px browser scrollbar), so no horizontal overflow.
- Mobile Explore opens every secondary tool link after specificity repair.

## Limits
Local preview has no production Supabase public settings or paid-provider secrets. Real email/OAuth delivery,Stripe checkout,production persistence andexhaustive live-ticker coverage are not asserted. Theirexisting handlers arepreserved andcovered bysource/API tests whereavailable. A market provider canstillwithhold data; partial evidence remains visible anddatedratherthan fabricated.

- Saved-theme regression: persisted Dark remains selected after reload; Light/standard initial hydration matches server markup without overwriting storage. Subsequent research navigation logged no new application errors or warnings (browser-extension messages excluded).
- Screenshot of the verified research view was captured outside the source archive; it uses the explicitly labeled fixture account.
