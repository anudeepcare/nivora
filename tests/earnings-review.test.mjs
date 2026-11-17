import test from "node:test";
import assert from "node:assert/strict";
import { sourceModule } from "./helpers/provider-fixture.mjs";
function api() {
  let r;
  try {
    r = sourceModule("lib/earnings-review.ts");
  } catch {}
  assert.ok(r, "earnings review exists");
  return r;
}
test("earnings review excludes future actuals and explains negative estimate surprises", () => {
  const { earningsReview } = api();
  const x = earningsReview(
    [
      { date: "2026-11-05", actual: 20, estimate: 1, period: "" },
      { date: "2026-11-03", actual: -0.5, estimate: -1, period: "" },
    ],
    "2026-11-04",
  );
  assert.equal(x.date, "2026-11-03");
  assert.equal(x.surprise, 50);
  assert.match(x.label, /above/);
});
test("zero estimate does not create infinite surprise and missing actual stays pending", () => {
  const { earningsReview } = api();
  assert.equal(
    earningsReview(
      [{ date: "2026-11-03", actual: 1, estimate: 0, period: "" }],
      "2026-11-04",
    ).surprise,
    null,
  );
  assert.equal(
    earningsReview(
      [{ date: "2026-11-03", actual: null, estimate: 1, period: "" }],
      "2026-11-04",
    ).reported,
    false,
  );
});
test('earnings thesis review only compares compatible financial periods', async()=>{
 const {earningsThesisChecks}=await import('../lib/earnings-review.ts');
 const latest={end:'2026-09-30',currency:'USD',basis:'GAAP',revenue:120,margin:25,weightedShares:110,fcf:20};
 const prior={...latest,end:'2025-09-30',revenue:100,margin:20,weightedShares:100};
 const checks=earningsThesisChecks(latest,prior);assert.equal(checks.length,3);assert.ok(checks.some(x=>x.includes('20.0%')));assert.ok(checks.some(x=>x.includes('10.0%')));
 assert.deepEqual(earningsThesisChecks(latest,{...prior,currency:'EUR'}),[]);
});
test('annual thesis bridge requires comparable dated filed evidence and adds per-share cash flow', async()=>{
 const {annualThesisBridge}=await import('../lib/earnings-review.ts');
 const prior={start:'2024-01-01',end:'2024-12-31',filed:'2025-02-01',sourceUrl:'https://www.sec.gov/a',currency:'USD',basis:'GAAP',revenue:100,margin:20,weightedShares:100,fcf:10};
 const latest={...prior,start:'2025-01-01',end:'2025-12-31',filed:'2026-02-01',sourceUrl:'https://www.sec.gov/b',revenue:120,weightedShares:110,fcf:11};
 const bridge=annualThesisBridge([latest,prior],'2026-11-08');
 assert.equal(bridge.latest.end,latest.end); assert.equal(bridge.prior.end,prior.end);
 assert.ok(bridge.checks.some(x=>x.includes('Free cash flow per weighted share changed 0.0%')));
 for (const patch of [{start:'2025-10-01'},{start:'2025-02-01'},{filed:'2027-01-01'},{currency:'EUR'},{basis:'IFRS'},{start:'bad'}]) assert.equal(annualThesisBridge([prior,{...latest,...patch}],'2026-11-08'),null);
});
