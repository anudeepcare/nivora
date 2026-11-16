import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("read-only earnings and disclosure histories open outside the research grid", () => {
  const source = fs.readFileSync("components/Research.tsx", "utf8");
  for (const title of [
    "Earnings history & estimates",
    "Reported congressional activity",
  ]) {
    assert.ok(source.includes(`title="${title}"`));
    assert.ok(source.includes(`trigger="${title}"`));
  }
  assert.match(source, /<EarningsWorkspace research=\{r\}/);
  assert.match(
    source,
    /<CongressDisclosures[\s\S]*symbol=\{r.company.symbol\}[\s\S]*preview=\{!!demo\}/,
  );
});
test("stateful policy inputs and alert controls remain mounted in their existing inline workflow", () => {
  const source = fs.readFileSync("components/Research.tsx", "utf8");
  assert.match(
    source,
    /<details className="value-personal-model">[\s\S]*?<DcaResearch research=\{r\}/,
  );
  assert.match(
    source,
    /<details className="edge-method">[\s\S]*?<DecisionWatch key=\{r.company.symbol\} research=\{r\}/,
  );
});
test("technical method explanations move to a dialog without moving custom anchor controls", () => {
  const source = fs.readFileSync("components/TechnicalDashboard.tsx", "utf8");
  assert.match(
    source,
    /<DetailDialog[\s\S]*?title="Anchor dates, methods & limits"/,
  );
  assert.match(source, /a\.fib\.lowDate/);
  assert.match(source, /a\.fib\.highDate/);
  assert.match(source, /<dialog[\s\S]*?aria-label="Custom Fibonacci anchors"/);
});
