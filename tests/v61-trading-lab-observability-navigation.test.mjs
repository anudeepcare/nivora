
import fs from "node:fs";import assert from "node:assert/strict";
const page=fs.readFileSync(new URL("../app/trading-lab/page.tsx",import.meta.url),"utf8");
const run=fs.readFileSync(new URL("../app/api/trading-lab/run-paper/route.ts",import.meta.url),"utf8");
const status=fs.readFileSync(new URL("../app/api/trading-lab/status/route.ts",import.meta.url),"utf8");
assert.match(page,/AppShell/,"Trading Lab must use the standard NIVORA navigation shell");
assert.match(run,/NO_INTENT/,"paper cycle must explain evaluated snapshots that produce no trade intent");
assert.match(status,/funnel/,"status API must expose the Trading Lab decision funnel");
assert.match(page,/DECISION FUNNEL/,"Trading Lab must display the decision funnel");
