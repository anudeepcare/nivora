
import test from "node:test";import assert from "node:assert/strict";
import {validateQuoteIdentity} from "../.engine-test/nivora-provider-consensus.js";
test("quote identity rejects cross-ticker contamination",()=>{
 const q={symbol:"APP",price:311,provider:"twelvedata"};
 assert.equal(validateQuoteIdentity("HIMS",q).ok,false);
 assert.match(validateQuoteIdentity("HIMS",q).reason,/symbol mismatch/i);
});
test("quote identity accepts case-insensitive matching symbol",()=>{
 const q={symbol:"iren",price:36.8,provider:"alpaca"};
 assert.equal(validateQuoteIdentity("IREN",q).ok,true);
});
