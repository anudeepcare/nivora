import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const stock=fs.readFileSync(new URL("../components/StockClient.tsx",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../app/globals.css",import.meta.url),"utf8");

test("stock action toolbar separates real actions from read-only market levels",()=>{
  assert.match(stock,/className="v6510ActionToolbar"/);
  assert.match(stock,/className="v6510ActionButtons"/);
  assert.match(stock,/className="v6510MarketLevels"/);
  assert.match(stock,/aria-label="Market levels"/);
});

test("watchlist action still invokes persistence handler and track position still navigates to portfolio",()=>{
  assert.match(stock,/<button[^>]*onClick=\{watch\}/);
  assert.match(stock,/href=\{"\/portfolio\?symbol="\+encodeURIComponent\(symbol\)\}/);
  assert.match(stock,/from\("watchlist_items"\)\.upsert/);
});

test("desktop toolbar aligns actions and levels on the shared content row while mobile wraps",()=>{
  assert.match(css,/\.v6510ActionToolbar\{[^}]*display:flex[^}]*justify-content:space-between/s);
  assert.match(css,/\.v6510MarketLevels span\{[^}]*border:0/s);
  assert.match(css,/@media\(max-width:760px\)\{\.v6510ActionToolbar\{[^}]*align-items:flex-start/s);
});
