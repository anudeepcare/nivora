import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
test("audit reports missing inputs per symbol instead of crashing or passing them", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "auryn-audit-"));
  try {
    fs.writeFileSync(
      path.join(root, "universe.json"),
      JSON.stringify(["APP", "MISSING"]),
    );
    const p = spawnSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "scripts/audit-ticker-integrity.mjs",
        root,
        "2026-11-05T00:00:00Z",
      ],
      { encoding: "utf8" },
    );
    assert.equal(p.status, 0, p.stderr);
    const r = JSON.parse(fs.readFileSync(path.join(root, "results.json")));
    assert.equal(r.summary.requested, 2);
    assert.equal(r.summary.unavailable, 2);
    assert.equal(r.summary.passed, 0);
    assert.equal(r.rows[0].external.analysts, "not-compared");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
