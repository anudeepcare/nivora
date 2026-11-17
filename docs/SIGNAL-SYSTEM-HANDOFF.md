# AURYN shared design handoff

The shared implementation lives in `app/signal-system.css`, imported after the existing feature styles. This preserves established feature behavior while giving public, account and workspace routes one visual system. Research composition is implemented in `components/ApprovedResearch.tsx` and `components/Research.tsx`; the public guide is `components/PublicLanding.tsx`.

Actual local screenshots and check results: `verification/signal-system-20261103/`. They show fixture data through the existing guarded preview routes, not live market recommendations.

## Run and validate

Use Node 22.18 or later. Run `npm ci`, configure the required environment from `.env.example`, then `npm run dev`. Production checks: `npm test`, `npm run typecheck`, `npm run build`. Do not run development and production builds simultaneously in the same `.next` directory.

The final test run passed 867/867 tests. Type checking and a clean production build passed. The first build encountered a stale generated-output directory; removing `.next` and rebuilding resolved that failure.

## Deploy

This handoff is not an updated Vercel deployment. Apply the source to `anudeepcare/nivora` on `preprod`, review the diff, and push with repository write access. Use the existing Vercel project and environment configuration. The local `.env.local`, node_modules, .next and Git credentials are intentionally excluded from the ZIP.

The connected GitHub integration previously returned 403 for writes, and command-line Git lacked a credential. Restore appropriate repository write access before remote delivery. No production configuration, authentication policy or security header was relaxed for this redesign.

## Remaining verification

- Physical mobile/device QA (responsive CSS is implemented; the browser surface here has no viewport sizing control).
- Real login/signup/reset against the deployed authentication configuration.
- Live options and analyst data states. Local fixtures deliberately show missing-data messages rather than fabricated contract prices or consensus values.
- Final visual review against the approved design board. The screenshots are the implemented result; no pixel-identical claim is made.
