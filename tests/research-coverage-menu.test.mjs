import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Research removes redundant coverage strip while retaining status and refresh in existing facts menu", () => {
  const source = readFileSync(
    new URL("../components/Research.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /className="coverage-note"|Source coverage/);
  const menu = source.match(
    /<Help label="Company facts and source dates">([\s\S]*?)<\/Help>/,
  )?.[1];
  assert.ok(menu);
  assert.match(menu, /<StockFacts research=\{r\}/);
  assert.match(menu, /r\.issues\.map/);
  assert.match(menu, /customerText\(issue\)/);
  assert.match(menu, /onClick=\{resource\.refresh\}/);
  assert.match(menu, /disabled=\{resource\.loading\}/);
  assert.match(menu, /Refresh research data/);
});
