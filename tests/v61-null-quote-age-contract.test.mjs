
import fs from "node:fs";import assert from "node:assert/strict";
const source=fs.readFileSync(new URL("../lib/nivora-trading-risk.ts",import.meta.url),"utf8");
assert.match(source,/ageSeconds:number\|null/,"risk context must accept unknown provider quote age");
assert.match(source,/ageSeconds==null/,"unknown quote age must be rejected safely, not coerced to fresh");
