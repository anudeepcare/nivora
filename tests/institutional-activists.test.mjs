import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { intelligenceData } from "../lib/intelligence-dto.ts";
test("activist HTTP data projection retains dates and holdings, excludes proprietary scores", () => {
  const data = intelligenceData("institutionalActivists", [
    {
      filerName: "Fund",
      ticker: "APP",
      shares: 10,
      valueUsd: 100,
      changeType: "NEW",
      sharesChangePct: 0,
      reportDate: "2026-06-30",
      filedDate: "2026-08-01",
      sentiment: 99,
      score: 10,
    },
  ]);
  assert.equal(data[0].reportDate, "2026-06-30");
  assert.equal(data[0].sharesChangePct, 0);
  assert.doesNotMatch(JSON.stringify(data), /sentiment|score/);
});
test("activist UI is lazy, bounded and does not mistake new-position placeholder for measured zero percent", () => {
  const s = fs.readFileSync("components/InstitutionalActivists.tsx", "utf8");
  assert.match(s, /open \? "institutional-activists" : null/);
  assert.match(s, /New position · no prior basis/);
  const route = fs.readFileSync(
    "app/api/institutional-activists/route.ts",
    "utf8",
  );
  assert.match(route, /account\(request, \{ market: true \}\)/);
  assert.match(route, /reserveAccess/);
  assert.match(route, /publicIntelligence\(result\)/);
  assert.match(route, /rows.slice\(0, 50\)/);
});
