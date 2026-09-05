import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
test("StockClient passes the typed string breaker directly",()=>{const s=fs.readFileSync("components/StockClient.tsx","utf8");assert.match(s,/breaker=\{presentedDecision\.breakers\?\.\[0\]\}/);assert.doesNotMatch(s,/breakers\?\.\[0\]\?\.label|breakers\?\.\[0\]\?\.reason/);});
