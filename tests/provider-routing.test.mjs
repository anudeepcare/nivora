import test from "node:test";
import assert from "node:assert/strict";
import {
  preferredMarketSources,
  readPreferred,
} from "../lib/provider-routing.ts";
test("both subscriptions have separate jobs with one fallback, not duplicate requests", async () => {
  const both = { twelve: true, eodhd: true };
  assert.deepEqual(preferredMarketSources("quote", both), ["twelve", "eodhd"]);
  assert.deepEqual(preferredMarketSources("intraday", both), [
    "twelve",
    "eodhd",
  ]);
  assert.deepEqual(preferredMarketSources("daily", both), ["eodhd", "twelve"]);
  assert.deepEqual(
    preferredMarketSources("daily", { twelve: true, eodhd: false }),
    ["twelve"],
  );
  const calls = [];
  const result = await readPreferred(["twelve", "eodhd"], async (p) => {
    calls.push(p);
    return 123;
  });
  assert.deepEqual(calls, ["twelve"]);
  assert.deepEqual(result, { value: 123, provider: "twelve", fallback: false });
});
test("fallback retains its own provenance and complete value; both failures propagate", async () => {
  const calls = [];
  const result = await readPreferred(["twelve", "eodhd"], async (p) => {
    calls.push(p);
    if (p === "twelve") throw Error("Unavailable");
    return [1, 2];
  });
  assert.deepEqual(result, {
    value: [1, 2],
    provider: "eodhd",
    fallback: true,
  });
  assert.deepEqual(calls, ["twelve", "eodhd"]);
  await assert.rejects(
    readPreferred(["twelve", "eodhd"], async () => {
      throw Error("Unavailable");
    }),
    /Unavailable/,
  );
});

test("provider cache policy keeps quotes short and company/search metadata longer", async () => {
  const { providerCacheSeconds } = await import("../lib/provider-routing.ts");
  assert.equal(typeof providerCacheSeconds, "function");
  assert.equal(providerCacheSeconds("quote", {}), 30);
  assert.equal(providerCacheSeconds("time_series", { interval: "1day" }), 3600);
  assert.equal(providerCacheSeconds("time_series", { interval: "1h" }), 60);
  assert.equal(providerCacheSeconds("profile", {}), 86400);
});

test('quote selection tries backup for stale prices and retains newest dated stale observation on outage',async()=>{
 const {readFreshQuote}=await import('../lib/provider-routing.ts');
 const calls=[];const old={quote:{price:10,asOf:'2026-10-16T20:00:00Z',stale:true}};const fresh={quote:{price:11,asOf:'2026-10-19T13:31:00Z',stale:false}};
 const result=await readFreshQuote(['twelve','eodhd'],async p=>{calls.push(p);return p==='twelve'?old:fresh;});
 assert.equal(result.value,fresh);assert.deepEqual(calls,['twelve','eodhd']);
 const retained=await readFreshQuote(['twelve','eodhd'],async p=>{if(p==='eodhd')throw Error('offline');return old;});assert.equal(retained.value,old);assert.equal(retained.value.quote.stale,true);
});

test('crypto search routes ADA and DOGE to pairs and saved crypto positions retain asset identity',async()=>{
 const {cryptoSearchSymbol}=await import('../lib/search-selection.ts');const {normalizePositions}=await import('../lib/workspace.ts');
 for(const q of ['ADA','Cardano','ADA-USD','ADA/USD'])assert.equal(cryptoSearchSymbol(q),'ADA/USD');
 for(const q of ['DOGE','Dogecoin','DOGEUSD'])assert.equal(cryptoSearchSymbol(q),'DOGE/USD');
 assert.equal(cryptoSearchSymbol('CRM'),null);
 assert.equal(normalizePositions([{id:'1',symbol:'ADA',asset_type:'CRYPTO',shares:5,avg_cost:1,currency:'USD'}])[0].symbol,'ADA/USD');
});
test('old close is stale during scheduled US hours even if provider open flag is false',async()=>{const {normalizeQuote}=await import('../lib/market.ts');const q=normalizeQuote({close:10,timestamp:Date.parse('2026-10-16T20:00:00Z')/1000,currency:'USD',is_market_open:false},'IREN',Date.parse('2026-10-19T13:31:00Z'));assert.equal(q.stale,true);});
