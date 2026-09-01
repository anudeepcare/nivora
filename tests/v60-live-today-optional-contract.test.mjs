
import fs from "node:fs";
import assert from "node:assert/strict";
const source=fs.readFileSync(new URL("../lib/nivora-live-today.ts",import.meta.url),"utf8");
assert.match(
  source,
  /applyLiveQuoteToToday\(today:TodayDecision\|undefined/,
  "live Today adapter must accept an undefined TodayDecision because buildInvestorDecision.today is optional"
);
