import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("phone keeps quote and pace in one price row by giving bookmark its own identity slot", () => {
  const s = fs.readFileSync("components/ResearchHeaderPace.module.css", "utf8");
  assert.match(s, /grid-template-areas:\s*"identity watch"\s*"price price"/);
  assert.match(
    s,
    /\.quote\.quote\s*\{[^}]*grid-template-columns: minmax\(0, max-content\) minmax\(0, 1fr\)/s,
  );
  assert.match(
    s,
    /\.quote > :global\(\.data-stamp\)\s*\{[^}]*grid-column: 1 \/ -1/,
  );
  const jsx = fs.readFileSync("components/Research.tsx", "utf8");
  assert.match(jsx, /headerPaceStyles.priceMetrics/);
  assert.match(jsx, /headerPaceStyles.watch/);
});
