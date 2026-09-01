
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("dedicated calibration page exposes evidence metrics and uses normal navigation",()=>{
 const s=fs.readFileSync(new URL("../app/calibration/page.tsx",import.meta.url),"utf8");
 assert.match(s,/AppShell/);
 assert.match(s,/Brier/);
 assert.match(s,/Expected calibration error/);
 assert.match(s,/Exact-engine/);
 assert.match(s,/Weight-compatible/);
});
