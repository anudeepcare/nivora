
import test from "node:test";import assert from "node:assert/strict";

const mod=await import("../.engine-test/auryn/market-price-authority.js");
const {selectMarketDisplayQuote}=mod;

const at="2026-09-14T15:23:30.000Z";
const q=(provider,price,ts,extra={})=>({symbol:"BE",provider,price,providerTimestamp:ts,retrievedAt:at,session:"REGULAR",freshness:"LIVE",...extra});

test("regular market selects newest agreeing live trade candidate",()=>{
 const r=selectMarketDisplayQuote({symbol:"BE",session:"REGULAR",asOf:at,candidates:[
   q("alpaca",254.82,"2026-09-14T15:23:22.000Z",{kind:"TRADE"}),
   q("twelvedata-price",254.79,"2026-09-14T15:23:20.000Z",{kind:"TRADE"})
 ]});
 assert.equal(r.label,"LIVE MARKET PRICE"); assert.equal(r.price,254.82); assert.equal(r.confidence,"VERIFIED");
});

test("material disagreement refuses a display price",()=>{
 const r=selectMarketDisplayQuote({symbol:"BE",session:"REGULAR",asOf:at,candidates:[
   q("alpaca",260.63,"2026-09-14T15:23:22.000Z",{kind:"QUOTE_MID"}),
   q("twelvedata-price",253.61,"2026-09-14T15:23:21.000Z",{kind:"TRADE"})
 ]});
 assert.equal(r.label,"PRICE VERIFYING"); assert.equal(r.price,null); assert.equal(r.confidence,"CONTESTED");
});

test("regular market rejects stale candidates",()=>{
 const r=selectMarketDisplayQuote({symbol:"BE",session:"REGULAR",asOf:at,candidates:[
   q("alpaca",254.82,"2026-09-14T15:20:00.000Z",{kind:"TRADE"})
 ]});
 assert.equal(r.price,null); assert.equal(r.label,"PRICE VERIFYING");
});

test("after hours uses after-hours label",()=>{
 const r=selectMarketDisplayQuote({symbol:"BE",session:"AFTER_HOURS",asOf:"2026-09-14T21:10:00.000Z",candidates:[
   {...q("alpaca",255.4,"2026-09-14T21:09:55.000Z",{kind:"TRADE"}),session:"AFTER_HOURS",retrievedAt:"2026-09-14T21:10:00.000Z"}
 ]});
 assert.equal(r.label,"AFTER-HOURS PRICE");
});

test("overnight official close is explicit, never called live",()=>{
 const r=selectMarketDisplayQuote({symbol:"BE",session:"OVERNIGHT",asOf:"2026-09-15T03:00:00.000Z",officialClose:{price:254.82,asOf:"2026-09-14T20:00:00.000Z",source:"canonical-close"}});
 assert.equal(r.price,254.82); assert.equal(r.label,"LAST OFFICIAL CLOSE");
});
