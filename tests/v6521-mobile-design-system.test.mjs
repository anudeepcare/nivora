import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const css=()=>fs.readFileSync("app/globals.css","utf8");
test("V65.21 defines one mobile token system",()=>{let x=css();assert.match(x,/V65\.21[\s\S]*--m-space-1:4px[\s\S]*--m-body:15px[\s\S]*--m-label:12px[\s\S]*--m-radius:20px/s)});
test("horizontal controls scroll instead of clipping",()=>{let x=css();assert.match(x,/V65\.21[\s\S]*\.pulsePeriods,\.visualModes,\.xrayModes\{[^}]*overflow-x:auto!important/s)});
test("portfolio cards are compact and use shared metric rhythm",()=>{let x=css();assert.match(x,/V65\.21[\s\S]*\.v65Position[^}]*padding:16px!important[\s\S]*\.v65PosMetrics[^}]*gap:12px 18px!important/s)});
test("sparse visual intelligence does not reserve giant blank canvas",()=>{let x=css();assert.match(x,/V65\.21[\s\S]*\.performanceChart[^}]*min-height:0!important[^}]*height:auto!important/s)});
test("dock remains three equal columns and content clears it",()=>{let x=css();assert.match(x,/V65\.21[\s\S]*\.v65Main\{[^}]*calc\(82px \+ env\(safe-area-inset-bottom\)\)!important[\s\S]*\.v65MobileNav\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/s)});
