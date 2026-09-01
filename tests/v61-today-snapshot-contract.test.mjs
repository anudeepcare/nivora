
import fs from "node:fs";import assert from "node:assert/strict";
const stock=fs.readFileSync(new URL("../components/StockClient.tsx",import.meta.url),"utf8");
assert.match(stock,/today:investorDecision\.today/,"validation snapshot payload must persist the canonical Today decision");
