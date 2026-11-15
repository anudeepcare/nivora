# Current source candidate: UX refinement, November 15, 2026

This is the current source handoff. Read [UX-REFINEMENT-20261115.md](UX-REFINEMENT-20261115.md) for exact changes, verification and open acceptance gates. Earlier release files are historical; they do not override this status.

Home priorities and research grids are clearer, duplicate analyst ranges are removed without losing their provenance, conditional scenarios have distinct labels, Portfolio has a compact snapshot and benchmark-first history loading, and the public Pace guide no longer eagerly loads the models into the shared entry. All useful metrics, tools and numerical calculations remain. The November 14 system-audit corrections are included.

Final combined checks pass: 1,492 tests, lint, formatting, typecheck, production build and the controlled API suite. The common entry JS is about 66% smaller after gzip; complete Home/Research/Portfolio payload reductions are modest and real-user speed is unmeasured.

This is **not a production-accepted release**. No source was deployed. After-change browser/device rendering and full current-company end-to-end validation remain open. Exact third-party matching, a shared target provider and forecast accuracy are not established. There is no classifier refit, new target-source activation, subscription change or broker execution.
