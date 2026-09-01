import fs from 'node:fs';
import assert from 'node:assert/strict';

const run=fs.readFileSync(new URL('../app/api/trading-lab/run-paper/route.ts',import.meta.url),'utf8');
const status=fs.readFileSync(new URL('../app/api/trading-lab/status/route.ts',import.meta.url),'utf8');
const page=fs.readFileSync(new URL('../app/trading-lab/page.tsx',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('../supabase/20260901_nivora_v61_trading_lab_console.sql',import.meta.url),'utf8');
const evaluation=fs.readFileSync(new URL('../lib/nivora-trading-evaluation.ts',import.meta.url),'utf8');

assert.match(migration,/nivora_v61_trade_evaluations/,'migration must persist every Trading Lab evaluation');
assert.match(run,/trade_evaluations/,'paper cycle must persist NO_INTENT, BLOCKED, DUPLICATE and SUBMITTED evaluations');
assert.match(run,/explainNoIntent/,'paper cycle must use the canonical no-intent explanation helper');
assert.match(evaluation,/No paper position exists to exit/,'SELL without a paper position must explain why no order is created');
assert.match(status,/recentEvaluations/,'status route must expose recent evaluation audit rows');
assert.match(page,/RECENT DECISIONS/,'Trading Lab must render the recent decision audit table');
assert.match(page,/Risk \/ Order/,'audit table must expose risk or order outcome');

assert.match(run,/if\(error\)throw error/,'evaluation persistence failures must fail loudly');
assert.match(status,/auditStatus/,'status route must report whether the evaluation audit migration is available');
