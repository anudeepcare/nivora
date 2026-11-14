import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

test("offline Pace feature extraction rejects malformed bars just like the app", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pace-extraction-"));
  try {
    fs.mkdirSync(path.join(dir, "raw"));
    fs.mkdirSync(path.join(dir, "analysis"));
    fs.writeFileSync(
      path.join(dir, "analysis/replay.json"),
      JSON.stringify({
        rows: [
          {
            symbol: "TEST",
            status: "compared",
            market: "us-equity",
            priceAligned: true,
            closeDate: "2026-11-11",
          },
        ],
      }),
    );
    fs.writeFileSync(
      path.join(dir, "dca-screener-1000.json"),
      JSON.stringify({ rows: [{ cells: ["TEST", "Synthetic company"] }] }),
    );
    const lines = ["datetime;open;high;low;close;volume"];
    for (
      let date = new Date("2024-01-01T12:00:00Z");
      date <= new Date("2026-11-11T12:00:00Z");
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      if (![0, 6].includes(date.getUTCDay()))
        lines.push(`${date.toISOString().slice(0, 10)};100;100;100;100;1000`);
    }
    // Impossible OHLC row must not change daily/monthly classifier inputs.
    lines.push("2026-11-11;100;100;100;10000;1000");
    fs.writeFileSync(path.join(dir, "raw/TEST.csv"), lines.join("\n"));
    execFileSync(process.execPath, [
      "--experimental-strip-types",
      "scripts/extract-live-pace-features.mjs",
      dir,
    ]);
    const [result] = JSON.parse(
      fs.readFileSync(path.join(dir, "analysis/features.json")),
    );
    assert.equal(result.features.length, 42);
    assert.equal(
      result.features[0],
      0,
      "flat valid history has zero distance from its prior mean",
    );
    assert.equal(result.features[41], 0, "monthly cycle distance remains zero");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
