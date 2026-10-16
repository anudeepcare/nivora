# Research workspace verification

The workspace schema is `supabase/migrations/20261016155712_auryn_research_workspace.sql`.
It was generated with the Supabase CLI and tested locally. It has not been applied to a live database.

## Behavior and types

Run the shared release manifest after `tsc -p tsconfig.engine.json`. For an isolated agent run, avoiding `.engine-test` races:

```sh
./node_modules/.bin/tsc lib/auryn/workspace/model.ts --target es2022 --module commonjs --outDir .engine-workspace --rootDir lib --skipLibCheck --strict
AURYN_WORKSPACE_BUILD_ROOT=../.engine-workspace node --test tests/auryn-approved-workspace.test.mjs
./node_modules/.bin/tsc --noEmit --incremental false
```

## PostgreSQL ownership gate

The SQL test intentionally needs an isolated PostgreSQL runtime. A skipped test is not a passing ownership gate. Install the pinned runtime outside the repository, then set its explicit ESM entry:

```sh
npm install --prefix /tmp/auryn-workspace-sql --no-save @electric-sql/pglite@0.3.14
WORKSPACE_SQL_TEST_MODULE=/tmp/auryn-workspace-sql/node_modules/@electric-sql/pglite/dist/index.js node --test tests/auryn-workspace-ownership.test.mjs
```

This runs the actual migration in a temporary PGlite database. It verifies owner-only reads/writes, cross-user denial, immutable original decisions/reviews and a composite owner-bound foreign key from each review to its original decision. It does not test a deployed Supabase project's roles, API configuration or account mapping.

## API and operational boundaries

`/api/research-workspace` validates the bearer token through Supabase Auth and queries using that user token, with ownership predicates and RLS. It never accepts client-supplied ownership. Reads and writes are private/no-store. Personal research rows are in `auryn_research_workspace`; existing `watchlist_items` continue to hold symbols.

Snapshots come from the server canonical loader. Ask uses persisted snapshot IDs, evidence IDs and dates; a company snapshot supplied only to the component is explicitly a session preview. Canonical decisions are never recalculated by a saved view or assistant answer. Financial peer comparisons require matching periods, definitions, units, currencies and business models, and do not create investment rankings.

Research alerts are evaluated on an explicit refresh, deduplicated in account history, and delivered in-app only. There is no background scheduler, email/push delivery, paid model, broker order or auto-execution. A free-text awaited condition is saved context, not a verified trigger. Dated events are shown only when provided by canonical evidence. Missing storage shows an unavailable state; the existing watchlist and price-target workflows remain accessible.

The journal adapter is `authenticatedPlanningJournalStore` from `lib/auryn/workspace/planning-store.ts`. Original records and reviews use INSERT only. Reviews require an owned original record; original decisions and reviews cannot be overwritten or deleted with authenticated Data API credentials. Account deletion remains available through the owning auth user's cascade.

Business-thesis alerts use independent business assessment/score changes or sourced company counterevidence. New-capital action changes use the separate allocation category; tactical setup changes and tactical invalidation do not establish a business-thesis change.
