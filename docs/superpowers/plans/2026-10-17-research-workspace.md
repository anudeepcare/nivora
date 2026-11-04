# Research workspace implementation plan

Goal: Expand AURYN's stock research into a visual, sourced financial workspace following the signed-in reference audit.
Spec: ../../VALUESNAPSHOT_RESEARCH_AUDIT.md
Architecture: existing Next/React research flow; shared pure financial calculations, existing SEC calls, isolated CSS module, existing AI and broker safeguards.
Execution: inline, authorized by the user's request to research and implement; no additional approval loop.

## Constraints and review focus
- No invented values or new subscriptions. No competitor payloads in source.
- Preserve product-only branch changes; legacy root source is untouched.
- Missing/zero, negative denominators, wrong currencies, ADR shares and stale data must remain distinguishable.
- Quarter and TTM calculations must not add instant values or derive EPS/weighted shares by subtraction.
- New UI must retain source dates, keyboard controls, mobile readability, light/dark tokens.

## Tasks
- [ ] Extend Metric/FinancialPeriod, SEC tags and period calculations. Add failing numeric regression tests, implement and run suite.
- [ ] Add shared financial catalogue, dated market multiples, financial bull/bear factors and explicit earnings scenarios. Test missing/currency/stale/negative cases.
- [ ] Replace Financials with chart-first filtered catalogue and statement view; add snapshot/case/scenario components and isolated responsive CSS. Integrate into existing research routes without redundant tabs.
- [ ] Verify tests/typecheck/build/API checks, inspect source changes and document unverified capabilities. Update release docs; package full source with manifest, save and deliver one ZIP.

## Ledger
Research complete: all ten top-level reference tabs reviewed, financial statement subtabs and chart categories inspected. Prior approval retained for this implementation. Root cause of thin research: source mapping and period model expose only six financial fields. UI should consume expanded model instead of substituting filler text.
