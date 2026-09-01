
import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../app/api/validation/snapshot/route.ts", import.meta.url), "utf8");

// Supabase's builder is PromiseLike. Normalize it to a native Promise before
// using Promise.prototype.catch(), so Next/TypeScript accepts the chain.
assert.match(
  source,
  /await Promise\.resolve\(db\.from\("nivora_v59_decision_snapshots"\)\.insert\(/,
  "snapshot insert must normalize the Supabase PromiseLike with Promise.resolve"
);
assert.equal(
  /await db\.from\("nivora_v59_decision_snapshots"\)\.insert\([^;]*\)\.then\(/s.test(source),
  false,
  "snapshot insert must not call .then/.catch directly on the Supabase builder"
);
