# V8.1 Live Market Audit — 100 and 500 Symbols

## Where to run it

Run these commands in the **VS Code terminal or Mac Terminal inside your local AURYN Git project folder**. You should see `package.json` when you run `ls`.

You do **not** add `AURYN_BASE_URL` to Vercel environment variables.

## After Git push and Vercel deployment

First run the 100-symbol gate:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v81-live
```

If that is clean during the live market, run the 500-symbol gate:

```bash
AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:v81-live -- --limit=500
```

The 500-symbol run intentionally respects production API rate limits and can take several minutes.

## What PASS means

A clean run requires zero critical violations for:

- symbol identity
- canonical decision-price availability when research is allowed
- no decision price when Market Truth is blocked
- official closes never marked execution-tradable
- execution-tradable quotes must be `LIVE_VERIFIED`
- execution-tradable provider gap must remain within the canonical tolerance
- analyze price must remain aligned with the canonical Market Truth price

## Important interpretation

`priceSensitiveAllowed=true` does **not** mean a quote can be sent to the broker. It can mean research is safely anchored to an official close or a lower-confidence single-source live quote.

`executionTradable=true` is the stricter broker-safety state and requires independently verified live providers.
