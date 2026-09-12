# AURYN V9.9.5 — Autonomous Canonical Research Worker

- Untouched validation symbols no longer depend on prior user navigation.
- Worker invokes the existing Analyze, Company, Context and Institutional evidence paths, then the existing V4, V5, decision-snapshot and V9.3.1 institutional kernel.
- Generated canonical decisions are persisted to `nivora_v59_decision_snapshots`, reloaded through V9.3.5 canonical projection, then frozen into Shadow CIO.
- One symbol per durable research job. Temporary provider failures retry; insufficient evidence fails closed.
- Background reservation is conservative at 8 provider tokens per autonomous symbol.
- Attempt-2 V9.9.4 smoke is superseded by migration `20260912120000_auryn_v995_autonomous_research.sql`; next orchestration becomes attempt 3.
- No UX/theme/PWA or CIO formula/threshold changes.
- `vercel.json` remains `{}`.
