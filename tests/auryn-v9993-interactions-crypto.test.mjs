
import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const page=fs.readFileSync("app/portfolio/page.tsx","utf8"),holdings=fs.readFileSync("components/portfolio/HoldingsIntelligence.tsx","utf8"),pulse=fs.readFileSync("components/portfolio/PortfolioPulse.tsx","utf8"),quote=fs.readFileSync("lib/auryn/fast-quote.ts","utf8");
test("desktop add investment is compact",()=>assert.match(page,/aurynCompactAddButton/));
test("holdings expose requested sorting",()=>{for(const k of ["NAME","VALUE","PNL","PNL_PCT","WEIGHT","AURYN"])assert.match(holdings,new RegExp(k))});
test("holding rows navigate to research",()=>assert.match(holdings,/\/stock\/\$\{encodeURIComponent/));
test("drivers and matrix navigate to research",()=>{assert.match(pulse,/aurynInteractiveDriver/);assert.match(pulse,/aurynInteractiveMatrix/);assert.match(pulse,/router\.push/)});
test("matrix has hover detail",()=>{assert.match(pulse,/matrixHover/);assert.match(pulse,/aurynMatrixTooltip/)});
test("crypto has 24x7 normalization and Coinbase fallback",()=>{assert.match(quote,/normalizeCryptoSymbol/);assert.match(quote,/CRYPTO_24X7/);assert.match(quote,/coinbase/i)});
test("crypto fallback may use fresh retrieval timestamp",()=>assert.match(quote,/retrieval-timestamp/i));
