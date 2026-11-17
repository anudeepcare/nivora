import test from "node:test";
import assert from "node:assert/strict";
import { optionObservations } from "../lib/options-observations.ts";
test("option history preserves units and true zero, rejects missing values", () => {
  const data = {
    series: [
      { date: "2026-01-02", atmIv: 0.42, pcVol: 0 },
      { date: "2026-01-03", atmIv: null },
      { date: "2026-02-30", atmIv: 0.8 },
    ],
  };
  const iv = optionObservations(data, false, "atmIv");
  assert.equal(iv.points[0].value, 42);
  assert.equal(iv.missing, 2);
  assert.equal(optionObservations(data, false, "pcVol").points[0].value, 0);
});
test("intraday uses exact epoch seconds and does not interpolate missing cycles", () => {
  const p = optionObservations(
    {
      series: [
        { cycle: 1, asOf: 1793630700, callVol: 100 },
        { cycle: 3, asOf: 1793632500, callVol: 300 },
      ],
    },
    true,
    "callVol",
  );
  assert.equal(p.points.length, 2);
  assert.equal(p.points[1].timestamp - p.points[0].timestamp, 1800000);
});
test("ambiguous duplicate timestamps and negative or numeric-string metrics are not plotted", () => {
  const p = optionObservations(
    {
      series: [
        { date: "2026-01-01", pcVol: 1 },
        { date: "2026-01-01", pcVol: 2 },
        { date: "2026-01-02", pcVol: -1 },
        { date: "2026-01-03", pcVol: "0" },
      ],
    },
    false,
    "pcVol",
  );
  assert.equal(p.points.length, 0);
  assert.equal(p.missing, 4);
});
