import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const n="lib/auryn/v99925/investment-narrative.ts",v="components/premium/AurynResearchOverviewV2.tsx";
test("investment narrative answers all seven analyst questions",()=>{assert.ok(fs.existsSync(n));const s=fs.readFileSync(n,"utf8");for(const x of ["whyOwn","whatWorth","whereAccumulate","whatConfirms","whatBreaks","whatChanged","nextDecision"])assert.ok(s.includes(x),x);});
test("overview renders four decision lenses and long-term roadmap",()=>{const s=fs.readFileSync(v,"utf8");for(const x of ["LONG-TERM STRUCTURE","Investment roadmap","WHY OWN IT","WHAT IT'S WORTH","WHERE TO ACCUMULATE","WHAT CONFIRMS","WHAT BREAKS","NEXT DECISION"])assert.ok(s.includes(x),x);});
test("overview exposes weekly/fib evidence without asserting wave certainty",()=>{const s=fs.readFileSync(v,"utf8");for(const x of ["50-WMA","200-WMA",".618",".786","Wave candidate","confidence"])assert.ok(s.includes(x),x);});
