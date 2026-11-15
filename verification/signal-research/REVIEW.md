# Research implementation review

Source: the real AURYN application, based on preprod 5d69344.

The attached desktop.jpg is captured from the actual React components using local test fixtures, with the 3M timeframe and calculated Fibonacci overlay enabled. It is not an image-generation mockup.

Verified in the browser: inline Business navigation, financial statements and metric explorer availability, direct Technicals deep link, full technical studies, timeframe change, Fibonacci overlay, dated anchor caption and crosshair price readout.

Not verified: rendered 390px/mobile/PWA layout (embedding protection blocked the iframe test harness), authenticated production account flows, live options/gamma coverage, live deployment UI. No embedding headers were changed.

Checks: 867 automated tests passed. Final source has no diff whitespace errors. Clean final production build (including TypeScript): passed. The 12 focused UI/timeframe checks passed after the final URL cleanup.
