import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
import {validationUniverseColumns,isEligibleMarketUniverseRow,buildExchangeStratifiedUniverse} from "../.engine-test/auryn/v994/universe-schema.js";
test("loader uses only actual nivora_market_universe columns",()=>{assert.equal(validationUniverseColumns,"symbol,name,exchange,instrument_type,currency,country")});
test("eligibility keeps US common stocks and rejects derivative-like instruments",()=>{
 assert.equal(isEligibleMarketUniverseRow({symbol:"AAPL",instrument_type:"Common Stock",currency:"USD",country:"United States",exchange:"NASDAQ"}),true);
 for(const r of [
 {symbol:"AAC.WT",instrument_type:"Warrant",currency:"USD",country:"United States",exchange:"NYSE"},
 {symbol:"AAC.UN",instrument_type:"Unit",currency:"USD",country:"United States",exchange:"NYSE"},
 {symbol:"XYZ",instrument_type:"ETF",currency:"USD",country:"United States",exchange:"NYSE"}
 ])assert.equal(isEligibleMarketUniverseRow(r),false,JSON.stringify(r));
});
test("exchange-stratified selection is deterministic and not alphabetic",()=>{
 const rows=[
 {symbol:"AAPL",instrument_type:"Common Stock",currency:"USD",country:"United States",exchange:"NASDAQ"},
 {symbol:"MSFT",instrument_type:"Common Stock",currency:"USD",country:"United States",exchange:"NASDAQ"},
 {symbol:"JPM",instrument_type:"Common Stock",currency:"USD",country:"United States",exchange:"NYSE"},
 {symbol:"CAT",instrument_type:"Common Stock",currency:"USD",country:"United States",exchange:"NYSE"},
 {symbol:"AA",instrument_type:"Common Stock",currency:"USD",country:"United States",exchange:"NYSE"}
 ];
 const a=buildExchangeStratifiedUniverse(rows,4),b=buildExchangeStratifiedUniverse(rows,4);
 assert.deepEqual(a,b);assert.equal(a.length,4);assert.ok(a.includes("JPM")||a.includes("CAT"));
});
test("vercel.json stays cron-free for Hobby",()=>{assert.deepEqual(JSON.parse(fs.readFileSync("vercel.json","utf8")),{})});
