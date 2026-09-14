
import test from "node:test";import assert from "node:assert/strict";
import {buildExchangeStratifiedUniverse} from "../.engine-test/auryn/v994/universe-schema.js";
const rows=Array.from({length:600},(_,i)=>({symbol:`${String.fromCharCode(65+(i%26))}${String(i).padStart(4,"0")}`,name:"x",exchange:i%2?"NASDAQ":"NYSE",instrument_type:"COMMON STOCK",currency:"USD",country:"US"}));
test("seeded cohort is deterministic and rotates by session/date",()=>{
 const a=buildExchangeStratifiedUniverse(rows,100,"2026-09-14:PREMARKET");
 const b=buildExchangeStratifiedUniverse(rows,100,"2026-09-14:PREMARKET");
 const c=buildExchangeStratifiedUniverse(rows,100,"2026-09-15:PREMARKET");
 assert.deepEqual(a,b); assert.notDeepEqual(a,c); assert.equal(new Set(a).size,100);
});
