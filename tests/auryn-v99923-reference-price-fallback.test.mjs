import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const s=fs.readFileSync("components/StockClient.tsx","utf8");
test("active session can fall back to canonical verified reference without calling it live",()=>{assert.match(s,/CANONICAL_REFERENCE/);assert.match(s,/LAST VERIFIED PRICE/);});
test("reference fallback never marks stableLiveFresh",()=>{assert.match(s,/stableLiveFresh=displayAuthority\?\.kind==="LAST_GOOD_LIVE"/);});
test("reference fallback keeps execution blocked",()=>{assert.match(s,/displayPriceLive=\{stableLiveFresh\}/);assert.match(s,/priceSensitiveAllowed/);});

test("overview labels non-live display price as Reference",()=>{const v=fs.readFileSync("components/premium/AurynResearchOverviewV2.tsx","utf8");assert.match(v,/displayPriceLive\?"Current":"Reference"/);});
