import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8");
test("price timestamp formatter is declared before progressive early return",()=>{assert.ok(s.indexOf("const formatPriceObservedAt")<s.indexOf("if(!d||!view)"));});
test("both price states still use the formatter",()=>{assert.ok((s.match(/formatPriceObservedAt\(aurynPriceState\.observedAt\)/g)||[]).length>=2);});
