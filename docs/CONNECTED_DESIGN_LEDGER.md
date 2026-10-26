# Connected design progress — 2026-10-25

Baseline: AURYN-approved-design-build.zip version 92, 1,083 entries. Baseline npm test: 571/571 passed.

Decision: continue the already approved design/build request without repeating design approval. Work in the isolated extracted source; preserve complete ZIP delivery and avoid GitHub writes.

Decision: use a separate static React review harness because managed preview injects Vite flags unsupported by Next.js. This leaves production preview/auth guards unchanged. The harness uses only explicitly labeled fixtures and cannot authorize account writes.

Tasks: shared composition; Home; research decision tools; supporting screens; verification/package.

Implemented: shared product stylesheet manifest, Home composition, company history, research fingerprint/evidence/sizing, tools navigation and public/auth/supporting surfaces. Specialized compatibility styles retained; PWA remains independently ordered last.

Browser corrections: mobile evidence button positioning, public/auth dark-theme contrast, exact current-weight reset. Review corrections: preserve sector-aware/conditional labels; represent absent support as unavailable; route operating evidence to Financials; avoid a perpetual quote-loading label for watchlist-only accounts.

Independent read-only review: no remaining Critical/Important findings. Twenty focused tests independently passed. Full final verification and packaging are recorded in verification/CONNECTED_DESIGN_REPORT.json.

No production deployment, GitHub push, live-account change, financial transaction or outbound message was performed.
