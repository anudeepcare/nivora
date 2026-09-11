import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css=fs.readFileSync("app/auryn-premium.css","utf8");
const overview=fs.readFileSync("components/premium/AurynResearchOverview.tsx","utf8");
const holdings=fs.readFileSync("components/portfolio/HoldingsIntelligence.tsx","utf8");
const stock=fs.readFileSync("components/StockClient.tsx","utf8");
const priceChart=fs.readFileSync("components/PriceChart.tsx","utf8");

test("desktop hero has a real gap before pulse and chart never relies on overlay",()=>{
  assert.match(css,/\.v938FirstViewport\{/);
  assert.match(css,/\.v936HeroGrid\{[^}]*height:auto!important/);
  assert.match(css,/\.v936PulseGrid\{[^}]*margin-top:12px!important/);
});

test("long actions use a smaller display size without shrinking short calls",()=>{
  assert.match(css,/\.v936CallHero\.action-start h2/);
  assert.match(css,/\.v936CallHero\.action-reduce h2/);
});

test("scenario outlook renders three isolated tiles",()=>{
  assert.match(overview,/v938ScenarioTile bull/);
  assert.match(overview,/v938ScenarioTile base/);
  assert.match(overview,/v938ScenarioTile bear/);
  assert.match(css,/\.v938ScenarioTile\{/);
});

test("missing price cannot become a fake zero return",()=>{
  assert.match(holdings,/const finiteNum=/);
  assert.match(holdings,/current=finiteNum\(x\.price\)/);
  assert.match(holdings,/pnlPct=!cash&&avg!=null&&avg>0&&current!=null/);
});

test("same URL GETs share an in-flight promise and short-lived response cache",()=>{
  assert.match(stock,/const inflightJson=new Map<string,Promise<any>>\(\)/);
  assert.match(stock,/function sharedJson\(/);
  assert.match(stock,/inflightJson\.get\(url\)/);
  assert.match(stock,/responseJsonCache\.set\(url/);
});

test("price chart honors CSS container height instead of forcing 430px",()=>{
  assert.match(priceChart,/const chartHeight=Math\.round\(el\.current\.clientHeight\)/);
  assert.match(priceChart,/height:chartHeight>120\?chartHeight:\(mobile\?280:430\)/);
  assert.match(priceChart,/const nextHeight=Math\.round\(el\.current\.clientHeight\)/);
});
