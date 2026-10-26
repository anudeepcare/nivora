# Checks for the October 25, 2026 additions

Run in a sandbox with Node 22 and no network. React, react-dom and TypeScript were borrowed from a global install (symlinked, not shipped) so the component tests could run; `next` and other packages were not available.

- Whole suite, original archive: 563 tests, 548 pass, 15 fail. Modified archive: 584 tests, 569 pass, the same 15 fail (no test fails only in the modified archive). The 15 are environment failures (for example `next` is not installed) and one pre-existing harness error; they were not investigated further.
- New tests: decision-scale 4, decision-checklist 3, technical-more 7, rewind 5, auth-messages 2. All pass.
- Existing component tests that load Overview, Technicals and the sign-in page keep passing. Their harnesses needed small stubs for the new components (`DecisionScale`, `Rewind`, `moreStudies`) in `tests/ui-controls.test.mjs` and `tests/research-depth-design.test.mjs`. Test expectations were not weakened.
- Rendered check: DecisionScale and Rewind were rendered with the app's own CSS in headless Chrome 131 in light and dark themes (screenshots supplied separately). This is a static render of the fixture company. Dragging, touch, mobile widths, the installed PWA and the public home and sign-in changes were NOT visually checked.
- Not run: `npm run typecheck`, `npm run build`, `npm run test:api`, deployment.

Please run `npm ci && npm run verify`, then look at Overview, Technicals, the public home page and sign-in in a browser before relying on this.
