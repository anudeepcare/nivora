import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import * as feed from "../lib/home-feed.ts";

for (const senti of [true, false]) {
  test(`Home route bounds stalled ${senti ? "SentiSense" : "EODHD"} calendar independently of completed news`, {timeout:1000}, async () => {
    const budgets = [];
    const bindings = {
      "@/lib/sentisense-supporting": { sentiSenseNews:async()=>({items:[]}), sentiSenseCalendar:()=>new Promise(()=>{}) },
      "@/lib/market-source-mode": {isSentiSenseMarket:()=>senti},
      "@/lib/server": {account:async()=>({user:{id:"test"}}),limit:async()=>{},privateJson:value=>value,failure:error=>{throw error;},HttpError:Error},
      "@/lib/eodhd": {eodEnabled:()=>true,eodNews:async()=>({items:[]}),eodRequest:()=>new Promise(()=>{})},
      "@/lib/eodhd-normalize": {eodTicker:s=>s+".US"},
      "@/lib/home-feed": {...feed,settledFeedMap:(values,read,concurrency,budget=12000)=>{
        budgets.push(budget);
        return feed.settledFeedMap(values,read,concurrency,20);
      }},
    };
    const code = ts.transpileModule(fs.readFileSync("app/api/home-feed/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    const module = {exports:{}};
    new Function("require","module","exports",code)(name=>{assert.ok(name in bindings,name);return bindings[name];},module,module.exports);
    const output = await module.exports.GET(new Request("https://example.test/api/home-feed?symbols=APP"));
    assert.equal(output.eventsReady,false);
    assert.equal(output.newsReady,true);
    assert.equal(output.newsFollowed,1);
    assert.deepEqual(output.events,[]);
    assert.ok(output.issues.some(x=>/events/i.test(x)));
    assert.equal(budgets.length,2);
    assert.ok(budgets.every(x=>x===12000));
  });
}
