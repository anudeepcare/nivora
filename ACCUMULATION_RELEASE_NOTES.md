# AURYN Accumulation Workbench — incremental source handoff

New authenticated route: `/accumulation`.

Implements an original, transparent, experimental DCA sizing policy with pause/reduced/1×/2×/3×/4×, evidence freshness, business thesis, financing risk, concentration and cash checks. The screen explicitly uses **manual inputs**. It does not represent a live trading signal or a reproduction of DCAOptimizer's proprietary algorithm.

## Verification
`node --test tests/auryn-accumulation.test.mjs` — 2 structural checks passed. A complete production build, regression suite, live broker operations and 104-item approved scope have NOT been verified here. Do not deploy as a completed 104-item release without those checks.

## Git / deployment
```bash
npm ci
node --test tests/auryn-accumulation.test.mjs
npm run test:release
npm run build
git add -A
git add -f .github/workflows/auryn-v996-validation-queue.yml .github/workflows/nivora-calibration-mature.yml  # only if those files exist
git commit -m "Add transparent AURYN accumulation workbench"
git push origin main
```
Vercel deployment follows connected GitHub production branch settings. Never commit real `.env` values.

## Remaining work
Integrate with verified canonical data rather than manual scores; add signal-history candlestick overlays, true point-in-time equal-capital backtests, alerts, full UI cross-navigation, regression/build and production operational verification. Other approved scope items remain subject to independent verification.
