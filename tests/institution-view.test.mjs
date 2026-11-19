import test from "node:test";
import assert from "node:assert/strict";
import { institutionRows } from "../lib/institution-view.ts";
import { intelligenceData } from "../lib/intelligence-dto.ts";
import fs from "node:fs";
test("institution change figures suppressed without comparable quarter, NEW has no percent baseline", () => {
  const d = {
    latestReportDate: "2026-06-30",
    comparisonStatus: "UNAVAILABLE",
    holdings: [
      {
        ticker: "APP",
        shares: 10,
        changeType: "NEW",
        sharesChangePct: 0,
        valueUsd: 100,
        portfolioWeight: 5,
      },
    ],
  };
  let r = institutionRows(d, false);
  assert.ok(JSON.stringify(r).includes("Not comparable"));
  assert.ok(!JSON.stringify(r).includes("New position"));
  d.comparisonStatus = "AVAILABLE";
  r = institutionRows(d, false);
  assert.ok(JSON.stringify(r).includes("New position · no prior basis"));
  const h = {
    quarters: [
      {
        reportDate: "2026-06-30",
        totalValueUsd: 100,
        netFlowUsd: 50,
        comparisonStatus: "UNAVAILABLE",
      },
    ],
  };
  assert.ok(
    JSON.stringify(institutionRows(h, true)).includes("Not comparable"),
  );
  h.quarters[0].comparisonStatus = "AVAILABLE";
  assert.ok(JSON.stringify(institutionRows(h, true)).includes("50"));
});
test("institution schemas preserve report dates and equity, exclude scores/options notional", () => {
  const d = intelligenceData("institutionProfile", {
    filerCik: "123",
    latestReportDate: "2026-06-30",
    totalValueUsd: 100,
    optionPositions: [{ valueUsd: 10000 }],
    score: 8,
    holdings: [{ ticker: "APP", valueUsd: 100, sentiment: 7 }],
  });
  assert.equal(d.totalValueUsd, 100);
  assert.doesNotMatch(
    JSON.stringify(d),
    /score|sentiment|optionPositions|10000/,
  );
});
test("institution UI mounts only on explicit selection and history has its own request", () => {
  assert.match(
    fs.readFileSync("components/InstitutionalActivists.tsx", "utf8"),
    /selected &&\s*\(?\s*<InstitutionDetail/,
  );
  const s = fs.readFileSync("components/InstitutionDetail.tsx", "utf8");
  assert.match(
    s,
    /history\s*\? `institution\/\$\{encodeURIComponent\(cik\)\}\?view=history`/,
  );
  assert.match(s, /institution-directory\?cik=/);
  assert.match(
    s.replace(/\s+/g, " "),
    /not total firm assets or investment returns/,
  );
  const route = fs.readFileSync("app/api/institution/[cik]/route.ts", "utf8");
  assert.match(route, /reserveAccess/);
  assert.match(route, /publicIntelligence/);
  assert.match(route, /slice\(0, 50\)/);
  assert.match(route, /slice\(0, 8\)/);
});

test("institution profile distinguishes its latest filing from activist selection quarter", () => {
  const source = fs
    .readFileSync("components/InstitutionDetail.tsx", "utf8")
    .replace(/\s+/g, " ");
  assert.match(source, /Latest available filing: quarter ended/);
  assert.match(
    source,
    /may differ from the selected activist quarter and may still be filing/,
  );
});
