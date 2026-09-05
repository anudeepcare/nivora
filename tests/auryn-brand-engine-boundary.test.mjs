import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const engine=fs.readFileSync("lib/nivora-intelligence.ts","utf8");
test("AURYN brand does not rename stable engine API",()=>{
 assert.match(engine,/export function buildNivoraIntelligence\(/);
 assert.match(stock,/import \{buildNivoraIntelligence\} from "@\/lib\/nivora-intelligence"/);
 assert.doesNotMatch(stock,/buildAurynIntelligence/);
});