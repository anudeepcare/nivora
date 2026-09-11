import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url).pathname;
const read=p=>fs.readFileSync(root+p,'utf8');

test('decision bars accept Alpaca daily fallback and cache by completed session date',()=>{
  const src=read('lib/auryn/v934/twelve-multitimeframe.ts');
  assert.match(src,/fallbackDailyBars/);
  assert.match(src,/lastCompletedRegularSessionDate\(input\.asOf\)/);
  assert.match(src,/v9343.*1day.*session/i);
});

test('analyze launches a deep Alpaca daily fallback for core research',()=>{
  const src=read('app/api/analyze/[symbol]/route.ts');
  assert.match(src,/getRecentBars\(symbol,200/);
  assert.match(src,/fallbackDailyBars/);
  assert.doesNotMatch(src,/if\(!j&&v934Bars\.errors\?\.\["1D"\]\)return NextResponse\.json\(\{error:"Market history provider is temporarily unavailable/);
});

test('browser persists last verified research beyond a session and uses stale-while-refresh',()=>{
  const src=read('components/StockClient.tsx');
  assert.match(src,/localStorage\.getItem\(`auryn:core:/);
  assert.match(src,/localStorage\.setItem\(`auryn:core:/);
  assert.match(src,/STALE_CACHE_MAX_AGE/);
  assert.match(src,/hasUsableWarm/);
});

test('provider retry state cannot replace an already verified warm research snapshot',()=>{
  const src=read('components/StockClient.tsx');
  assert.match(src,/if\(showError&&live&&!stockWarmCache\.get\(symbol\)\?\.d\)/);
  assert.match(src,/loadCore\(!hasUsableWarm\)/);
});
