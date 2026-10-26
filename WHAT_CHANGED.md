# What changed in this zip, and how to see it

Nothing here is deployed. These are source changes. They appear only when you run the app.

## See it in 30 seconds, no install
Open `standalone/AURYN-Decision-Engine.html` in a browser (double-click). Everything runs in the page.

## See it in your real app
```sh
npm ci
cp .env.example .env.local        # then set AURYN_ENABLE_PREVIEW=true for a read-only local preview
npm run dev
```
Open `http://localhost:3000/preview/research/MSFT` (preview) or sign in and open any company, tab **Overview**.

## Files changed or added
- Overview tab: `components/DecisionScale.tsx`, `lib/decision-scale.ts`, `components/Rewind.tsx`, `lib/rewind.ts`, `components/DecisionOverview.tsx` (2 added lines each)
- Rule transparency: `lib/decision-guide.ts` (added `decisionChecklist`, nothing else touched)
- Technicals tab: `lib/technical-more.ts`, `components/TechnicalDashboard.tsx`
- Sign-in: `components/Session.tsx`, `lib/auth-messages.ts`
- Styles: `app/decision-scale.css`, `app/rewind.css`, `app/entry-polish.css`, imported at the end of `app/product.css`
- Tests: `tests/decision-scale`, `decision-checklist`, `technical-more`, `rewind`, `auth-messages`, plus two existing harness files that needed stubs for the new components
- Notes: `docs/DECISION_SCALE.md`, `docs/REWIND.md`, `docs/TECHNICAL_STUDIES_AND_MOTION.md`, `verification/DECISION_SCALE_CHECKS.md`
