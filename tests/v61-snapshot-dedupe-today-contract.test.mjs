
import fs from "node:fs";import assert from "node:assert/strict";
const s=fs.readFileSync(new URL("../components/StockClient.tsx",import.meta.url),"utf8");
assert.match(s,/todayFingerprint/,"snapshot de-duplication must change when Today becomes available or changes");
assert.match(s,/enterprise\.auditId.*todayFingerprint|todayFingerprint.*enterprise\.auditId/s,"session key must include Today fingerprint");
assert.match(s,/investorDecision\?\.today/,"snapshot effect must react to canonical Today changes");
