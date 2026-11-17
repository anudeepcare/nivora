# Core scenario correction — 8 November 2026

This is the latest handoff report and supersedes earlier coverage/status reports for this ZIP. No push, deployment, production change or permission change was performed.

## Baseline and actual live findings

Source was compared with fetched preprod 1bb2bd815dada61c677dda1573c8f4b95c4fa572. Its preview was READY. The authenticated browser session was on older immutable deployment 91529471b3a1a536c808d4c4e606de93477b0c31, not the latest source. Latest preview hostname opens Auryn login; authenticated before/after verification on that hostname remains outstanding.

In the signed-in application, IREN, HIMS, CIFR, NBIS, ASTS and NVO had no automatic numeric scenarios. APP, MSFT, JPM and XOM had numeric earnings scenarios. This was a ten-stock convenience sample, not the user's 40-stock list. Annual revenue low/mean/high estimates existed for all six missing cases. Negative EPS prevented a complete earnings model for the five named stocks; cash/debt/share evidence gates blocked EV conversion, with IREN additionally using AUD financials against a USD listing. NVO estimates were DKK against USD. Relaxing dates or guessing shares/FX would not solve these legitimate model constraints.

## Implemented

- Preserve qualifying earnings/cash-flow/valuation scenarios as the first choice.
- For supported operating, infrastructure and frontier stocks without a qualifying valuation, automatically show a separately labelled price-anchored revenue sensitivity using supplied positive annual revenue ranges. No manual workbench is required.
- Formula: selected verified price × scenario revenue / same-fiscal-year mean revenue × relative pricing stress (0.8 / 1 / 1.2). Base equals the reference price by construction. The ±20% stresses are explicit assumptions, not calibrated probabilities or observed valuation multiples. These are conditional sensitivities, not intrinsic fair values, analyst targets or price forecasts.
- Require recent verified price, dated forecast dataset, valid annual horizon/currency and ordered positive ranges; reject conflicting ranges. Do not fabricate shares, FX conversions, cash, debt, dates, forecasts or analyst counts. Constant share count, FX and ADR/listing ratio are explicit assumptions. Financing, dilution, cash/debt and execution costs remain unmodeled in this sensitivity.
- Exclude banks, insurance, REITs and crypto from a generic revenue fallback. Missing or invalid evidence still yields a specific unavailable explanation. Universal coverage is not claimed.
- Remove the inactive Review position size & cash control from the active Research page.
- Remove More company metrics collapsing/hiding rules. Available metrics display directly in a responsive 4/2/1-column grid; the secondary detailed evidence view remains available.

## Verification

- Full local suite: 1,307 tests passed, zero failures/skips (22.8 seconds).
- ESLint, formatting check, TypeScript and Next production build passed.
- Existing-model precedence and APP/MSFT rendering regression checks passed; missing/invalid/conflicting inputs and specialist-sector exclusions covered.
- Local calculation replay using six real displayed, rounded forecast ranges: IREN, HIMS, CIFR, NBIS, ASTS, NVO all produce ordered cases; Base exactly equals reference. Inputs and results are under verification/core-scenario-20261108. These are observed UI values transcribed into minimal local inputs, not raw provider payloads, fixtures masquerading as live data, or deployed after-change results.
- Actual component server rendering checked locally. Candidate mobile/browser interaction and deployed after-change verification remain uncompleted: cloud browser cannot reach the local environment, and the latest hostname requires its own Auryn sign-in. No security control was bypassed.

## Remaining verification

The exact new ZIP has not been deployed by this agent. To validate it end to end, it must be served in an authorized accessible preview and the browser must be signed into that hostname. Recheck the five named stocks plus APP/MSFT there, including small-screen layout and source timestamps. Broad raw-provider coverage across the user's 40 tickers has not been measured. Do not interpret the six replay successes as 100% live coverage or prediction accuracy.
