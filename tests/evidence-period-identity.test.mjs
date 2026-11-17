import test from "node:test";
import assert from "node:assert/strict";
import {
  evidenceObservation,
  evidenceChanges,
} from "../lib/research-integrity.ts";
import { demoData } from "./fixtures/demo.ts";
test("same end date is not enough to call a revenue revision same-period", () => {
  const a = {
    ...evidenceObservation(demoData.research.MSFT),
    periodStart: "2025-07-01",
    periodBasis: "Annual",
    accountingBasis: "GAAP",
  };
  for (const patch of [
    { periodStart: "2026-01-01" },
    { periodBasis: "TTM" },
    { accountingBasis: "IFRS" },
  ])
    assert.equal(
      evidenceChanges(a, { ...a, ...patch, revenue: a.revenue + 1 }).some((x) =>
        x.includes("Same-period"),
      ),
      false,
    );
});
test('saved observation retains period identity and compares only confirmed Pace',()=>{
 const a=evidenceObservation(demoData.research.MSFT);assert.ok(a.periodStart);assert.ok(a.periodBasis);assert.ok(a.accountingBasis);
 const b={...a,confirmedPace:{month:'2026-10-01',level:3},analystTarget:120,analystCurrency:'USD'};
 const prev={...a,confirmedPace:{month:'2026-09-01',level:2},analystTarget:100,analystCurrency:'USD'};
 const changes=evidenceChanges(prev,b);assert.ok(changes.some(x=>x.includes('Confirmed Pace')));assert.ok(changes.some(x=>x.includes('Analyst target')));
 assert.ok(!evidenceChanges(prev,{...b,analystCurrency:'EUR'}).some(x=>x.includes('Analyst target')));
});
