import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('Today refreshes exactly one requested watchlist security through the fixed research route',async()=>{
  const source=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8');
  assert.match(source,/\[data-today-refresh\]/);
  assert.match(source,/watchlistEvidenceRequests\.next\(symbol\)/);
  assert.match(source,/\/api\/research\/'\+encodeURIComponent\(symbol\)/);
  assert.match(source,/normalizeWatchlistEvidence\(symbol,response\)/);
  assert.doesNotMatch(source,/today-refresh-all/);
});

test('Today session expiry clears loading and preserves the centralized unlock screen',async()=>{const source=await fs.readFile(new URL('../src/public/app.js',import.meta.url),'utf8'),start=source.indexOf("[data-today-refresh]"),handler=source.slice(start,source.indexOf('const recoveryObserver',start));assert.match(handler,/error\.message==='session-expired'/);assert.match(handler,/watchlistEvidence\.delete\(symbol\)/);assert.match(handler,/return/);assert.doesNotMatch(handler,/session-expired'&&.*render\('today'\)/s)});
