import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("unavailable history exits before populated evidence heading, retaining exact reason and no fake values", () => {
  const s = fs.readFileSync("components/PaceHistoryInsights.tsx", "utf8");
  const branch = s.slice(
    s.indexOf("if (!data.available)"),
    s.indexOf("<section className={styles.history}"),
  );
  assert.match(branch, /Historical outcomes not available/);
  assert.match(branch, /History requirements/);
  assert.match(branch, /\{data.reason\}/);
  assert.match(branch, /does not mean a P0/);
  assert.doesNotMatch(
    branch,
    /How this zone behaved before|Confirmed closes, temporary/,
  );
});
test("mobile caveat stays concise while methodology remains accessible", () => {
  const s = fs.readFileSync("components/PaceEvidenceJourney.tsx", "utf8");
  const note = s.match(/<p className=\{s\.note\}>[\s\S]*?<\/p>/)?.[0];
  assert.ok(note && note.length < 260);
  assert.match(s, /Missing or incompatible periods break/);
  assert.match(s, /Estimates can be revised/);
});
