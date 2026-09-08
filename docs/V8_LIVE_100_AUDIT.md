# AURYN V8 Live 100-Ticker Audit

The offline golden-universe audit validates classification, lifecycle, analyst-model and valuation-method routing without API credentials. The live audit validates deployed provider behavior for the same 100 symbols.

## Run against Vercel

```bash
npm ci
rm -rf .engine-test && npx tsc -p tsconfig.engine.json
AURYN_BASE_URL=https://YOUR_DEPLOYMENT.vercel.app npm run audit:v8-live
```

Optional environment variables:
- `AURYN_AUDIT_TOKEN` — bearer token if the deployment protects audit traffic.
- `V8_LIVE_AUDIT_DELAY_MS` — delay between per-symbol quote/analyze calls; defaults to 1400 ms to respect provider/API rate limits.

The runner calls `/api/quote/:symbol` and `/api/analyze/:symbol`. It fails closed when a symbol has a response error, when Market Truth allows price-sensitive actions without a finite canonical decision price, when the analysis price materially disagrees with the canonical price, or when a large provider gap is nevertheless treated as tradable.

A live audit result is only valid for the deployment and timestamp that actually ran it. The source ZIP never embeds provider credentials and never claims the live audit passed offline.
