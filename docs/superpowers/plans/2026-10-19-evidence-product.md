# Evidence-led AURYN Implementation Plan
> For agentic workers: use executing-plans inline. No implementation delegation; one final focused review.
Goal: demonstrate useful, defensible research before signup and connect transparent candidate models to testable evidence.
Architecture: reuse production research/valuation; isolate candidate policy, evaluation and public UI. Add no paid dependencies or production side effects.
Tech Stack: Next.js, React, TypeScript, existing chart library, Node test runner.
Spec: docs/superpowers/specs/2026-10-19-evidence-product.md

Global constraints: preserve PWA shell, portfolio pricing, RLS/authentication and current production monthly-v1. Experimental candidates must be labelled. Public data is illustrative, not live.
Review focus: future data leakage; incomplete monthly sessions; equal deposits and cash; unsupported company models; root/public route bypass must not expose private account data.

1. Candidate/evaluation: write tests for future invariance, gaps, flat/negative/invalid data, budget/cash/execution/holdout; implement lib/accumulation-policy.ts and lib/policy-evaluation.ts. Run focused tests.
2. Evidence readout: implement model provenance/suitability audit reusing existing decision/outlook. Add concise overview and opt-in monthly candle/evaluation component with non-colour legend. Test pure outputs and SSR.
3. Public storefront: new PublicLanding component and scoped CSS, explicit root and sample pages, authenticated root handoff, separate login/signup. Verify public routing and no live-data claims. Preserve private-route guards.
4. Verification: existing full tests, route/type build, API fixtures, whole-change review. Package source, rules and reports in existing ZIP; no push/deployment.

Execution: inline per user's immediate build authorization. Existing working directory contains accumulated changes and must not be reset. No unsolicited commits. Candidate cannot replace production rules without market-wide evidence; show actual per-loaded-series evaluation instead.
