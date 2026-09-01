import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
import test from 'node:test';import assert from 'node:assert/strict';
const session=require('../.engine-test/nivora-market-session.js');
const quote=require('../.engine-test/nivora-live-quote.js');

test('classifies US equity premarket regular after-hours and closed sessions',()=>{
 assert.equal(session.marketSessionAt(new Date('2026-09-01T12:00:00Z')),'PRE_MARKET'); // 08:00 ET
 assert.equal(session.marketSessionAt(new Date('2026-09-01T15:00:00Z')),'REGULAR'); // 11:00 ET
 assert.equal(session.marketSessionAt(new Date('2026-09-01T21:00:00Z')),'AFTER_HOURS'); // 17:00 ET
 assert.equal(session.marketSessionAt(new Date('2026-09-02T01:00:00Z')),'CLOSED'); // 21:00 ET
});

test('marks live quotes stale by session-sensitive age',()=>{
 assert.equal(session.quoteFreshness(20,'REGULAR'),'LIVE');
 assert.equal(session.quoteFreshness(200,'REGULAR'),'STALE');
 assert.equal(session.quoteFreshness(240,'PRE_MARKET'),'STALE');
 assert.equal(session.quoteFreshness(600,'CLOSED'),'LAST_TRADE');
});

test('normalizes Twelve extended-hours quote without inventing overnight data',()=>{
 const q=quote.normalizeTwelveQuote({symbol:'IREN',close:'47.82',previous_close:'45.63',change:'2.19',percent_change:'4.80',timestamp:1788267600,is_extended_hours:true},new Date('2026-09-01T12:00:00Z'));
 assert.equal(q.symbol,'IREN');assert.equal(q.price,47.82);assert.equal(q.regularClose,45.63);assert.equal(q.session,'PRE_MARKET');assert.equal(q.isExtendedHours,true);assert.equal(q.provider,'twelvedata');
});
